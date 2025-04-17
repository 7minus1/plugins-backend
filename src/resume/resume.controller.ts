import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { Body } from '@nestjs/common'; // 确保导入 Body 装饰器

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 1024 * 1024 * 5 // 5MB限制
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/(image\/.*|application\/(msword|vnd.openxmlformats-officedocument.wordprocessingml.document))|pdf$/) 
        || !file.originalname.match(/\.(png|jpg|jpeg|doc|docx|pdf)$/i)) {
        return cb(new Error('支持格式：PDF/Word/图片'), false);
      }
      cb(null, true);
    }
  }))
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Body() createResumeDto: CreateResumeDto
  ) {
    return this.resumeService.create(createResumeDto, file);
  }
}