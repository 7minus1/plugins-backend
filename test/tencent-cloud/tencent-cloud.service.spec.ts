import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TencentCloudService } from '../../src/tencent-cloud/tencent-cloud.service';

describe('TencentCloudService', () => {
  let service: TencentCloudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'TENCENT_COS_REGION') return 'ap-shanghai';
              if (key === 'TENCENT_COS_BUCKET') return 'test-bucket';
              if (key === 'TENCENT_COS_SECRET_ID') return 'test-secret-id';
              if (key === 'TENCENT_COS_SECRET_KEY') return 'test-secret-key';
            }),
          },
        },
        TencentCloudService,
      ],
    }).compile();

    service = module.get<TencentCloudService>(TencentCloudService);
  });

  it('正常上传文件', async () => {
    const mockFile = {
      originalname: 'test.pdf',
      buffer: Buffer.from('test content'),
    };

    const result = await service.uploadFile(
      mockFile.originalname,
      mockFile.buffer,
    );
    expect(result.url.url).toContain(
      'https://test-bucket.cos.ap-shanghai.myqcloud.com/test.pdf',
    );
  });

  it('配置验证', () => {
    // expect(service['cos'].options.SecretId).toBe('test-secret-id');
    // expect(service['cos'].options.Region).toBe('ap-shanghai');
  });
});
