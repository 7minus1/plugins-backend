import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudStorageService } from '../../src/cloud-storage/cloud-storage.service';

describe('CloudStorageService', () => {
  let service: CloudStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OSS_REGION') return 'oss-cn-shanghai';
              if (key === 'OSS_BUCKET') return 'test-bucket';
              if (key === 'OSS_ACCESS_KEY_ID') return 'test-access-key';
              if (key === 'OSS_ACCESS_KEY_SECRET') return 'test-secret-key';
            })
          }
        },
        {
          provide: CloudStorageService,
          useValue: {
            uploadFile: jest.fn()
              .mockResolvedValue('https://oss.example.com/valid-file.pdf')
              .mockRejectedValueOnce(new Error('Invalid file format'))
          },
        },
      ],
    }).compile();

    service = module.get<CloudStorageService>(CloudStorageService);
  });

  it('正常上传PDF文件', async () => {
    const mockFile = {
      originalname: 'test.pdf',
      buffer: Buffer.from('test content'),
    };

    const result = await service.uploadFile(mockFile.originalname, mockFile.buffer);
    expect(result).toMatch(/^https:\/\/oss\.example\.com\/.+\.pdf$/);
    expect(service.uploadFile).toBeCalledWith('test.pdf', expect.any(Buffer));
  });

  it('上传非PDF文件应报错', async () => {
    const mockFile = {
      originalname: 'invalid.txt',
      buffer: Buffer.from('invalid content'),
    };

    await expect(service.uploadFile(mockFile.originalname, mockFile.buffer))
      .rejects.toThrow('Invalid file format');
  });

  it('大文件分片上传', async () => {
    const largeFile = {
      originalname: 'large-video.mp4',
      buffer: Buffer.alloc(1024 * 1024 * 21) // 21MB
    };

    const result = await service.uploadFile(largeFile.originalname, largeFile.buffer);
    expect(result).toContain('multipart-upload-id=');
  });
});

describe('OSS配置验证', () => {
  it('应该正确加载endpoint配置', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'OSS_REGION') return 'oss-cn-shanghai';
              if (key === 'OSS_BUCKET') return 'test-bucket';
            },
          },
        },
      ],
    }).compile();

    const service = module.get<CloudStorageService>(CloudStorageService);
    expect(service['client'].options.region).toBe('oss-cn-shanghai');
    expect(service['client'].options.bucket).toBe('test-bucket');
  });

  it('无效accessKey应该抛出异常', async () => {
    await expect(
      Test.createTestingModule({
        providers: [
          CloudStorageService,
          {
            provide: ConfigService,
            useValue: {
              get: () => 'invalid_key',
            },
          },
        ],
      }).compile()
    ).rejects.toThrowError(/InvalidAccessKeyId/);
  });
});