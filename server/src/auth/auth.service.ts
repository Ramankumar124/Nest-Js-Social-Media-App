import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './auth.schema';
import { Model } from 'mongoose';
import { SignUpUserDto } from './dto/sign-up.dto';
import { SigninUserDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import refreshJwtConfig from './config/refresh-jwt.config';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private jwtService: JwtService,
    private userService: UserService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async generateTokens(userId: string) {
    const payload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Create a new user
   * @param signUpUserDto - User creation data
   * @returns Created user without password
   */
  async signUp(signUpData: SignUpUserDto) {
    const { email, name, password } = signUpData;
    const existingUser = await this.userModel.findOne({
      email: email,
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    const hashedPassword = await argon2.hash(password);

    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = await this.generateTokens(
      user._id as string,
    );
    return {
      userId: user._id,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with email and password
   * @param signinUserDto - Login credentials
   * @returns User with tokens
   */

  async signIn(signinData: SigninUserDto) {
    const { email, password } = signinData;

    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('user', user);

    const isPasswordValid = await argon2.verify(user.password, password);
    console.log('password ', password, ' user password ', user.password);
    console.log('is', isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user._id as string,
    );
    await this.userService.updateRefreshToken(user._id as string, refreshToken);
    return {
      accessToken,
      refreshToken,
      userId: user._id,
    };
  }

  /**
   * Logout user by clearing their refresh token
   * @param userId - User ID to logout
   * @returns Success message
   */
  async logout(userId: string) {
    const user = await this.userModel.findById(userId).select('+refreshToken');

    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    // Clear the refresh token from the database
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Refresh access and refresh tokens using a valid refresh token
   * @param userId - User ID requesting token refresh
   * @param refreshToken - Current refresh token
   * @returns New access and refresh tokens
   */
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId).select('+refreshToken');

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token or user');
    }
    const isrefreshTokenMatches = await argon2.verify(
      user.refreshToken,
      refreshToken,
    );
    if (!isrefreshTokenMatches) throw new ForbiddenException('Access Denied');
    const tokens = await this.generateTokens(user._id as string);
    await this.userService.updateRefreshToken(
      user._id as string,
      tokens.refreshToken,
    );
    return tokens;
  }
}
