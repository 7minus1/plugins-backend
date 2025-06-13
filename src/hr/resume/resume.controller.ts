import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Request,
  Body,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HrResumeService } from './resume.service';
import { HrJwtAuthGuard } from '../users/guards/hr-jwt-auth.guard';
import { CreateHrResumeDto } from './dto/create-resume.dto';
import { GetResumeEvalDto } from './dto/get-resume-eval.dto';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('简历管理')
@Controller('hr/resume')
export class HrResumeController {
  constructor(private readonly resumeService: HrResumeService) {}

  @Post('upload')
  @UseGuards(HrJwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB限制
      },
      fileFilter: (req, file, cb) => {
        if (
          !file.mimetype.match(
            /(image\/.*|application\/(msword|vnd.openxmlformats-officedocument.wordprocessingml.document))|pdf$/,
          ) ||
          !file.originalname.match(/\.(png|jpg|jpeg|doc|docx|pdf)$/i)
        ) {
          return cb(new Error('支持格式：PDF/Word/图片'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: '上传简历' })
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Body() createResumeDto: CreateHrResumeDto,
  ) {
    return this.resumeService.processResume(file, req.user.userId, createResumeDto);
  }

  @Get('eval')
  @UseGuards(HrJwtAuthGuard)
  @ApiOperation({ summary: '获取简历评估信息' })
  @ApiQuery({ name: 'resumeId', required: true, description: '简历记录ID' })
  async getResumeEval(
    @Query('resumeId') resumeId: string,
    @Request() req,
  ) {
    return this.resumeService.getResumeEvalByResumeId(resumeId, req.user.userId);
  }
} 