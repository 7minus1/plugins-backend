import {
  Injectable,
  Inject,
  forwardRef,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import fs from 'fs';
import OpenAI from 'openai';
import { TencentCloudService } from 'src/tencent-cloud/tencent-cloud.service';
import { CozeApiService } from '../../coze-api/coze-api.service';
import { CreateHrResumeDto } from './dto/create-resume.dto';
import { HrResumeParserDto } from './dto/resume.dto';
import { FeishuService } from '../../feishu/feishu.service';
import { HrUsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HrResumeService {
  constructor(
    private readonly feishuService: FeishuService,
    private readonly cloudStorage: TencentCloudService,
    private readonly cozeApi: CozeApiService,
    @Inject(forwardRef(() => HrUsersService))
    private readonly usersService: HrUsersService,
    private readonly configService: ConfigService,
  ) {}

  // 检测多维表配置是否成功
  async checkBitableConfig(bitableUrl: string, tableId: string, bitableToken: string) {
    const appToken = bitableUrl.split('?')[0].split('/').pop();
    const result = await this.feishuService.checkBitableByFields(appToken, bitableToken, tableId);
    // console.log('bitableRecords', bitableRecords);
    return result;
  }

  async processResume(file: Express.Multer.File, userId: number, createResumeDto: CreateHrResumeDto) {
    console.log('开始处理简历上传请求');
    
    // 验证userId参数
    if (!userId) {
      console.error('userId参数缺失');
      throw new HttpException(
        '用户ID无效，请重新登录',
        HttpStatus.UNAUTHORIZED,
      );
    }
    
    // 获取用户信息
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    console.log('用户信息获取成功:', { userId, isVip: user.isVip, uploadCount: user.uploadCount });

    // 检查用户是否是会员
    if (!user.isVip) {
      console.log(this.configService.get('FREE_UPLOAD_LIMIT'));
      // 检查上传次数是否超过限制
      if (user.uploadCount >= this.configService.get('FREE_UPLOAD_LIMIT')) {
        throw new ForbiddenException(
          '非会员用户上传次数已达上限，请升级为会员继续使用',
        );
      }
    }

    try {
      console.log('开始获取用户bitable信息');
      // 获取用户的bitable信息
      console.log('userId', userId);
      const userBitable = await this.usersService.getBitableInfo(userId);
      if (!userBitable) {
        throw new Error('请先配置多维表格信息');
      }

      // 解析得到apptoken
      const appToken = userBitable.data.bitableUrl.split('?')[0].split('/').pop();
      const tableId = userBitable.data.tableId;
      const bitableToken = userBitable.data.bitableToken;

      // 生成新的文件名
      const fileExtension = file.originalname.split('.').pop();
      const newFileName = `${Date.now()}.${fileExtension}`;

      console.log('newFileName', newFileName);
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
        console.error('飞书文件上传失败:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        
        // 检查是否是飞书验证失败
        if (error.response?.status === 400 && error.response?.data?.code === 9499) {
          throw new HttpException(
            '飞书多维表格验证失败，请检查多维表格配置是否正确',
            HttpStatus.BAD_REQUEST,
          );
        }
        
        throw new HttpException(
          `飞书文件上传失败: ${error.response?.data?.msg || error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 添加数据到飞书表格
      try {
        console.log('开始添加数据到飞书表格');
        
        // 检查必要参数
        if (!appToken || !tableId || !bitableToken) {
          console.error('缺少必要参数:', { appToken, tableId, bitableToken });
          throw new Error('缺少必要参数');
        }

        // 检查文件token
        if (!fileToken) {
          console.error('文件token为空');
          throw new Error('文件上传失败');
        }

        // 打印请求数据，方便调试
        console.log('飞书表格请求数据:', {
          appToken,
          tableId,
          bitableToken,
          fileToken,
          deliveryChannel: createResumeDto.deliveryChannel,
          deliveryPosition: createResumeDto.deliveryPosition,
        });

        const feishuResponse = await this.feishuService.addFileRecord(
        appToken,
        tableId,
        bitableToken,
          fileToken,
          {
            deliveryChannel: createResumeDto.deliveryChannel,
            deliveryPosition: createResumeDto.deliveryPosition,
          }
        );
        console.log('飞书表格数据添加成功:', feishuResponse);

        if (!feishuResponse || !feishuResponse.record?.record_id) {
          throw new Error('飞书表格响应数据格式错误');
        }

      // 只有在整个流程成功完成后，才增加上传次数
      if (!user.isVip) {
        user.uploadCount += 1;
        await this.usersService.update(user.id, user);
      }

      return {
        message: '简历上传成功',
        data: {
          recordId: feishuResponse.record.record_id,
          fileName: file.originalname,
          deliveryChannel: createResumeDto.deliveryChannel,
          deliveryPosition: createResumeDto.deliveryPosition,
        }
      };
      } catch (error) {
        console.error('添加飞书表格数据失败:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
          stack: error.stack,
        });
        
        // 根据不同的错误类型返回不同的错误信息
        if (error.response?.status === 400) {
          // 检查是否是飞书验证失败
          if (error.response?.data?.code === 9499) {
            throw new HttpException(
              '飞书多维表格验证失败，请检查多维表格配置是否正确',
              HttpStatus.BAD_REQUEST,
            );
          }
          throw new HttpException(
            `添加飞书表格数据失败: ${error.response?.data?.msg || '请求参数错误'}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        
        throw new HttpException(
          `添加飞书表格数据失败: ${error.response?.data?.msg || error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      console.error('处理简历失败:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `处理简历失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 根据简历ID获取评估信息
   * @param resumeId 简历记录ID
   * @param userId 用户ID
   * @returns 评估信息
   */
  async getResumeEvalByResumeId(resumeId: string, userId: number) {
    console.log('开始获取简历评估信息:', { resumeId, userId });
    
    // 验证userId参数
    if (!userId) {
      console.error('userId参数缺失');
      throw new HttpException(
        '用户ID无效，请重新登录',
        HttpStatus.UNAUTHORIZED,
      );
    }
    
    // 获取用户信息
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }
    
    try {
      // 获取用户的bitable信息
      const userBitable = await this.usersService.getBitableInfo(userId);
      if (!userBitable) {
        throw new HttpException('请先配置多维表格信息', HttpStatus.BAD_REQUEST);
      }

      // 解析得到apptoken
      const appToken = userBitable.data.bitableUrl.split('?')[0].split('/').pop();
      const tableId = userBitable.data.tableId;
      const bitableToken = userBitable.data.bitableToken;

      console.log('获取简历评估信息请求参数:', { appToken, tableId, bitableToken, resumeId });

      // 调用飞书服务获取简历评估信息
      const evalResult = await this.feishuService.getResumeEvalById(
        appToken,
        tableId,
        bitableToken,
        resumeId
      );

      console.log('简历评估信息获取结果:', evalResult);

      if (!evalResult) {
        throw new HttpException('获取简历评估信息失败', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return evalResult;
    } catch (error) {
      console.error('获取简历评估信息失败:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `获取简历评估信息失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

} 