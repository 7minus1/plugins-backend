import { Injectable } from '@nestjs/common';
import { FeishuService } from '../../feishu/feishu.service';
import { AddCompanyDto } from './dto/add-company.dto';
import { COMPANY_FIELD_NAME_MAP } from '../../common/constants/field-mapping';

@Injectable()
export class JobResumeService {
  constructor(
    private readonly feishuService: FeishuService,
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
} 