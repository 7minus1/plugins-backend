import { IsString, IsUrl, IsOptional } from 'class-validator';

export class UpdateBitableDto {
  @IsString()
  @IsUrl()
  bitableUrl: string;

  @IsString()
  bitableToken: string;

  @IsString()
  @IsOptional()
  tableId?: string;
} 