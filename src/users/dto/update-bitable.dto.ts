import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateBitableDto {
  @IsString()
  @IsNotEmpty()
  bitableUrl: string;

  @IsString()
  @IsNotEmpty()
  bitableToken: string;
} 