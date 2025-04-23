import {
  IsString,
  IsMobilePhone,
  MinLength,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsMobilePhone('zh-CN')
  phoneNumber: string;
}
