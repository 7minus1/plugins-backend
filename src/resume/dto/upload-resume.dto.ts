import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class UploadResumeDto {
  @IsNotEmpty()
  @IsString()
  originalname: string;

  @IsNotEmpty()
  @IsString()
  mimetype: string;

  @IsNotEmpty()
  @IsNumber()
  size: number;

  @IsOptional()
  @IsString()
  encoding?: string;
}