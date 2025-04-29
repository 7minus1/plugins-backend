import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadPositionDto {
  @ApiProperty({ description: '职位名称', required: true })
  @IsString()
  @IsNotEmpty()
  position_name: string;

  @ApiProperty({ description: '公司链接', required: true })
  @IsString()
  // @IsNotEmpty()
  // @IsUrl()
  company_link: string;
} 