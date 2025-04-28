import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobResumeService } from './resume.service';
import { JobJwtAuthGuard } from '../users/guards/job-jwt-auth.guard';
import { AddCompanyDto } from './dto/add-company.dto';
import { JobUsersService } from '../users/users.service';

@ApiTags('求职简历管理')
@Controller('job/resume')
export class JobResumeController {
  constructor(
    private readonly resumeService: JobResumeService,
    private readonly usersService: JobUsersService,
  ) {}

  @Post('company/add')
  @UseGuards(JobJwtAuthGuard)
  @ApiOperation({ summary: '添加公司信息到用户的公司信息表' })
  @ApiResponse({ status: 200, description: '添加成功' })
  @ApiResponse({ status: 400, description: '添加失败' })
  async addCompanyInfo(
    @Request() req,
    @Body() companyInfo: AddCompanyDto,
  ) {
    // 获取用户的公司信息表配置
    const bitableInfo = await this.usersService.getCompanyBitableInfo(req.user.userId);
    
    if (!bitableInfo.configured) {
      return {
        success: false,
        message: '您尚未配置公司信息表，请先配置多维表格'
      };
    }

    // 添加公司信息
    return this.resumeService.addCompanyToBitable(
      req.user.userId,
      companyInfo,
      bitableInfo.data
    );
  }
} 