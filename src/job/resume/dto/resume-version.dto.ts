import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResumeVersionDto {
  @ApiProperty({
    description: '职位名称',
    required: true,
  })
  @IsNotEmpty({ message: '职位名称不能为空' })
  @IsString({ message: '职位名称必须是字符串' })
  positionName: string;

  @ApiProperty({
    description: '公司名称',
    required: true,
  })
  @IsNotEmpty({ message: '公司名称不能为空' })
  @IsString({ message: '公司名称必须是字符串' })
  companyName: string;
}

export class ResumeVersionResponse {
  success: boolean;
  message?: string;
  fileUrl?: string;
  fileName?: string;
}

export class GreetMessageResponse {
  success: boolean;
  message?: string;
  greetMsg?: string[];
}

export class ResumeImageResponse {
  success: boolean;
  message?: string;
  fileUrls?: string[];
} 