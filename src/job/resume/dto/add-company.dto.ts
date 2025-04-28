import { IsString, IsBoolean, IsArray, IsOptional, IsUrl } from 'class-validator';

export class AddCompanyDto {
  @IsString()
  short_name: string;

  @IsBoolean()
  @IsOptional()
  is_boss_verified: boolean;

  @IsString()
  @IsOptional()
  @IsUrl()
  logo: string;

  @IsString()
  @IsOptional()
  industry: string;

  @IsString()
  @IsOptional()
  financing_stage: string;

  @IsString()
  @IsOptional()
  company_size: string;

  @IsString()
  @IsOptional()
  introduction: string;

  @IsArray()
  @IsOptional()
  photo_album: string[];

  @IsArray()
  @IsOptional()
  address: string[];

  @IsString()
  company_name: string;

  @IsString()
  @IsOptional()
  legal_representative: string;

  @IsString()
  @IsOptional()
  establishment_date: string;

  @IsString()
  @IsOptional()
  company_type: string;

  @IsString()
  @IsOptional()
  business_status: string;

  @IsString()
  @IsOptional()
  registered_capital: string;

  @IsString()
  @IsOptional()
  registered_address: string;

  @IsString()
  @IsOptional()
  business_term: string;

  @IsString()
  @IsOptional()
  approval_date: string;

  @IsString()
  @IsOptional()
  region: string;

  @IsString()
  @IsOptional()
  credit_code: string;

  @IsString()
  @IsOptional()
  former_name: string;

  @IsString()
  @IsOptional()
  registration_authority: string;

  @IsString()
  @IsOptional()
  industry_category: string;

  @IsString()
  @IsOptional()
  business_scope: string;
} 