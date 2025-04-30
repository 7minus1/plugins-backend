import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JobUsersService } from './users.service';
import { JobJwtAuthGuard } from './guards/job-jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateJobBitableDto } from './dto/update-bitable.dto';
import { SendJobVerificationCodeDto, VerifyJobCodeDto } from './dto/phone-login.dto';
import { BitableConfigException } from '../../common/exceptions/bitable-config.exception';

@ApiTags('求职用户管理')
@Controller('job/users')
export class JobUsersController {
  constructor(
    private readonly usersService: JobUsersService,
  ) {}

  @Post('send-verification-code')
  @ApiOperation({ summary: '发送验证码' })
  @ApiResponse({ status: 200, description: '发送成功' })
  @ApiResponse({ status: 400, description: '发送失败' })
  async sendVerificationCode(@Body() dto: SendJobVerificationCodeDto) {
    const result = await this.usersService.sendVerificationCode(dto.phoneNumber);
    if (!result.success) {
      if (result.codeExists) {
        throw new HttpException('验证码已发送，请注意查收', HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException('验证码发送失败', HttpStatus.BAD_REQUEST);
      }
    }
    return { message: '验证码发送成功' };
  }

  @Post('verify-code')
  @ApiOperation({ summary: '验证码登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 400, description: '验证码错误' })
  async verifyCode(@Body() dto: VerifyJobCodeDto) {
    const isValid = await this.usersService.verifyCode(
      dto.phoneNumber,
      dto.code,
    );
    if (!isValid) {
      throw new HttpException('验证码错误或已过期', HttpStatus.BAD_REQUEST);
    }
    return this.usersService.loginOrRegisterWithPhone(dto.phoneNumber);
  }

  @UseGuards(JobJwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    return {
      id: user.id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // @UseGuards(JobJwtAuthGuard)
  // @Get('bitable')
  // async getBitableInfo(@Request() req) {
  //   return this.usersService.getBitableInfo(req.user.userId);
  // }

  @Post('test-sms')
  @ApiOperation({ summary: '测试发送短信' })
  @ApiResponse({ status: 200, description: '发送成功' })
  @ApiResponse({ status: 400, description: '发送失败' })
  async testSms(@Body() dto: SendJobVerificationCodeDto) {
    const result = await this.usersService.testSendSms(dto.phoneNumber);
    if (!result.success) {
      throw new HttpException('短信发送失败，请检查配置', HttpStatus.BAD_REQUEST);
    }
    return {
      message: '短信发送成功',
      phoneNumber: dto.phoneNumber,
      code: result.code, // 仅测试环境返回验证码
    };
  }

  @UseGuards(JobJwtAuthGuard)
  @Get('vip-status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取VIP状态',
    description: '获取当前用户的VIP状态和到期时间',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        isVip: {
          type: 'boolean',
          description: '是否是VIP用户',
        },
        vipExpireDate: {
          type: 'string',
          format: 'date-time',
          description: 'VIP到期时间，非VIP用户为null',
        },
      },
    },
  })
  async getVipStatus(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    return {
      isVip: user.isVip,
      vipExpireDate: user.vipExpireDate,
    };
  }

  @UseGuards(JobJwtAuthGuard)
  @Get('upload-count')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取上传次数',
    description: '获取当前用户的上传次数信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        uploadCount: {
          type: 'number',
          description: '已使用上传次数',
        },
        remainingCount: {
          type: 'number',
          description: '剩余上传次数（VIP用户无限制）',
        },
        isUnlimited: {
          type: 'boolean',
          description: '是否有无限制上传权限（VIP用户）',
        },
      },
    },
  })
  async getUploadCount(@Request() req) {
    return await this.usersService.getUploadCount(req.user.userId);
  }

  @UseGuards(JobJwtAuthGuard)
  @Put('bitable')
  @ApiOperation({ summary: '更新多维表格配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateBitableInfo(
    @Request() req,
    @Body() updateBitableDto: UpdateJobBitableDto,
  ) {
    try {
      const result = await this.usersService.updateBitableInfo(
        req.user.userId,
        updateBitableDto,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof BitableConfigException) {
        return {
          success: false,
          message: '飞书多维表格配置验证失败，请确保URL和Token正确且有访问权限',
        };
      }
      return {
        success: false,
        message: `更新失败: ${error.message}`,
      };
    }
  }

  @UseGuards(JobJwtAuthGuard)
  @Get('bitable')
  @ApiOperation({ summary: '获取多维表格配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBitableInfo(@Request() req) {
    return this.usersService.getBitableInfo(req.user.userId);
  }
}