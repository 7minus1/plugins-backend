import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const OSS = require('ali-oss');

@Injectable()
export class CloudStorageService {
  private client: any;

  constructor(private config: ConfigService) {
    // 调试日志
    console.log('OSS配置参数:', {
      region: config.get('OSS_REGION'),
      bucket: config.get('OSS_BUCKET'),
      accessKey: config.get('OSS_ACCESS_KEY_ID')?.slice(0, 6) + '...',
    });
    this.client = new OSS({
      accessKeyId: config.get('OSS_ACCESS_KEY_ID'),
      accessKeySecret: config.get('OSS_ACCESS_KEY_SECRET'),
      region: config.get('OSS_REGION'),
      bucket: config.get('OSS_BUCKET'),
    });
  }

  async uploadFile(filename: string, buffer: Buffer) {
    return this.client.put(filename, buffer, {
      headers: { 'x-oss-object-acl': 'public-read' },
    });

    /**
     * 
     * 返回的参数示例
     * {
    "fileUrl": {
        "name": "resume.pdf",
        "url": "http://bucket4resume.oss-cn-wulanchabu.aliyuncs.com/resume.pdf",
        "res": {
            "status": 200,
            "statusCode": 200,
            "statusMessage": "OK",
            "headers": {
                "server": "AliyunOSS",
                "date": "Sat, 12 Apr 2025 09:01:47 GMT",
                "content-length": "0",
                "connection": "keep-alive",
                "x-oss-request-id": "67FA2BFBF525B83736424F7F",
                "etag": "\"031045D8722F641306A7E4504169C7A1\"",
                "x-oss-hash-crc64ecma": "14686369194042830211",
                "content-md5": "AxBF2HIvZBMGp+RQQWnHoQ==",
                "x-oss-server-time": "54"
            },
            "size": 0,
            "aborted": false,
            "rt": 1241,
            "keepAliveSocket": false,
            "data": {
                "type": "Buffer",
                "data": []
            },
            "requestUrls": [
                "http://bucket4resume.oss-cn-wulanchabu.aliyuncs.com/resume.pdf"
            ],
            "timing": null,
            "remoteAddress": "39.101.35.211",
            "remotePort": 80,
            "socketHandledRequests": 1,
            "socketHandledResponses": 1
        }
    },
    "fileName": "resume.pdf"
}
     */
  }
}
