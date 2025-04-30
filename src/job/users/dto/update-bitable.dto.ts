import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateJobBitableDto {
  @IsNotEmpty({ message: '飞书多维表URL不能为空' })
  @IsUrl({}, { message: '请输入有效的URL地址' })
  bitableUrl: string;

  @IsNotEmpty({ message: '飞书多维表Token不能为空' })
  @IsString({ message: '请输入有效的Token' })
  bitableToken: string;
} 