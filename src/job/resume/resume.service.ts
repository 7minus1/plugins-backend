import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { FeishuService } from '../../feishu/feishu.service';
import { AddCompanyDto } from './dto/add-company.dto';
import { COMPANY_FIELD_NAME_MAP, POSITION_FIELD_NAME_MAP } from '../../common/constants/field-mapping';
import { JobInfoDto } from './dto/job-info.dto';
import { TencentCloudService } from '../../tencent-cloud/tencent-cloud.service';
import { JobUsersService } from '../users/users.service';
import { KIMI_SYSTEM_PROMPT, RESUME_PARSE_PROMPT, POSITION_PROFILE, POSITION_INFO, POSITION_DESCRIPTION } from 'src/common/constants/prompt';
import { getResumeEvalPrompt, getResumeMatchPrompt } from 'src/common/constants/prompt';
import { createReadStream } from 'fs';
import OpenAI from 'openai';

@Injectable()
export class JobResumeService {
  constructor(
    private readonly feishuService: FeishuService,
    private readonly cloudStorage: TencentCloudService,
    @Inject(forwardRef(() => JobUsersService))
    private readonly usersService: JobUsersService,
  ) {}

  // 检测多维表配置是否成功
  async checkAndGetTableId(bitableUrl: string, bitableToken: string) {
    const appToken = bitableUrl.split('?')[0].split('/').pop();
    const result = await this.feishuService.checkAndGetTableId(appToken, bitableToken);
    return result;
  }

  // 添加公司信息到多维表格
  async addCompanyToBitable(userId: number, companyInfo: AddCompanyDto, userCompanyBitable: any) {
    try {
      // 从URL提取appToken
      const appToken = userCompanyBitable.bitableUrl.split('?')[0].split('/').pop();
      const tableId = userCompanyBitable.tableId;
      const bitableToken = userCompanyBitable.bitableToken;

      // 调用飞书API添加记录（传递正确的参数类型）
      const response = await this.feishuService.addCompanyRecord(
        appToken,
        tableId,
        bitableToken,
        companyInfo
      );

      console.log(response);
      return {
        success: true,
        recordId: response.record.record_id,
        message: '公司信息添加成功'
      };
    } catch (error) {
      console.error('添加公司信息失败:', error);
      return {
        success: false,
        message: `添加公司信息失败: ${error.message}`
      };
    }
  }

  // 上传职位信息到多维表格
  async uploadPositionToBitable(
    file: Express.Multer.File, 
    userId: number, 
    jobInfo: JobInfoDto, 
    userPositionBitable: any
  ) {
    try {
      console.log('开始处理职位上传请求');

      // 检查用户是否有剩余上传次数
      const uploadCheck = await this.usersService.checkRemainingUploads(userId);
      if (!uploadCheck.canUpload) {
        console.error('用户上传次数已达上限', uploadCheck.message);
        return {
          success: false,
          message: uploadCheck.message
        };
      }
      
      // 从URL提取appToken
      const appToken = userPositionBitable.bitableUrl.split('?')[0].split('/').pop();
      const tableId = userPositionBitable.tableId;
      const bitableToken = userPositionBitable.bitableToken;

      // 生成新的文件名
      const fileExtension = file.originalname.split('.').pop();
      const newFileName = `position_${Date.now()}.${fileExtension}`;

      console.log('newFileName', newFileName);
      
      // 上传文件到腾讯云存储
      const fileInfo = await this.cloudStorage.uploadFile(
        newFileName,
        file.buffer,
      );
      const fileName = fileInfo.name;
      const fileUrl = fileInfo.url;
      console.log('文件上传成功:', { fileName, fileUrl });

      console.log('开始上传文件到飞书');
      // 上传文件到飞书多维表格
      let fileToken;
      try {
        fileToken = await this.feishuService.uploadFile(
          file,
          newFileName,
          appToken,
          bitableToken,
        );
        console.log('文件上传到飞书成功:', { fileToken });
      } catch (error) {
        console.error('飞书文件上传失败:', error);
        return {
          success: false,
          message: `飞书文件上传失败: ${error.message}`
        };
      }

      // 添加数据到飞书表格
      try {
        console.log('开始添加数据到飞书表格');
        
        // 检查必要参数
        if (!appToken || !tableId || !bitableToken) {
          console.error('缺少必要参数');
          return {
            success: false,
            message: '缺少必要参数'
          };
        }

        // 检查文件token
        if (!fileToken) {
          console.error('文件token为空');
          return {
            success: false,
            message: '文件上传失败'
          };
        }

        // 调用飞书API添加记录
        const response = await this.feishuService.addPositionRecord(
          appToken,
          tableId,
          bitableToken,
          fileToken,
          {
            positionName: jobInfo.position_name,
            companyLink: jobInfo.company_link,
            positionType: jobInfo.position_type,
            positionLocation: jobInfo.position_location,
            positionStatus: jobInfo.position_status,
            salaryRange: jobInfo.salary_range,
            experienceRequirement: jobInfo.experience_requirement,
            educationRequirement: jobInfo.education_requirement,
            companyBenefits: jobInfo.company_benefits,
            positionTags: jobInfo.position_tags,
            positionDescription: jobInfo.position_description,
            positionAddress: jobInfo.position_address,
            publisherName: jobInfo.publisher_name,
            publisherAvatar: jobInfo.publisher_avatar,
            companyName: jobInfo.company_name,
            jobLink: jobInfo.job_link
          }
        );

        console.log('职位信息添加成功:', response);
        
        // 增加用户上传次数
        await this.usersService.incrementUploadCount(userId);
        
        return {
          success: true,
          recordId: response.record.record_id,
          fileName: file.originalname,
          position_name: jobInfo.position_name,
          company_link: jobInfo.company_link,
          message: '职位详情上传成功'
        };
      } catch (error) {
        console.error('添加职位信息失败:', error);
        return {
          success: false,
          message: `添加职位信息失败: ${error.message}`
        };
      }
    } catch (error) {
      console.error('处理职位上传请求失败:', error);
      return {
        success: false,
        message: `处理职位上传请求失败: ${error.message}`
      };
    }
  }

  /**
   * 通过职位名称和公司名称获取简历版本文件
   * @param appToken 飞书应用Token
   * @param tableId 多维表格ID
   * @param bitableToken 多维表格访问Token
   * @param positionName 职位名称
   * @param companyName 公司名称
   * @returns 简历文件信息，包含文件路径
   */
  async getResumeByVersion(
    appToken: string,
    tableId: string,
    bitableToken: string,
    positionName: string,
    companyName: string
  ) {
    try {
      // 调用飞书服务获取简历版本文件
      const result = await this.feishuService.getResumeByVersion(
        appToken,
        tableId,
        bitableToken,
        positionName,
        companyName
      );
      
      // 如果下载成功，直接返回结果
      if (result.success) {
        return {
          success: true,
          fileName: result.fileName,
          message: '文件下载成功'
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('获取简历版本文件失败:', error);
      return {
        success: false,
        message: `获取简历文件失败: ${error.message}`
      };
    }
  }

  /**
   * 通过职位名称和公司名称获取打招呼语
   * @param appToken 飞书应用Token
   * @param tableId 多维表格ID
   * @param bitableToken 多维表格访问Token
   * @param positionName 职位名称
   * @param companyName 公司名称
   * @returns 打招呼语信息
   */
  async getGreetMsgByPosition(
    appToken: string,
    tableId: string,
    bitableToken: string,
    positionName: string,
    companyName: string
  ) {
    try {
      // 调用飞书服务获取打招呼语
      const result = await this.feishuService.getGreetMsgByPosition(
        appToken,
        tableId,
        bitableToken,
        positionName,
        companyName
      );

      // 直接返回飞书服务的结果
      return result;
    } catch (error) {
      console.error('获取打招呼语失败:', error);
      return {
        success: false,
        message: `获取打招呼语失败: ${error.message}`
      };
    }
  }

  /**
   * 通过职位名称和公司名称获取简历图像
   * @param appToken 飞书应用Token
   * @param tableId 多维表格ID
   * @param bitableToken 多维表格访问Token
   * @param positionName 职位名称
   * @param companyName 公司名称
   * @returns 简历图像在线链接信息
   */
  async getResumeImagesByPosition(
    appToken: string,
    tableId: string,
    bitableToken: string,
    positionName: string,
    companyName: string
  ) {
    try {
      // 调用飞书服务获取简历图像
      const result = await this.feishuService.getResumeImagesByVersion(
        appToken,
        tableId,
        bitableToken,
        positionName,
        companyName
      );

      // 直接返回飞书服务的结果
      return result;
    } catch (error) {
      console.error('获取简历图像失败:', error);
      return {
        success: false,
        message: `获取简历图像失败: ${error.message}`
      };
    }
  }

  /**
   * 通过职位名称和公司名称获取职位评估信息
   * @param appToken 飞书应用Token
   * @param tableId 多维表格ID
   * @param bitableToken 多维表格访问Token
   * @param positionName 职位名称
   * @param companyName 公司名称
   * @returns 职位评估信息
   */
  async getEvalInfoByPosition(
    appToken: string,
    tableId: string,
    bitableToken: string,
    positionName: string,
    companyName: string
  ) {
    try {
      // 调用飞书服务获取职位评估信息
      const result = await this.feishuService.getEvalInfoByPosition(
        appToken,
        tableId,
        bitableToken,
        positionName,
        companyName
      );

      // 直接返回飞书服务的结果
      return result;
    } catch (error) {
      console.error('获取职位评估信息失败:', error);
      return {
        success: false,
        message: `获取职位评估信息失败: ${error.message}`
      };
    }
  }

  
  // 测试api调用
  async testPosition(positionInfo: any, userId: number) {
    // const client = new OpenAI({
    //   apiKey: process.env.MOONSHOT_API_KEY,
    //   baseURL: 'https://api.moonshot.cn/v1',
    // });

      // 检查用户是否有剩余上传次数
      const uploadCheck = await this.usersService.checkRemainingUploads(userId);
      if (!uploadCheck.canUpload) {
        console.error('用户上传次数已达上限', uploadCheck.message);
        return {
          success: false,
          message: uploadCheck.message
        };
      }

    try {
      
      // 1. 调用KIMI提取职位图像中的信息

      // const fileObject = await client.files.create({
      //   file: createReadStream('position_test.jpg'),
      //   purpose: 'file-extract' as any,
      // });

      // const fileContent = await (await client.files.content(fileObject.id)).text();
      // const messages = [
      //   {
      //     role: 'system' as const,
      //     content: KIMI_SYSTEM_PROMPT,
      //   },
      //   { role: 'system' as const, content: fileContent },
      //   { role: 'user' as const, content: "提取图片中的信息" },
      // ];

      // const completion = await client.chat.completions.create({
      //   model: 'moonshot-v1-32k',
      //   messages: messages,
      //   temperature: 0.3,
      // });
      // // 这里是职位parse结果
      // const parseResult = completion.choices[0].message.content;
      // console.log('parseResult', parseResult);

      // 2. 调用火山api 获取职位评估信息
      // // TODO 3个字段都从飞书多维表格查询得到
      console.log('positionInfo', positionInfo);
      const companyName = positionInfo.company_name;
      const positionName = positionInfo.position_name;
      const positionDesp = positionInfo.position_description;
      console.log('companyName', companyName);
      console.log('positionName', positionName);
      console.log('positionDesp', positionDesp);

      const MATCH_PROMPT = getResumeMatchPrompt(companyName, positionName, positionDesp, null);
      
      // 调用火山api
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.ARK_DS_V3_ID,
          messages: [
            {
              role: 'user',
              content: MATCH_PROMPT
            }
          ]
        })
      });

      const result = await response.json();
      // 推理过程 result.choices[0].message.reasoning_content
      const evalResult = result.choices[0].message.content;
      console.log('evalResult', evalResult);
      let recommendLevel = '未知';
      // 提取匹配结果中的匹配程度: 
      // 可能的写法: 最终匹配度**：75% 
      const match = evalResult.match(/最终匹配度.*?(\d+)/);
      const matchPercentage = match ? parseInt(match[1]) : null;
      // 根据 matchPercentage 分级，如果匹配不到，则推荐等级为待定
      if (matchPercentage) {
        if (matchPercentage >= 85) {
          recommendLevel = '强烈推荐';
        } else if (matchPercentage >= 70) {
          recommendLevel = '推荐';
        } else if (matchPercentage >= 60) {
          recommendLevel = '待定';
        } else {
          recommendLevel = '不推荐';
        }
      }

      // 增加用户上传次数
      await this.usersService.incrementUploadCount(userId);

      // 返回 recommendLevel 和 evalResult
      return {
        success: true,
        recommendLevel,
        evalResult
      };

    } catch (error) {
      console.error('Error processing:', error);
      throw new Error('Failed to process');
    }
  }


  async test() {
    const client = new OpenAI({
      apiKey: process.env.MOONSHOT_API_KEY,
      baseURL: 'https://api.moonshot.cn/v1',
    });
    try {
      const fileObject = await client.files.create({
        file: createReadStream('test.pdf'),
        purpose: 'file-extract' as any,
      });

      const fileContent = await (await client.files.content(fileObject.id)).text();

      const messages = [
        {
          role: 'system' as const,
          content:
            '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。',
        },
        { role: 'system' as const, content: fileContent },
        { role: 'user' as const, content: RESUME_PARSE_PROMPT },
      ];

      const completion = await client.chat.completions.create({
        model: 'moonshot-v1-32k',
        messages: messages,
        temperature: 0.3,
      });

      const parseResult = completion.choices[0].message.content;
      console.log('parseResult', parseResult);
      const EVAL_PROMPT = getResumeEvalPrompt(POSITION_PROFILE, POSITION_INFO, parseResult);
      
      // 调用火山api
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.ARK_DS_V3_ID,
          messages: [
            {
              role: 'user',
              content: EVAL_PROMPT
            }
          ]
        })
      });

      const result = await response.json();
      // 推理过程 result.choices[0].message.reasoning_content
      return result.choices[0].message.content;

    } catch (error) {
      console.error('Error processing file:', error);
      throw new Error('Failed to process file');
    }
  }
} 