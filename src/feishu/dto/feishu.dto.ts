export interface CreateBitableRecordRequest {
  fields: {
    name: string;
    mobile: string;
    gender: string;
    email: string;
    work_year: string;
    home_location: string;
    self_evaluation: string;
    willing_location_list: string;
    willing_position_list: string;
    social_links: string;
    date_of_birth: string;
    current_location: string;
    new_content: string;
    award_list: string;
    education_list: string;
    career_list: string;
    language_list: string;
    certificate_list: string;
    competition_list: string;
    project_list: string;
    // content: string;
    // country_code: string;
    // url_list: string;
    // source_id: string;
    // use_ocr: string;
    // mobile_is_virtual: string;
    // cost: string;
    // error_code: string;
    // file_md5: string;
    // message: string;
    file_url: string;
  };
}

export interface CreateBitableRecordResponse {
  recordId?: string;
  error?: string;
}

