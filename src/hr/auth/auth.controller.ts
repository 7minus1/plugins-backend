import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HrAuthService } from './auth.service';
import { HrJwtAuthGuard } from './guards/jwt-auth.guard';

// @Controller('hr/auth')
@Controller('auth')
export class HrAuthController {
  constructor(private authService: HrAuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(HrJwtAuthGuard)
  @Post('logout')
  async logout() {
    return {
      success: true,
      message: '登出成功',
    };
  }
} 