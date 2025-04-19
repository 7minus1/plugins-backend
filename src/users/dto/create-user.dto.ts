import { IsString, IsPhoneNumber, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  username?: string;

  @IsPhoneNumber('CN')
  phone: string;

  @IsString()
  @MinLength(6)
  @MinLength(6)
  verificationCode: string;
} 