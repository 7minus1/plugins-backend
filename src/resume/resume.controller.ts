import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';
import { UploadResumeDto } from './dto/upload-resume.dto';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(@UploadedFile() file: Express.Multer.File) {
    return this.resumeService.processResume(file);
  }
}