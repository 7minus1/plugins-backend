import { Controller, Post, Body, UseGuards, Request, UploadedFile, UseInterceptors, Get, Query, HttpException, HttpStatus, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JobResumeService } from './resume.service';
import { JobJwtAuthGuard } from '../users/guards/job-jwt-auth.guard';
import { AddCompanyDto } from './dto/add-company.dto';
import { JobUsersService } from '../users/users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JobInfoDto } from './dto/job-info.dto';
import { ResumeVersionDto, ResumeVersionResponse, GreetMessageResponse, ResumeImageResponse, EvalInfoResponse } from './dto/resume-version.dto';
import { Response } from 'express';
import * as fs from 'fs';
import { join } from 'path';

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

  @Get('version')
  @UseGuards(JobJwtAuthGuard)
  @ApiOperation({ summary: '获取简历版本文件' })
  @ApiQuery({ name: 'positionName', required: true, description: '职位名称' })
  @ApiQuery({ name: 'companyName', required: true, description: '公司名称' })
  @ApiResponse({ status: 200, description: '获取成功，返回文件流' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '未找到匹配的简历版本' })
  async getResumeByVersion(
    @Query() query: ResumeVersionDto,
    @Request() req,
    @Res() res: Response,
  ) {
    let filePath: string | null = null;
    
    try {
      // 获取用户ID
      const userId = req.user.userId;
      if (!userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: '用户未授权'
        });
      }

      // 获取用户的多维表格配置
      const userBitable = await this.usersService.getResumeBitableInfo(userId);
      if (!userBitable || !userBitable.configured) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: '请先配置简历信息表'
        });
      }

      // 解析多维表格参数
      const appToken = userBitable.data.bitableUrl.split('?')[0].split('/').pop();
      const tableId = userBitable.data.tableId;
      const bitableToken = userBitable.data.bitableToken;

      // 检查是否有必要的参数
      if (!query.positionName || !query.companyName) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: '缺少必要参数：职位名称或公司名称'
        });
      }

      // 获取简历版本文件
      const result = await this.resumeService.getResumeByVersion(
        appToken,
        tableId,
        bitableToken,
        query.positionName,
        query.companyName,
      );

      if (!result.success) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: result.message || '获取简历文件失败'
        });
      }

      // 获取文件路径
      filePath = join(process.cwd(), result.fileName);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: '文件不存在或下载失败'
        });
      }
      
      // 从文件名中提取正确的文件名（不含路径）
      const fileName = result.fileName.split('/').pop();
      
      // 设置响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      
      // 直接使用pipe发送文件流
      const fileStream = fs.createReadStream(filePath);
      
      // 监听错误事件
      fileStream.on('error', (error) => {
        console.error('文件流读取错误:', error);
        if (!res.headersSent) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: '文件读取失败'
          });
        }
      });
      
      // 文件传输完成后删除
      fileStream.on('end', () => {
        // 延迟删除临时文件，确保文件传输完成
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`临时文件已删除: ${filePath}`);
            }
          } catch (err) {
            console.error(`删除临时文件失败: ${filePath}`, err);
          }
        }, 1000); // 延迟1秒删除
      });
      
      // 发送文件流
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('获取简历版本失败:', error);
      
      // 如果响应头尚未发送，则发送错误响应
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: `获取简历版本失败: ${error.message}`
        });
      }
      
      // 尝试删除临时文件
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`清理临时文件失败: ${filePath}`, err);
        }
      }
    }
  }

  @Get('greet')
  @UseGuards(JobJwtAuthGuard)
  @ApiOperation({ summary: '获取打招呼语' })
  @ApiQuery({ name: 'positionName', required: true, description: '职位名称' })
  @ApiQuery({ name: 'companyName', required: true, description: '公司名称' })
  @ApiResponse({ status: 200, description: '获取成功，返回打招呼语', type: GreetMessageResponse })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '未找到匹配的打招呼语' })
  async getGreetMessage(
    @Query() query: ResumeVersionDto,
    @Request() req,
  ) {
    try {
      // 获取用户ID
      const userId = req.user.userId;
      if (!userId) {
        return {
          success: false,
          message: '用户未授权'
        };
      }

      // 获取用户的多维表格配置
      const userBitable = await this.usersService.getPositionBitableInfo(userId);
      if (!userBitable || !userBitable.configured) {
        return {
          success: false,
          message: '请先配置简历信息表'
        };
      }

      // 解析多维表格参数
      const appToken = userBitable.data.bitableUrl.split('?')[0].split('/').pop();
      const tableId = userBitable.data.tableId;
      const bitableToken = userBitable.data.bitableToken;

      // 检查是否有必要的参数
      if (!query.positionName || !query.companyName) {
        return {
          success: false,
          message: '缺少必要参数：职位名称或公司名称'
        };
      }

      // 获取打招呼语
      return this.resumeService.getGreetMsgByPosition(
        appToken,
        tableId,
        bitableToken,
        query.positionName,
        query.companyName,
      );
    } catch (error) {
      return {
        success: false,
        message: `获取打招呼语失败: ${error.message}`
      };
    }
  }

  @Get('image')
  @UseGuards(JobJwtAuthGuard)
  @ApiOperation({ summary: '获取简历图像' })
  @ApiQuery({ name: 'positionName', required: true, description: '职位名称' })
  @ApiQuery({ name: 'companyName', required: true, description: '公司名称' })
  @ApiResponse({ status: 200, description: '获取成功，返回图像在线链接', type: ResumeImageResponse })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '未找到匹配的简历图像' })
  async getResumeImages(
    @Query() query: ResumeVersionDto,
    @Request() req,
  ) {
    try {
      // 获取用户ID
      const userId = req.user.userId;
      if (!userId) {
        return {
          success: false,
          message: '用户未授权'
        };
      }

      // 获取用户的多维表格配置
      const userBitable = await this.usersService.getResumeBitableInfo(userId);
      if (!userBitable || !userBitable.configured) {
        return {
          success: false,
          message: '请先配置简历信息表'
        };
      }

      // 解析多维表格参数
      const appToken = userBitable.data.bitableUrl.split('?')[0].split('/').pop();
      const tableId = userBitable.data.tableId;
      const bitableToken = userBitable.data.bitableToken;

      // 检查是否有必要的参数
      if (!query.positionName || !query.companyName) {
        return {
          success: false,
          message: '缺少必要参数：职位名称或公司名称'
        };
      }

      // 获取简历图像
      return this.resumeService.getResumeImagesByPosition(
        appToken,
        tableId,
        bitableToken,
        query.positionName,
        query.companyName,
      );
    } catch (error) {
      return {
        success: false,
        message: `获取简历图像失败: ${error.message}`
      };
    }
  }

  @Get('eval')
  @UseGuards(JobJwtAuthGuard)
  @ApiOperation({ summary: '获取职位评估信息' })
  @ApiQuery({ name: 'positionName', required: true, description: '职位名称' })
  @ApiQuery({ name: 'companyName', required: true, description: '公司名称' })
  @ApiResponse({ status: 200, description: '获取成功，返回职位评估信息', type: EvalInfoResponse })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '未找到匹配的职位评估信息' })
  async getEvalInfo(
    @Query() query: ResumeVersionDto,
    @Request() req,
  ) {
    try {
      // 获取用户ID
      const userId = req.user.userId;
      if (!userId) {
        return {
          success: false,
          message: '用户未授权'
        };
      }

      // 获取用户的多维表格配置
      const userBitable = await this.usersService.getPositionBitableInfo(userId);
      if (!userBitable || !userBitable.configured) {
        return {
          success: false,
          message: '请先配置职位信息表'
        };
      }

      // 解析多维表格参数
      const appToken = userBitable.data.bitableUrl.split('?')[0].split('/').pop();
      const tableId = userBitable.data.tableId;
      const bitableToken = userBitable.data.bitableToken;

      // 检查是否有必要的参数
      if (!query.positionName || !query.companyName) {
        return {
          success: false,
          message: '缺少必要参数：职位名称或公司名称'
        };
      }

      // 获取职位评估信息
      return this.resumeService.getEvalInfoByPosition(
        appToken,
        tableId,
        bitableToken,
        query.positionName,
        query.companyName,
      );
    } catch (error) {
      return {
        success: false,
        message: `获取职位评估信息失败: ${error.message}`
      };
    }
  }
  
  @Get('test')
  async apiTest() {
    // return this.resumeService.test();
    return 'test';
  }

  @Post('test/position')
  @UseGuards(JobJwtAuthGuard)
  async testPosition(
    @Body('positionInfo') positionInfo: string,
  ) {
    return this.resumeService.testPosition(positionInfo);
  }
} 