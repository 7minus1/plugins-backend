import { Injectable } from '@nestjs/common';
import { createReadStream } from 'fs';
const pdf = require('pdf-parse');
import { createWorker } from 'tesseract.js';
import { FeishuService } from '../feishu/feishu.service';

@Injectable()
export class ResumeService {
  constructor(
    private readonly feishuService: FeishuService
  ) {}

  async processResume(file: Express.Multer.File) {
    const { buffer, mimetype } = file;
    
    // PDF解析逻辑
    if (mimetype === 'application/pdf') {
      const data = await pdf(buffer);
      const result = this.parseResumeText(data.text);
      await this.feishuService.createRecord(
        process.env.FEISHU_APP_TOKEN,
        process.env.FEISHU_TABLE_ID,
        result
      );
      return result;
    }
    
    // 图像OCR解析
    if (mimetype.startsWith('image/')) {
      const worker = await createWorker();
      const { data: { text } } = await worker.recognize(buffer);
      await worker.terminate();
      return this.parseResumeText(text);
    }
  }

  private parseResumeText(text: string) {
    // 使用正则表达式提取关键信息
    return {
      name: this.extractName(text),
      phone: this.extractPhone(text),
      education: this.extractEducation(text)
    };
  }

  private extractName(text: string) {
    const nameRegex = /(姓名|名字|个人基本信息[\s\S]*?)([\u4e00-\u9fa5]{2,4})/;
    return text.match(nameRegex)?.[2] || '';
  }

  private extractPhone(text: string) {
    const phoneRegex = /(1[3-9]\d{9})|(\d{3}-\d{8}|\d{4}-\d{7})/g;
    return text.match(phoneRegex)?.[0] || '';
  }

  private extractEducation(text: string) {
    const eduRegex = /教育经历[\s\S]*?(\d{4}\.\d{2}-\d{4}\.\d{2})\s*([\u4e00-\u9fa5]+大学|[\u4e00-\u9fa5]+学院)\s*([\u4e00-\u9fa5]+专业)\s*(本科|硕士|博士)/g;
    const matches = [...text.matchAll(eduRegex)];
    return matches.map(match => ({
      school: match[2],
      degree: match[4],
      major: match[3],
      duration: match[1]
    }));
  }
  
  
}