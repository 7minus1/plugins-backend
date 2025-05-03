import axios from 'axios';
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
import { FIELD_NAME_MAP, COMPANY_FIELD_NAME_MAP, POSITION_FIELD_NAME_MAP } from '../common/constants/field-mapping';

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

    // 查询数据表字段，用于检测用户的多维表配置是否成功
    async checkAndGetTableId(appToken: string, bitableToken: string) {
      console.log('appToken', appToken);
      console.log('bitableToken', bitableToken);
      const client = new BaseClient({
        appToken: appToken,
        personalBaseToken: bitableToken,
      });
      const response = await client.base.appTable.list();

      console.log('response', response);
      console.log('response.code', response.code);

      // 如果多维表配置不成功, 返回空数组
      if (response.code !== 0) {
        return []
      }

      console.log(response.data.items[0]);
      // 单个表 { name: '个人信息', revision: 3, table_id: 'tblbjaKgtN0xrNs8' }
      // 要找的数据表名称
      const tableNames = ['AI 评估职位', 'AI 评估公司', 'AI 优化简历'];
      
      // tableNames 一个一个表找，返回tableId 数组
      let tableIds = [];
      for (const tableName of tableNames) {
        const tableId = response.data.items.find(item => item.name === tableName)?.table_id;
        if (tableId) {
          tableIds.push(tableId);
        } else {
          console.log(`未找到表 ${tableName}`);
          return [];  // 未找到表，返回空数组
        }
      }
      return tableIds;
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

  // 添加hr-简历表的记录
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

      console.log('fields', fields);
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
    // const cleanUrl = imageUrl.split('?')[0];
    // const imageArrayBuffer = await fetch(cleanUrl).then(res => res.arrayBuffer());
    // const imageArrayBuffer = await fetch(imageUrl, {
    //   headers: {
    //     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    //     'Referer': 'https://www.zhipin.com/'
    //   }
    // }).then(res => res.arrayBuffer())
    // .catch(err => {
    //   console.error('上传图片失败:', err);
    //   throw err;
    // });
    // const imageBuffer = Buffer.from(imageArrayBuffer);
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://img.bosszhipin.com/',
        'Accept': 'image/jpeg,image/png,image/*,image/webp'
      }
    });
    
    const imageBuffer = Buffer.from(response.data);

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

      console.log('companyInfo', companyInfo.short_name);
      // 查找是否用同样公司简称的公司在列表中
      const companyRecord = await client.base.appTableRecord.list(
        {
          path: {
            table_id: tableId,
          },
          params: {
            field_names: '["公司简称"]',
            filter: `CurrentValue.[公司简称] = "${companyInfo.short_name}"`
          },
        },
      );
      console.log('companyRecord', companyRecord);
      // 如果有，删除原纪录
      // 没有记录的话没有 companyRecord.data.items, 这么写会报错
      if (companyRecord.data.items && companyRecord.data.items.length > 0) {
        await client.base.appTableRecord.delete(
          {
            path: {
              table_id: tableId,
              record_id: companyRecord.data.items[0].record_id,
            },
          },
          lark.withTenantToken(bitableToken),
        );
      }

      // 将英文字段名转换为中文字段名
      const chineseFields: Record<string, any> = {};
      for (const [key, value] of Object.entries(companyInfo)) {
        if (key in COMPANY_FIELD_NAME_MAP) {
          const chineseKey = COMPANY_FIELD_NAME_MAP[key as keyof typeof COMPANY_FIELD_NAME_MAP];
          chineseFields[chineseKey] = value;
        }
      }

      // // 处理公司LOGO
      // if (companyInfo.logo) {
      //   try {
      //     const logoFileName = `${companyInfo.short_name}_logo.jpg`;
      //     const fileToken = await this.uploadOnlineImage(logoFileName, companyInfo.logo, appToken, bitableToken);
      //     if (fileToken) {
      //       chineseFields['公司 LOGO'] = [fileToken];
      //     }
      //   } catch (error) {
      //     console.error('Logo上传失败，继续处理其他字段:', error);
      //     // 设置为空数组或者存储URL字符串
      //     chineseFields['公司 LOGO'] = []; // 或者 chineseFields['公司 LOGO'] = companyInfo.logo;
      //   }
      // }
      // console.log('chineseFields', chineseFields['公司 LOGO']);
      
      // // 公司相册是数组，需要遍历上传
      // if (companyInfo.photo_album && Array.isArray(companyInfo.photo_album)) {
      //   try {
      //     // 并行上传所有图片并等待结果
      //     const uploadPromises = companyInfo.photo_album.map((photo, index) => 
      //       this.uploadOnlineImage(`${companyInfo.short_name}_photo_${index}.jpg`, photo, appToken, bitableToken)
      //     );
          
      //     // 等待所有图片上传完成，过滤掉null值
      //     const fileTokens = (await Promise.all(uploadPromises)).filter(token => token !== null);
          
      //     // 如果有成功上传的图片，添加到字段中
      //     if (fileTokens.length > 0) {
      //       chineseFields['公司相册'] = fileTokens;
      //     } else {
      //       chineseFields['公司相册'] = '';
      //     }
      //   } catch (error) {
      //     console.error('公司相册上传失败:', error);
      //     chineseFields['公司相册'] = '';
      //   }
      // } else {
      //   chineseFields['公司相册'] = '';
      // }
      // console.log('chineseFields', chineseFields['公司相册']);

      chineseFields['公司 LOGO'] = []
      chineseFields['公司相册'] = []
      
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

  // 新增职位记录的方法
  async addPositionRecord(
    appToken: string,
    tableId: string,
    bitableToken: string,
    fileToken: string,
    positionInfo: {
      positionName: string;
      companyLink: string;
      positionType?: string;
      positionLocation?: string;
      positionStatus?: string;
      salaryRange?: string;
      experienceRequirement?: string;
      educationRequirement?: string;
      companyBenefits?: string[];
      positionTags?: string[];
      positionDescription?: string;
      positionAddress?: string;
      publisherName?: string;
      publisherAvatar?: string;
      companyName?: string;
      jobLink?: string;
    }
  ) {
    try {
      const client = new BaseClient({
        appToken: appToken,
        personalBaseToken: bitableToken,
      });

      console.log('职位链接', positionInfo.jobLink);
      const fields: Record<string, any> = {
        [POSITION_FIELD_NAME_MAP.position_name]: positionInfo.positionName,
        [POSITION_FIELD_NAME_MAP.company_link]: positionInfo.companyLink,
        [POSITION_FIELD_NAME_MAP.position_image]: [fileToken],
        [POSITION_FIELD_NAME_MAP.job_link]: positionInfo.jobLink,
      };

      // 添加可选字段（如果存在）
      if (positionInfo.positionType) fields[POSITION_FIELD_NAME_MAP.position_type] = positionInfo.positionType;
      if (positionInfo.positionLocation) fields[POSITION_FIELD_NAME_MAP.position_location] = positionInfo.positionLocation;
      if (positionInfo.positionStatus) fields[POSITION_FIELD_NAME_MAP.position_status] = positionInfo.positionStatus;
      if (positionInfo.salaryRange) fields[POSITION_FIELD_NAME_MAP.salary_range] = positionInfo.salaryRange;
      if (positionInfo.experienceRequirement) fields[POSITION_FIELD_NAME_MAP.experience_requirement] = positionInfo.experienceRequirement;
      if (positionInfo.educationRequirement) fields[POSITION_FIELD_NAME_MAP.education_requirement] = positionInfo.educationRequirement;
      if (positionInfo.companyBenefits && positionInfo.companyBenefits.length > 0) fields[POSITION_FIELD_NAME_MAP.company_benefits] = positionInfo.companyBenefits;
      if (positionInfo.positionTags && positionInfo.positionTags.length > 0) fields[POSITION_FIELD_NAME_MAP.position_tags] = positionInfo.positionTags;
      if (positionInfo.positionDescription) fields[POSITION_FIELD_NAME_MAP.position_description] = positionInfo.positionDescription;
      if (positionInfo.positionAddress) fields[POSITION_FIELD_NAME_MAP.position_address] = positionInfo.positionAddress;
      if (positionInfo.publisherName) fields[POSITION_FIELD_NAME_MAP.publisher_name] = positionInfo.publisherName;
      if (positionInfo.publisherAvatar) fields[POSITION_FIELD_NAME_MAP.publisher_avatar] = positionInfo.publisherAvatar;
      if (positionInfo.companyName) fields[POSITION_FIELD_NAME_MAP.company_name] = positionInfo.companyName;

      console.log('职位表格字段:', fields);
      
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
      console.log('职位记录添加成功:', response);
      return response.data;
    } catch (error) {
      console.error('添加职位记录失败:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * 通过职位名称和公司名称获取简历版本文件
   * @param appToken 飞书应用Token
   * @param tableId 多维表格ID
   * @param bitableToken 多维表格访问Token
   * @param positionName 职位名称
   * @param companyName 公司名称
   * @returns 简历文件信息
   */
  async getResumeByVersion(
    appToken: string,
    tableId: string,
    bitableToken: string,
    positionName: string,
    companyName: string
  ) {
    try {
      const client = new BaseClient({
        appToken: appToken,
        personalBaseToken: bitableToken,
      });

      // 构建查询条件：简历版本字段包含职位名称-公司名称
      const versionPattern = `${positionName}-${companyName}`;
      
      // 查询符合条件的记录
      const response = await client.base.appTableRecord.list(
        {
          path: {
            table_id: tableId,
          },
          params: {
            // field_names: '["简历版本", "附件简历"]',
            filter: `CurrentValue.[简历版本].contains("${versionPattern}")`
          },
        },
        lark.withTenantToken(bitableToken),
      );

      // 检查是否找到匹配的记录
      if (!response.data.items || response.data.items.length === 0) {
        return {
          success: false,
          message: `未找到匹配的简历版本: ${versionPattern}`
        };
      }

      console.log('items 0', response.data.items[0]);
      
      // 获取第一条匹配的记录
      const record = response.data.items[0].fields;
      
      // 检查记录中是否包含简历文件
      if (!record['附件简历'] || !Array.isArray(record['附件简历']) || record['附件简历'].length === 0) {
        return {
          success: false,
          message: '找到的记录中不包含附件简历'
        };
      }

      // record['简历版本'] 一定有值
      const filename = record['简历版本'];
      // 获取文件token
      const fileToken = record['附件简历'][0]['file_token'];  // 第一个文件的token
      console.log('fileToken', fileToken);
      /* fileInfo
        {
          file_token: 'C9ovbX5twoR8V5x1wLrcsbvFn3c',
          name: 'resume.pdf',
          size: 97352,
          tmp_url: 'https://open.feishu.cn/open-apis/drive/v1/medias/batch_get_tmp_download_url?file_tokens=C9ovbX5twoR8V5x1wLrcsbvFn3c',
          type: 'application/pdf',
          url: 'https://open.feishu.cn/open-apis/drive/v1/medias/C9ovbX5twoR8V5x1wLrcsbvFn3c/download'
        }
      */
      
      // 设置保存路径
      const outputPath = `${filename}.pdf`;
      
      // 根据文件token下载
      await client.drive.media.download({
        path: {file_token: fileToken},
        // 如果 Base 开启了高级权限，则需要填写 extra 参数，否则不用传。
      }).then(res => {
        // console.log('res', res);
        return res.writeFile(outputPath);
      }).catch(err => {
        console.error('下载失败:', err);
        throw err;
      });
      
      return {
        success: true,
        fileName: outputPath,
        message: '文件下载成功'
      };
    } catch (error) {
      console.error('获取简历版本文件失败:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      return {
        success: false,
        message: `获取简历文件失败: ${error.message}`
      };
    }
  }

  async getGreetMsgByVersion(
    appToken: string,
    tableId: string,
    bitableToken: string,
    positionName: string,
    companyName: string
  ) {
    
    try {
      const client = new BaseClient({
        appToken: appToken,
        personalBaseToken: bitableToken,
      });

      // 构建查询条件：简历版本字段包含职位名称-公司名称
      // TODO： 复原
      const versionPattern = `${positionName}-${companyName}`;

      // const versionPattern = '产品经理-拓竹科技';
      
      // 查询符合条件的记录
      const response = await client.base.appTableRecord.list(
        {
          path: {
            table_id: tableId,
          },
          params: {
            filter: `CurrentValue.[简历版本].contains("${versionPattern}")`
          },
        },
        lark.withTenantToken(bitableToken),
      );

      // 检查是否找到匹配的记录
      if (!response.data.items || response.data.items.length === 0) {
        return {
          success: false,
          message: `未找到匹配的简历版本: ${versionPattern}`
        };
      }

      console.log('items 0', response.data.items[0]);
      
      // 获取第一条匹配的记录
      const record = response.data.items[0].fields;
      
      // 检查记录中是否包含打招呼语
      if (!record['打招呼语']) {
        return {
          success: false,
          message: '找到的记录中不包含打招呼语'
        };
      }

      // record['打招呼语'] 一定有值
      const greetMsg = record['打招呼语'];
      console.log('greetMsg', greetMsg);
      
      return {
        success: true,
        greetMsg,
        message: '获取打招呼语成功'
      };
    } catch (error) {
      console.error('获取打招呼语失败:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      return {
        success: false,
        message: `获取打招呼语失败: ${error.message}`
      };
    }
  }
}
