import { AwardItemDto } from './resume.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateResumeDto {
  @ApiProperty({ description: '应聘职位', required: true })
  @IsNotEmpty()
  @IsString()
  readonly position: string;

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
