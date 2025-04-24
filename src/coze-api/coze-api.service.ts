import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';

type CozeApiConfig = {
  endpoint: string;
  apiKey: string;
  workflowId: string;
};

@Injectable()
export class CozeApiService {
  private readonly config: CozeApiConfig;
  private readonly timeout = 30000; // 30秒超时

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      endpoint: this.configService.get('COZE_API_ENDPOINT'),
      apiKey: this.configService.get('COZE_API_KEY'),
      workflowId: this.configService.get('COZE_WORKFLOW_ID'),
    };
  }

  async executeResumeParser(fileName: string, fileUrl: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .post(
            this.config.endpoint,
            {
              parameters: {
                file_name: fileName,
                file_url: fileUrl,
              },
              workflow_id: this.config.workflowId,
            },
            {
              headers: {
                Authorization: `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: this.timeout,
            },
          )
          .pipe(
            catchError((error) => {
              if (error.code === 'ECONNABORTED') {
                throw new HttpException(
                  '请求超时，请稍后重试',
                  HttpStatus.REQUEST_TIMEOUT,
                );
              }
              if (error.response?.status === 504) {
                throw new HttpException(
                  '服务暂时不可用，请稍后重试',
                  HttpStatus.GATEWAY_TIMEOUT,
                );
              }
              throw new HttpException(
                `简历解析失败: ${error.response?.data?.message || error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );
      return this.parseResponse(data);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `简历解析失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private parseResponse(response: any) {
    try {
      if (!response || !response.data) {
        throw new Error('API响应数据格式错误');
      }

      const data = JSON.parse(response.data);
      
      if (!data || !data.output) {
        throw new Error('API响应数据结构错误');
      }

      return data.output;
    } catch (error) {
      console.error('解析API响应失败:', error);
      throw new HttpException(
        `解析简历数据失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
