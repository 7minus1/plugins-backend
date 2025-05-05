import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetResumeEvalDto {
  @ApiProperty({ description: '简历记录ID', required: true })
  @IsString()
  @IsNotEmpty()
  resumeId: string;
} 