import { Test, TestingModule } from '@nestjs/testing';
import { ResumeController } from '../../src/resume/resume.controller';
class CreateResumeDto {
  name: string;
  position: string;
}
import { CloudStorageService } from '../../src/cloud-storage/cloud-storage.service';
import { CozeApiService } from '../../src/coze-api/coze-api.service';
import * as request from 'supertest';

describe('ResumeController (e2e)', () => {
  let app;

  const mockCloudStorage = {
    uploadFile: jest
      .fn()
      .mockResolvedValue('https://oss.example.com/resume.pdf')
      .mockRejectedValueOnce(new Error('Invalid file format')),
  };

  const mockCozeApi = {
    executeResumeParser: jest
      .fn()
      .mockResolvedValue({
        name: '张三',
        contact: '13800138000',
        education: [{ school: '清华大学' }],
      })
      .mockRejectedValueOnce(new Error('API timeout')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResumeController],
      providers: [
        { provide: CloudStorageService, useValue: mockCloudStorage },
        { provide: CozeApiService, useValue: mockCozeApi },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('/resume (POST) 正常简历上传流程', async () => {
    return request(app.getHttpServer())
      .post('/resume')
      .field('name', '李四')
      .field('position', '全栈工程师')
      .attach('file', Buffer.from('test'), 'valid.pdf')
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('fileUrl');
        expect(res.body.fileUrl).toMatch(
          /^https:\/\/oss\.example\.com\/.+\.pdf$/,
        );
      });
  });

  it('/resume (POST) 上传非PDF文件应报错', async () => {
    return request(app.getHttpServer())
      .post('/resume')
      .field('name', '王五')
      .attach('file', Buffer.from('test'), 'invalid.txt')
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('Invalid file format');
      });
  });

  it('/resume (POST) 处理Coze API超时', async () => {
    return request(app.getHttpServer())
      .post('/resume')
      .attach('file', Buffer.from('test'), 'timeout.pdf')
      .expect(500)
      .expect((res) => {
        expect(res.body.message).toContain('API timeout');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
