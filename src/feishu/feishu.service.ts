import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lark from '@larksuiteoapi/node-sdk';
import { CreateBitableRecordRequest, CreateBitableRecordResponse } from './dto/feishu.dto';


@Injectable()
export class FeishuService {
  private client: lark.Client;
  private appToken: string; // 应用的token，用于创建表格
  // private tableId: string; // 表格的ID，用于新增记录
  

  constructor(private configService: ConfigService) {
    this.client = new lark.Client({
      appId: this.configService.get('FEISHU_APP_ID'),
      appSecret: this.configService.get('FEISHU_APP_SECRET'),
      domain: 'https://open.feishu.cn'
    });
    this.appToken = this.configService.get('FEISHU_APP_TOKEN'); // 从环境变量中获取应用的token
    // this.tableId = this.configService.get('FEISHU_TABLE_ID'); // 从环境变量中获取表格的ID
  }

  // 创建多维表格
  async createBitable() {
    return this.client.bitable.appTable.create({
      path: {
        app_token: this.appToken,
      },
      data: {
        table: {
          name: 'Resume Records',
          fields: [
            // 调用转换函数生成字段配置
            ...this.convertToBitableFields()
          ],
        }
      }
    }, lark.withTenantToken(""));
  }

  /**
   * 将 CreateBitableRecordRequest 接口的字段转换为飞书多维表格的字段配置
   * @returns 飞书多维表格的字段配置数组
   */
  convertToBitableFields() {
    const fieldsConfig: any[] = [
    {
        "field_name": "序号",
        "type": 1005
    }
];
    const sampleRequest: CreateBitableRecordRequest = {
      fields: {
        name: '',
        mobile: '',
        gender: '',
        email: '',
        work_year: '',
        home_location: '',
        self_evaluation: '',
        willing_location_list: '',
        willing_position_list: '',
        social_links: '',
        date_of_birth: '',
        current_location: '',
        new_content: '',
        award_list: '',
        education_list: '',
        career_list: '',
        language_list: '',
        certificate_list: '',
        competition_list: '',
        project_list: '',
        file_url: ''
      }
    };

    for (const fieldName in sampleRequest.fields) {
      let type = 1;
      let ui_type: string | undefined;
      
      // ! 不支持 Email类型 |当字段 UI 展示的类型为邮箱时，其property 应设为 null 
      // TODO 简历附件写成type 17
      // if (fieldName === 'email') {
      //   type = 1;
      //   ui_type = 'Phone';
      // }
      // else if (fieldName === 'date_of_birth') {
      //   type = 5;
      //   ui_type = 'DateTime';
      // } else if (fieldName === 'url_list') {
      //   type = 15;
      //   ui_type = 'Url';
      // }

      const fieldConfig = {
        field_name: fieldName,
        type,
        ...(ui_type && { ui_type }),
        ...(fieldName === 'email' && { property: null })
      };
      fieldsConfig.push(fieldConfig);
    }

    console.log(fieldsConfig);
    return fieldsConfig;
  }
  

  async addBitableRecord(
    appToken: string,
    tableId: string,
    record: CreateBitableRecordRequest
  ): Promise<CreateBitableRecordResponse> {
    const response = await this.client.bitable.appTableRecord.create({
      path: {
        app_token: appToken,
        table_id: tableId,
      },
      data: {
        fields: record.fields
      }
    });

    return {
      recordId: response.data.record?.record_id,
      error: response.code !== 0 ? response.msg : undefined
    };
  }
}