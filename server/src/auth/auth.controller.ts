import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpUserDto, SigninUserDto } from './dto';
import { Public } from './decorators/public.decorator';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { GetCurrentUser, GetCurrentUserId } from './decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() signUpData: SignUpUserDto) {
    return await this.authService.signUp(signUpData);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async login(@Body() signinData: SigninUserDto) {
    return await this.authService.signIn(signinData);
  }

  @Public()
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refreshTokens(
    @GetCurrentUserId() userId: string, // From JWT payload.sub
    @GetCurrentUser('refreshToken') refreshToken: string, // From RtStrategy.validate()
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
