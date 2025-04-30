import { IsNotEmpty, IsString, IsOptional, IsUrl, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JobInfoDto {
  @ApiProperty({ description: '职位名称', required: true })
  @IsString()
  @IsNotEmpty()
  position_name: string;

  @ApiProperty({ description: '职位类型', required: false })
  @IsString()
  @IsOptional()
  position_type: string;

  @ApiProperty({ description: '职位地点', required: false })
  @IsString()
  @IsOptional()
  position_location: string;

  @ApiProperty({ description: '职位状态', required: false })
  @IsString()
  @IsOptional()
  position_status: string;

  @ApiProperty({ description: '薪资范围', required: false })
  @IsString()
  @IsOptional()
  salary_range: string;

  @ApiProperty({ description: '工作经验', required: false })
  @IsString()
  @IsOptional()
  experience_requirement: string;

  @ApiProperty({ description: '学历要求', required: false })
  @IsString()
  @IsOptional()
  education_requirement: string;

  @ApiProperty({ description: '公司福利', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  company_benefits: string[];

  @ApiProperty({ description: '职位标签', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  position_tags: string[];

  @ApiProperty({ description: '职位描述', required: false })
  @IsString()
  @IsOptional()
  position_description: string;

  @ApiProperty({ description: '职位地址', required: false })
  @IsString()
  @IsOptional()
  position_address: string;

  @ApiProperty({ description: 'boss职位发布人', required: false })
  @IsString()
  @IsOptional()
  publisher_name: string;

  @ApiProperty({ description: 'boss职位发布人头像', required: false })
  @IsString()
  @IsOptional()
  publisher_avatar: string;

  @ApiProperty({ description: '公司链接', required: true })
  @IsString()
  @IsNotEmpty()
  company_link: string;

  @ApiProperty({ description: '公司名称', required: false })
  @IsString()
  @IsOptional()
  company_name: string;

  @ApiProperty({ description: '职位链接', required: false })
  @IsString()
  @IsOptional()
  job_link: string;
} 