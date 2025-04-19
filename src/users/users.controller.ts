import { Controller, Post, Body, Get, UseGuards, Request, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateBitableDto } from './dto/update-bitable.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 409, description: '邮箱已被注册或用户名已存在' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '邮箱或密码错误' })
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.usersService.validateUser(loginDto.email, loginDto.password);
    return this.usersService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('bitable')
  async updateBitableInfo(@Request() req, @Body() updateBitableDto: UpdateBitableDto) {
    return this.usersService.updateBitableInfo(req.user.userId, updateBitableDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bitable')
  async getBitableInfo(@Request() req) {
    return this.usersService.getBitableInfo(req.user.userId);
  }
} 