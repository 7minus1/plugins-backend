import { IsString, IsUrl, IsOptional } from 'class-validator';

export class UpdateHrBitableDto {
  @IsString()
  @IsUrl()
  bitableUrl: string;

  @IsString()
  bitableToken: string;

  @IsString()
  @IsOptional()
  tableId?: string;
} 