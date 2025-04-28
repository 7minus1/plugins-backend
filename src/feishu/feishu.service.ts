import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as lark from '@larksuiteoapi/node-sdk';
import { BaseClient } from '@lark-base-open/node-sdk';
import {
  // CreateBitableRecordRequest,
  CreateBitableRecordResponse,
} from './dto/feishu.dto';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFileSync } from 'fs';
import { FIELD_NAME_MAP, COMPANY_FIELD_NAME_MAP } from '../common/constants/field-mapping';

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
  // async createBitable(appToken: string, bitableToken: string) {
  //   const client = new BaseClient({
  //     appToken: appToken,
  //     personalBaseToken: bitableToken,
  //   });
  //   return client.base.appTable.create(
  //     {
  //       data: {
  //         table: {
  //           name: '简历表', // 新增的数据表名称
  //           fields: [
  //             // 调用转换函数生成字段配置
  //             ...this.convertToBitableFields(),
  //           ],
  //         },
  //       },
  //     },
  //     lark.withTenantToken(bitableToken),
  //   );
  // }

  /**
   * 将 CreateBitableRecordRequest 接口的字段转换为飞书多维表格的字段配置
   * @returns 飞书多维表格的字段配置数组
   */
  // convertToBitableFields() {
  //   // const fieldsConfig: any[] = [
  //   //   {
  //   //     "field_name": "序号",
  //   //     "type": 1005
  //   //   }
  //   // ];

  //   const fieldsConfig: any[] = [];
  //   const sampleRequest: CreateBitableRecordRequest = {
  //     fields: {
  //       name: '',
  //       file_url: [],
  //       mobile: '',
  //       gender: '',
  //       email: '',
  //       work_year: '',
  //       home_location: '',
  //       self_evaluation: '',
  //       willing_location_list: '',
  //       willing_position_list: '',
  //       social_links: '',
  //       date_of_birth: '',
  //       current_location: '',
  //       new_content: '',
  //       award_list: '',
  //       education_list: '',
  //       career_list: '',
  //       language_list: '',
  //       certificate_list: '',
  //       competition_list: '',
  //       project_list: '',
  //     },
  //   };

  //   for (const fieldName in sampleRequest.fields) {
  //     let type = 1;
  //     let ui_type: string | undefined;

  //     // * 简历附件写成type 17
  //     if (fieldName === 'file_url') {
  //       type = 17;
  //     }

  //     // ! 不支持 Email类型 |当字段 UI 展示的类型为邮箱时，其property 应设为 null
  //     // if (fieldName === 'email') {
  //     //   type = 1;
  //     //   ui_type = 'Phone';
  //     // }
  //     // else if (fieldName === 'date_of_birth') {
  //     //   type = 5;
  //     //   ui_type = 'DateTime';
  //     // } else if (fieldName === 'url_list') {
  //     //   type = 15;
  //     //   ui_type = 'Url';
  //     // }

  //     const fieldConfig = {
  //       field_name: FIELD_NAME_MAP[fieldName as keyof typeof FIELD_NAME_MAP], // 使用中文名称
  //       type,
  //       ...(ui_type && { ui_type }),
  //       ...(fieldName === 'email' && { property: null }),
  //     };
  //     fieldsConfig.push(fieldConfig);
  //   }

  //   console.log(fieldsConfig);
  //   return fieldsConfig;
  // }

  // 查询数据表字段，用于检测用户的多维表配置是否成功
  async checkBitableByFields(appToken: string, bitableToken: string, tableId: string) {
    console.log('appToken', appToken);
    console.log('bitableToken', bitableToken);
    console.log('tableId', tableId);
    const client = new BaseClient({
      appToken: appToken,
      personalBaseToken: bitableToken,
    });
    const response = await client.base.appTableField.list(
      {
        path: {
          table_id: tableId,
        },
      },
      lark.withTenantToken(bitableToken),
    );
    console.log('response', response);
    console.log('response.code', response.code);

    return response.code === 0;
  }

  async uploadFile(
    file: Express.Multer.File,
    fileName: string,
    appToken: string,
    bitableToken: string,
  ) {
    // 将 buffer 写入临时文件并创建可读流
    const tempFilePath = join(tmpdir(), fileName);
    writeFileSync(tempFilePath, file.buffer);
    const stream = createReadStream(tempFilePath);
    const client = new BaseClient({
      appToken: appToken,
      personalBaseToken: bitableToken,
    });

    const fileToken = await client.drive.media.uploadAll(
      {
        data: {
          file_name: fileName,
          parent_type: 'bitable_file',
          parent_node: appToken,
          size: file.size,
          file: stream,
        },
      },
      lark.withTenantToken(bitableToken),
    );

    return fileToken; // 一串字符串 ICTLbSvFhoWB3TxwpgicgfE4ned
  }

  // async addBitableRecord(
  //   appToken: string,
  //   tableId: string,
  //   bitableToken: string,
  //   record: CreateBitableRecordRequest,
  // ): Promise<CreateBitableRecordResponse> {
  //   // 将英文字段名转换为中文字段名
  //   const chineseFields: Record<string, any> = {};
  //   for (const [key, value] of Object.entries(record.fields)) {
  //     let formattedValue = value;

  //     // 处理性别字段
  //     if (key === 'gender') {
  //       switch (value) {
  //         case '1':
  //           formattedValue = '男';
  //           break;
  //         case '2':
  //           formattedValue = '女';
  //           break;
  //         case '0':
  //         default:
  //           formattedValue = '';
  //           break;
  //       }
  //     }
  //     // 处理列表类型的字段
  //     else if (Array.isArray(value)) {
  //       // 如果列表为空，直接设置为空字符串
  //       formattedValue = value.length === 0 ? '' : value;
  //     } else if (
  //       typeof value === 'string' &&
  //       value.startsWith('[') &&
  //       value.endsWith(']')
  //     ) {
  //       try {
  //         const parsedValue = JSON.parse(value);
  //         if (Array.isArray(parsedValue)) {
  //           // 如果列表为空，直接设置为空字符串
  //           if (parsedValue.length === 0) {
  //             formattedValue = '';
  //           } else if (key === 'education_list') {
  //             // 特殊处理教育经历
  //             formattedValue = parsedValue
  //               .map((edu) => {
  //                 const parts = [
  //                   edu.school || '',
  //                   formatDate(edu.start_date),
  //                   formatDate(edu.end_date),
  //                   edu.major || '',
  //                   edu.degree || '',
  //                   edu.qualification || '',
  //                 ].filter(Boolean); // 过滤掉空值
  //                 return parts.join(', ');
  //               })
  //               .join('\n');
  //           } else if (key === 'award_list') {
  //             // 特殊处理获奖经历，只取description字段
  //             formattedValue = parsedValue
  //               .map((award) => award.description || '')
  //               .filter(Boolean) // 过滤掉空值
  //               .join('\n');
  //           } else if (key === 'career_list') {
  //             // 特殊处理工作经历
  //             formattedValue = parsedValue
  //               .map((career) => {
  //                 const parts = [
  //                   career.company || '',
  //                   career.title || '',
  //                   career.type_str || '',
  //                   formatDate(career.start_date),
  //                   formatDate(career.end_date),
  //                   career.job_description || '',
  //                 ].filter(Boolean); // 过滤掉空值
  //                 return parts.join(', ');
  //               })
  //               .join('\n');
  //           } else if (key === 'language_list') {
  //             // 特殊处理语言能力，只取description字段
  //             formattedValue = parsedValue
  //               .map((lang) => lang.description || '')
  //               .filter(Boolean) // 过滤掉空值
  //               .join('\n');
  //           } else if (key === 'certificate_list') {
  //             // 特殊处理证书，只取name字段
  //             formattedValue = parsedValue
  //               .map((cert) => cert.name || '')
  //               .filter(Boolean) // 过滤掉空值
  //               .join('\n');
  //           } else if (key === 'competition_list') {
  //             // 特殊处理竞赛经历，只取desc字段
  //             formattedValue = parsedValue
  //               .map((comp) => comp.desc || '')
  //               .filter(Boolean) // 过滤掉空值
  //               .join('\n');
  //           } else if (key === 'project_list') {
  //             // 特殊处理项目经历
  //             formattedValue = parsedValue
  //               .map((project) => {
  //                 const parts = [
  //                   project.name || '',
  //                   project.title || '',
  //                   formatDate(project.start_date),
  //                   formatDate(project.end_date),
  //                   project.description || '',
  //                 ].filter(Boolean); // 过滤掉空值
  //                 return parts.join(', ');
  //               })
  //               .join('\n');
  //           } else {
  //             // 其他列表类型保持原样
  //             formattedValue = value;
  //           }
  //         }
  //       } catch (e) {
  //         // 如果解析失败，保持原值
  //         console.error(`Failed to parse JSON for field ${key}:`, e);
  //       }
  //     }

  //     chineseFields[FIELD_NAME_MAP[key as keyof typeof FIELD_NAME_MAP]] =
  //       formattedValue;
  //   }

  //   console.log('record', chineseFields);

  //   const client = new BaseClient({
  //     appToken: appToken,
  //     personalBaseToken: bitableToken,
  //   });
  //   const response = await client.base.appTableRecord.create(
  //     {
  //       path: {
  //         table_id: tableId,
  //       },
  //       data: {
  //         fields: chineseFields,
  //       },
  //     },
  //     lark.withTenantToken(bitableToken),
  //   );

  //   console.log('response', response);

  //   return {
  //     recordId: response.data.record?.record_id,
  //     error: response.code !== 0 ? response.msg : undefined,
  //   };
  // }

  // async createNewTable(bitableUrl: string, bitableToken: string) {
  //   // 从bitableUrl中解析appToken
  //   const appToken = bitableUrl.split('?')[0].split('/').pop();

  //   // 建表
  //   const create_res = await this.createBitable(appToken, bitableToken);
  //   console.log(create_res);
  //   const newTableId = create_res.data.table_id;
  //   return newTableId;
  // }

  async addFileRecord(
    appToken: string,
    tableId: string,
    bitableToken: string,
    fileToken: string,
    additionalFields?: {
      deliveryChannel: string;
      deliveryPosition: string;
    }
  ) {
    try {
      const client = new BaseClient({
        appToken: appToken,
        personalBaseToken: bitableToken,
      });

      // 增加投递时间，写毫秒级时间戳
      const fields: Record<string, any> = {
        '简历文件': [fileToken],
        '投递时间': new Date().getTime(),
      };

      if (additionalFields) {
        fields['投递渠道'] = additionalFields.deliveryChannel;
        fields['求职岗位'] = additionalFields.deliveryPosition;
      }

      const response = await client.base.appTableRecord.create(
        {
          path: {
            table_id: tableId,
          },
          data: {
            fields,
          },
        },
        lark.withTenantToken(bitableToken),
      );
      console.log('response', response);
      return response.data;
    } catch (error) {
      console.error('添加文件记录失败:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }


  async uploadOnlineImage(fileName: string, imageUrl: string, appToken: string, bitableToken: string) {
    const imageArrayBuffer = await fetch(imageUrl).then(res => res.arrayBuffer());
    const imageBuffer = Buffer.from(imageArrayBuffer);
    
    const client = new BaseClient({
      appToken: appToken,
      personalBaseToken: bitableToken,
    });

    const fileToken = await client.drive.media.uploadAll(
      {
        data: {
          file_name: fileName,
          parent_type: 'bitable_file',
          parent_node: appToken,
          size: imageBuffer.length,
          file: imageBuffer,
        },
      },
      lark.withTenantToken(bitableToken),
    );

    return fileToken;
  }

  async addCompanyRecord(
    appToken: string,
    tableId: string,
    bitableToken: string,
    companyInfo: any,
  ) {
    try {
      const client = new BaseClient({
        appToken: appToken,
        personalBaseToken: bitableToken,
      });

      // 将英文字段名转换为中文字段名
      const chineseFields: Record<string, any> = {};
      for (const [key, value] of Object.entries(companyInfo)) {
        if (key in COMPANY_FIELD_NAME_MAP) {
          const chineseKey = COMPANY_FIELD_NAME_MAP[key as keyof typeof COMPANY_FIELD_NAME_MAP];
          chineseFields[chineseKey] = value;
        }
      }

      // 处理公司LOGO
      if (companyInfo.logo) {
        console.log('companyInfo.logo', companyInfo.logo);
        // 使用uploadOnlineImage上传图片获取fileToken
        const logoFileName = `${companyInfo.short_name}_logo.jpg`;
        const fileToken = await this.uploadOnlineImage(logoFileName, companyInfo.logo, appToken, bitableToken);
        chineseFields['公司 LOGO'] = [fileToken];
      }
      console.log('chineseFields', chineseFields['公司 LOGO']);
      
      // 公司相册是数组，需要遍历
      // if (companyInfo.photo_album) {
      //   // 文件命名: 公司名称_图片序号.jpg
      //   chineseFields['公司相册'] = companyInfo.photo_album.map((photo, index) => this.uploadOnlineImage(`${companyInfo.short_name}_${index}.jpg`, photo, appToken, bitableToken));
      // }

      chineseFields['公司相册'] = '';
      
      console.log(chineseFields);
      
      const response = await client.base.appTableRecord.create(
        {
          path: {
            table_id: tableId,
          },
          data: {
            fields: chineseFields,
          },
        },
        lark.withTenantToken(bitableToken),
      );

      console.log('response', response);
      return response.data;
    } catch (error) {
      console.error('添加公司记录失败:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }


  }
}
