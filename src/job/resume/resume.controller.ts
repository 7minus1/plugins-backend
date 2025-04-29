import { Controller, Post, Body, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JobResumeService } from './resume.service';
import { JobJwtAuthGuard } from '../users/guards/job-jwt-auth.guard';
import { AddCompanyDto } from './dto/add-company.dto';
import { JobUsersService } from '../users/users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JobInfoDto } from './dto/job-info.dto';

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

  @Post('position/upload')
  @UseGuards(JobJwtAuthGuard)
  @ApiOperation({ summary: '上传职位详情图像到用户的职位信息表' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '职位详情图像文件',
        },
        jobInfo: {
          type: 'string',
          description: '职位信息JSON字符串，包含position_name、company_link等字段',
          example: JSON.stringify({
            position_name: '前端开发工程师',
            company_link: 'https://example.com',
            position_type: '技术',
            position_location: '北京',
            salary_range: '20k-30k',
            company_name: '示例公司'
          })
        }
      },
    },
  })
  @ApiResponse({ status: 200, description: '上传成功' })
  @ApiResponse({ status: 400, description: '上传失败' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB限制
      },
      fileFilter: (req, file, cb) => {
        if (
          !file.mimetype.match(/image\/.*/) ||
          !file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        ) {
          return cb(new Error('仅支持JPG、PNG、GIF、WEBP等图像格式文件'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPositionFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Body() body: { jobInfo: string },
  ) {
    if (!file) {
      return {
        success: false,
        message: '请上传职位详情图像文件'
      };
    }
    
    // 解析jobInfo字符串为对象
    let jobInfo: JobInfoDto;
    try {
      jobInfo = JSON.parse(body.jobInfo);
    } catch (error) {
      console.error('jobInfo解析失败:', error);
      return {
        success: false,
        message: 'jobInfo参数格式不正确'
      };
    }
    
    // 获取用户的职位信息表配置
    const bitableInfo = await this.usersService.getPositionBitableInfo(req.user.userId);
    
    if (!bitableInfo.configured) {
      return {
        success: false,
        message: '您尚未配置职位信息表，请先配置多维表格'
      };
    }

    // 上传职位信息
    return this.resumeService.uploadPositionToBitable(
      file,
      req.user.userId,
      jobInfo,
      bitableInfo.data
    );
  }
} 