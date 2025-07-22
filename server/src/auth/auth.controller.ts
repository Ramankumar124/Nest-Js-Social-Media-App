import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpUserDto, SigninUserDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async create(@Body() signUpUserDto: SignUpUserDto) {
    return await this.authService.createUser(signUpUserDto);
  }

  @Post('/signin')
  async login(@Body() signinUserDto: SigninUserDto) {
    return await this.authService.loginUser(signinUserDto);
  }
}
