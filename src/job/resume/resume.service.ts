import { Injectable } from '@nestjs/common';
import { FeishuService } from '../../feishu/feishu.service';
import { AddCompanyDto } from './dto/add-company.dto';
import { COMPANY_FIELD_NAME_MAP, POSITION_FIELD_NAME_MAP } from '../../common/constants/field-mapping';
import { JobInfoDto } from './dto/job-info.dto';
import { TencentCloudService } from '../../tencent-cloud/tencent-cloud.service';

@Injectable()
export class JobResumeService {
  constructor(
    private readonly feishuService: FeishuService,
    private readonly cloudStorage: TencentCloudService,
  ) {}

  // 检测多维表配置是否成功
  async checkBitableConfig(bitableUrl: string, tableId: string, bitableToken: string) {
    const appToken = bitableUrl.split('?')[0].split('/').pop();
    const result = await this.feishuService.checkBitableByFields(appToken, bitableToken, tableId);
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
} 