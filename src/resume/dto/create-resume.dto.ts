import { AwardItemDto } from './resume.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateResumeDto {
  @ApiProperty({ description: '投递岗位', required: true })
  @IsString()
  @IsNotEmpty()
  deliveryPosition: string;

  @IsString()
  @IsNotEmpty()
  deliveryChannel: string;

  readonly fileUrl?: string;
  readonly fileName?: string;
  readonly award_list?: AwardItemDto[];
  readonly education_list?: Array<{
    school: string;
    major: string;
    degree: string;
    startDate: string;
    endDate: string;
  }>;
}
