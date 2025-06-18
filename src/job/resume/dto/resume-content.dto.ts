import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateResumeContentDto {
  @ApiProperty({ description: '简历内容', required: false })
  @IsString()
  @IsOptional()
  content?: string;
} 