export class AwardItemDto {
  readonly award: string;
  readonly date: string;
  readonly description: string;
}

export class EducationItemDto {
  readonly school: string;
  readonly major: string;
  readonly degree: string;
  readonly start_date: string;
  readonly end_date: string;
  readonly qualification: number;
  // --------------------- 以下字段可能会被忽略 -----------------------
  // readonly start_time: string;  // 开始时间
  // readonly end_time: string;    // 结束时间
}

export class CareerItemDto {
  readonly type_str: string;    // 实习/
  readonly company: string;
  readonly title: string;
  readonly start_date: string;
  readonly end_date: string;
  readonly job_description: string;
  // --------------------- 以下字段可能会被忽略 -----------------------
  // readonly type: number;
  // readonly start_time: string;
  // readonly end_time: string;
}

export class LanguageItemDto {
  readonly language: number;    // 语言
  readonly level: number;       // 等级
  readonly description: string; // 描述 
}

export class CerificateItemDto {
  readonly name: string;
  readonly desc: string;
}

export class CompetitionItemDto {
  readonly name: string;
  readonly desc: string;
}

export class ProjectItemDto {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly start_date: string; 
  readonly end_date: string;
  // --------------------- 以下字段可能会被忽略 -----------------------
  // readonly start_time: string;
  // readonly end_time: string;
}


export class ResumeParserDto {
  readonly name: string;
  readonly mobile: string;
  readonly gender: number;
  readonly email: string;
  readonly work_year: number;
  readonly home_location: string;
  readonly self_evaluation: string;
  readonly willing_location_list: string[];
  readonly willing_position_list: string[];
  readonly social_links: string[];
  readonly date_of_birth: string;
  readonly current_location: string;

  readonly new_content: string;     // 解析出来的文本内容

  readonly award_list: AwardItemDto[];
  readonly education_list: EducationItemDto[];
  readonly career_list: CareerItemDto[];
  readonly language_list: LanguageItemDto[];
  readonly certificate_list: CerificateItemDto[];
  readonly competition_list: CompetitionItemDto[];
  readonly project_list: any[];

  // 可能用不上的字段
  // readonly content: string;
  // readonly country_code: string;
  // // 不太清楚含义的字段
  // readonly url_list: string[];
  // readonly source_id: string;
  // readonly use_ocr: number;
  // readonly mobile_is_virtual: boolean;
  // readonly cost: number;
  // readonly error_code: number;
  // readonly file_md5: string;
  // readonly message: string;
}