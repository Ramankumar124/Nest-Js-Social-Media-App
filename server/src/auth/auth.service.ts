import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './auth.schema';
import { Model } from 'mongoose';
import { SignUpUserDto } from './dto/sign-up.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SigninUserDto } from './dto/sign-in.dto';

export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  posts: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /**
   * Transform user document to response format
   * @param user - User document
   * @returns User response without sensitive fields
   */
  private transformUserToResponse(user: any): UserResponse {
    const { password, refreshToken, ...userWithoutPassword } = user.toObject();
    return {
      ...userWithoutPassword,
      _id: userWithoutPassword._id.toString(),
    };
  }

  /**
   * Create a new user
   * @param signUpUserDto - User creation data
   * @returns Created user without password
   */
  async createUser(signUpUserDto: SignUpUserDto): Promise<UserResponse> {
    try {
      const existingUser = await this.userModel.findOne({
        email: signUpUserDto.email,
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Create new user
      const newUser = new this.userModel(signUpUserDto);
      const savedUser = await newUser.save();

      return this.transformUserToResponse(savedUser);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * Login user with email and password
   * @param signinUserDto - Login credentials
   * @returns User with tokens
   */

  async loginUser(signinUserDto: SigninUserDto): Promise<{
    user: UserResponse;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = signinUserDto;

    const user = (await this.userModel
      .findOne({ email })
      .select('+password')) as any;
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: this.transformUserToResponse(user),
      accessToken,
      refreshToken,
    };
  }

  //   /**
  //    * Get all users
  //    * @returns Array of users without passwords
  //    */
  //   async findAllUsers(): Promise<UserResponse[]> {
  //     const users = await this.userModel.find().populate('posts');
  //     return users.map((user) => this.transformUserToResponse(user));
  //   }

  //   /**
  //    * Get user by ID
  //    * @param id - User ID
  //    * @returns User without password
  //    */
  //   async findUserById(id: string): Promise<UserResponse> {
  //     const user = await this.userModel.findById(id).populate('posts');
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }

  //     return this.transformUserToResponse(user);
  //   }

  //   /**
  //    * Get user by email
  //    * @param email - User email
  //    * @returns User without password
  //    */
  //   async findUserByEmail(email: string): Promise<UserResponse> {
  //     const user = await this.userModel.findOne({ email }).populate('posts');
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }

  //     return this.transformUserToResponse(user);
  //   }

  //   /**
  //    * Update user by ID
  //    * @param id - User ID
  //    * @param updateUserDto - Update data
  //    * @returns Updated user without password
  //    */
  //   async updateUser(
  //     id: string,
  //     updateUserDto: UpdateUserDto,
  //   ): Promise<UserResponse> {
  //     // Check if email is being updated and if it's already taken
  //     if (updateUserDto.email) {
  //       const existingUser = await this.userModel.findOne({
  //         email: updateUserDto.email,
  //         _id: { $ne: id },
  //       });
  //       if (existingUser) {
  //         throw new ConflictException('Email is already taken by another user');
  //       }
  //     }

  //     const updatedUser = await this.userModel
  //       .findByIdAndUpdate(id, updateUserDto, { new: true, runValidators: true })
  //       .populate('posts');

  //     if (!updatedUser) {
  //       throw new NotFoundException('User not found');
  //     }

  //     return this.transformUserToResponse(updatedUser);
  //   }

  //   /**
  //    * Delete user by ID
  //    * @param id - User ID
  //    * @returns Success message
  //    */
  //   async deleteUser(id: string): Promise<{ message: string }> {
  //     const deletedUser = await this.userModel.findByIdAndDelete(id);
  //     if (!deletedUser) {
  //       throw new NotFoundException('User not found');
  //     }

  //     return { message: 'User deleted successfully' };
  //   }

  //   /**
  //    * Logout user by clearing refresh token
  //    * @param id - User ID
  //    * @returns Success message
  //    */
  //   async logoutUser(id: string): Promise<{ message: string }> {
  //     const user = await this.userModel.findById(id);
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }

  //     user.refreshToken = undefined;
  //     await user.save();

  //     return { message: 'User logged out successfully' };
  //   }

  //   /**
  //    * Refresh access token using refresh token
  //    * @param refreshToken - Refresh token
  //    * @returns New access token
  //    */
  //   async refreshAccessToken(
  //     refreshToken: string,
  //   ): Promise<{ accessToken: string }> {
  //     const user = (await this.userModel
  //       .findOne({ refreshToken })
  //       .select('+refreshToken')) as any;
  //     if (!user) {
  //       throw new UnauthorizedException('Invalid refresh token');
  //     }

  //     const newAccessToken = user.createAccessToken();
  //     return { accessToken: newAccessToken };
  //   }

  //   /**
  //    * Add post to user's posts array
  //    * @param userId - User ID
  //    * @param postId - Post ID
  //    * @returns Updated user
  //    */
  //   async addPostToUser(userId: string, postId: string): Promise<UserResponse> {
  //     const user = await this.userModel
  //       .findByIdAndUpdate(userId, { $push: { posts: postId } }, { new: true })
  //       .populate('posts');

  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }

  //     return this.transformUserToResponse(user);
  //   }

  //   /**
  //    * Remove post from user's posts array
  //    * @param userId - User ID
  //    * @param postId - Post ID
  //    * @returns Updated user
  //    */
  //   async removePostFromUser(
  //     userId: string,
  //     postId: string,
  //   ): Promise<UserResponse> {
  //     const user = await this.userModel
  //       .findByIdAndUpdate(userId, { $pull: { posts: postId } }, { new: true })
  //       .populate('posts');

  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }

  //     return this.transformUserToResponse(user);
  //   }
}
