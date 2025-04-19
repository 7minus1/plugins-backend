import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { phone: string; verificationCode: string }) {
    return this.authService.login(loginDto.phone, loginDto.verificationCode);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    return {
      success: true,
      message: '登出成功'
    };
  }
} 