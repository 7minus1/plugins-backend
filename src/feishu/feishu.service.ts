import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lark from '@larksuiteoapi/node-sdk';
import { BaseClient } from '@lark-base-open/node-sdk';
import { CreateBitableRecordRequest, CreateBitableRecordResponse } from './dto/feishu.dto';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFileSync } from 'fs';

// 字段中英文映射
const FIELD_NAME_MAP = {
  name: '姓名',
  mobile: '手机号',
  gender: '性别',
  email: '邮箱',
  work_year: '工作年限',
  home_location: '籍贯',
  self_evaluation: '自我评价',
  willing_location_list: '期望工作地点',
  willing_position_list: '期望职位',
  social_links: '社交链接',
  date_of_birth: '出生日期',
  current_location: '当前所在地',
  new_content: '识别内容',
  award_list: '获奖经历',
  education_list: '教育经历',
  career_list: '工作经历',
  language_list: '语言能力',
  certificate_list: '证书',
  competition_list: '竞赛经历',
  project_list: '项目经历',
  file_url: '简历文件'
} as const;

// 工具函数：格式化日期，只保留年月
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  // 如果日期格式包含日，只取年月
  return dateStr.split('-').length > 2 ? dateStr.substring(0, 7) : dateStr;
};

@Injectable()
export class FeishuService {
  // private client: lark.Client;
  // private appToken: string; // 应用的token，用于创建表格
  // private tableId: string; // 表格的ID，用于新增记录
  

  constructor(private configService: ConfigService) {
    // this.client = new lark.Client({
    //   appId: this.configService.get('FEISHU_APP_ID'),
    //   appSecret: this.configService.get('FEISHU_APP_SECRET'),
    //   domain: 'https://open.feishu.cn'
    // });
    // this.appToken = this.configService.get('FEISHU_APP_TOKEN'); // 从环境变量中获取应用的token
    // this.tableId = this.configService.get('FEISHU_TABLE_ID'); // 从环境变量中获取表格的ID
  }

  // 创建多维表格
  async createBitable(appToken: string, bitableToken: string) {
    const client = new BaseClient({
      appToken: appToken,
      personalBaseToken: bitableToken
    });
    return client.base.appTable.create({
      data: {
        table: {
          name: '简历表',   // 新增的数据表名称
          fields: [
            // 调用转换函数生成字段配置
            ...this.convertToBitableFields()
          ],
        }
      }
    }, lark.withTenantToken(bitableToken));
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
        file_url: [],
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
      }
    };

    for (const fieldName in sampleRequest.fields) {
      let type = 1;
      let ui_type: string | undefined;

      // * 简历附件写成type 17
      if (fieldName === 'file_url') {
        type = 17;
      }
      
      // ! 不支持 Email类型 |当字段 UI 展示的类型为邮箱时，其property 应设为 null 
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
        field_name: FIELD_NAME_MAP[fieldName as keyof typeof FIELD_NAME_MAP], // 使用中文名称
        type,
        ...(ui_type && { ui_type }),
        ...(fieldName === 'email' && { property: null })
      };
      fieldsConfig.push(fieldConfig);
    }

    console.log(fieldsConfig);
    return fieldsConfig;
  }
  
  async uploadFile(file: Express.Multer.File, fileName: string, appToken: string, bitableToken: string) {
    // 将 buffer 写入临时文件并创建可读流
    const tempFilePath = join(tmpdir(), fileName);
    writeFileSync(tempFilePath, file.buffer);
    const stream = createReadStream(tempFilePath);
    const client = new BaseClient({
      appToken: appToken,
      personalBaseToken: bitableToken
    });
    
    const fileToken = await client.drive.media.uploadAll({
      data: {
        file_name: fileName,
        parent_type: 'bitable_file',
        parent_node: appToken,
        size: file.size,
        file: stream
      },
    },
    lark.withTenantToken(bitableToken));

    return fileToken;  // 一串字符串 ICTLbSvFhoWB3TxwpgicgfE4ned
  }

  async addBitableRecord(
    appToken: string,
    tableId: string,
    bitableToken: string,
    record: CreateBitableRecordRequest
  ): Promise<CreateBitableRecordResponse> {
    // 将英文字段名转换为中文字段名
    const chineseFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(record.fields)) {
      let formattedValue = value;
      
      // 处理性别字段
      if (key === 'gender') {
        switch (value) {
          case '1':
            formattedValue = '男';
            break;
          case '2':
            formattedValue = '女';
            break;
          case '0':
          default:
            formattedValue = '';
            break;
        }
      }
      // 处理列表类型的字段
      else if (Array.isArray(value)) {
        // 如果列表为空，直接设置为空字符串
        formattedValue = value.length === 0 ? '' : value;
      } else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          const parsedValue = JSON.parse(value);
          if (Array.isArray(parsedValue)) {
            // 如果列表为空，直接设置为空字符串
            if (parsedValue.length === 0) {
              formattedValue = '';
            } else if (key === 'education_list') {
              // 特殊处理教育经历
              formattedValue = parsedValue.map(edu => {
                const parts = [
                  edu.school || '',
                  formatDate(edu.start_date),
                  formatDate(edu.end_date),
                  edu.major || '',
                  edu.degree || '',
                  edu.qualification || ''
                ].filter(Boolean); // 过滤掉空值
                return parts.join(', ');
              }).join('\n');
            } else if (key === 'award_list') {
              // 特殊处理获奖经历，只取description字段
              formattedValue = parsedValue
                .map(award => award.description || '')
                .filter(Boolean) // 过滤掉空值
                .join('\n');
            } else if (key === 'career_list') {
              // 特殊处理工作经历
              formattedValue = parsedValue.map(career => {
                const parts = [
                  career.company || '',
                  career.title || '',
                  career.type_str || '',
                  formatDate(career.start_date),
                  formatDate(career.end_date),
                  career.job_description || ''
                ].filter(Boolean); // 过滤掉空值
                return parts.join(', ');
              }).join('\n');
            } else if (key === 'language_list') {
              // 特殊处理语言能力，只取description字段
              formattedValue = parsedValue
                .map(lang => lang.description || '')
                .filter(Boolean) // 过滤掉空值
                .join('\n');
            } else if (key === 'certificate_list') {
              // 特殊处理证书，只取name字段
              formattedValue = parsedValue
                .map(cert => cert.name || '')
                .filter(Boolean) // 过滤掉空值
                .join('\n');
            } else if (key === 'competition_list') {
              // 特殊处理竞赛经历，只取desc字段
              formattedValue = parsedValue
                .map(comp => comp.desc || '')
                .filter(Boolean) // 过滤掉空值
                .join('\n');
            } else if (key === 'project_list') {
              // 特殊处理项目经历
              formattedValue = parsedValue.map(project => {
                const parts = [
                  project.name || '',
                  project.title || '',
                  formatDate(project.start_date),
                  formatDate(project.end_date),
                  project.description || ''
                ].filter(Boolean); // 过滤掉空值
                return parts.join(', ');
              }).join('\n');
            } else {
              // 其他列表类型保持原样
              formattedValue = value;
            }
          }
        } catch (e) {
          // 如果解析失败，保持原值
          console.error(`Failed to parse JSON for field ${key}:`, e);
        }
      }

      chineseFields[FIELD_NAME_MAP[key as keyof typeof FIELD_NAME_MAP]] = formattedValue;
    }

    console.log("record", chineseFields);
    
    const client = new BaseClient({
      appToken: appToken,
      personalBaseToken: bitableToken
    });
    const response = await client.base.appTableRecord.create({
      path: {
        table_id: tableId,
      },
      data: {
        fields: chineseFields
      }
    }, lark.withTenantToken(bitableToken));

    console.log("response", response);

    return {
      recordId: response.data.record?.record_id,
      error: response.code !== 0 ? response.msg : undefined
    };
  }

  async createNewTable(bitableUrl: string, bitableToken: string) {
    // 从bitableUrl中解析appToken
    const appToken = bitableUrl.split('?')[0].split('/').pop();
    
    // 建表
    const create_res = await this.createBitable(appToken, bitableToken);
    console.log(create_res);
    const newTableId = create_res.data.table_id;
    return newTableId;
  }
}