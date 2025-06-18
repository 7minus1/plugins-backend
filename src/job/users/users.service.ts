import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobUser } from './entities/user.entity';
import { JobUserBitable } from './entities/user-bitable.entity';
import { JobVipType } from './entities/vip-type.entity';
import { CreateJobUserDto } from './dto/create-user.dto';
import { UpdateJobBitableDto } from './dto/update-bitable.dto';
import { JwtService } from '@nestjs/jwt';
import { JobSmsService } from './services/sms.service';
import { JobRedisService } from './services/redis.service';
import { ConfigService } from '@nestjs/config';
import { JobResumeService } from '../resume/resume.service';
import { BitableConfigException } from '../../common/exceptions/bitable-config.exception';

// 用户上传次数相关常量
export const DEFAULT_UPLOAD_COUNT = 0; // 新用户默认已使用次数

@Injectable()
export class JobUsersService {
  constructor(
    @InjectRepository(JobUser)
    private usersRepository: Repository<JobUser>,
    @InjectRepository(JobUserBitable)
    private userBitableRepository: Repository<JobUserBitable>,
    @InjectRepository(JobVipType)
    private vipTypeRepository: Repository<JobVipType>,
    private jwtService: JwtService,
    private smsService: JobSmsService,
    private redisService: JobRedisService,
    private configService: ConfigService,
    @Inject(forwardRef(() => JobResumeService))
    private resumeService: JobResumeService,
  ) {}

  // 获取免费上传次数限制
  private getFreeUploadLimit(): number {
    return parseInt(
      this.configService.get<string>('JOB_FREE_UPLOAD_LIMIT', '20'),
      10,
    );
  }

  // 获取VIP上传次数限制
  private async getVipUploadLimit(userId: number): Promise<number> {
    const user = await this.findById(userId);
    // console.log('user', user);
    if (!user.isVip || !user.vipTypeId) {
      return 0;
    }
    // console.log('user.vipTypeId', user.vipTypeId);
    const vipType = await this.vipTypeRepository.findOne({
      where: { id: user.vipTypeId, isActive: true }
    });
    
    if (!vipType) {
      return 0;
    }
    console.log('vipType', vipType);
    console.log('vipType.uploadLimit', vipType.uploadLimit);
    return vipType.uploadLimit;
  }

  private generateRandomUsername(): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let username = '';
    for (let i = 0; i < 8; i++) {
      username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
  }

  async create(createUserDto: CreateJobUserDto): Promise<JobUser> {
    // 检查手机号是否已存在
    const existingPhone = await this.usersRepository.findOne({
      where: { phoneNumber: createUserDto.phoneNumber },
    });

    if (existingPhone) {
      throw new ConflictException('手机号已被注册');
    }

    // 如果未提供用户名，生成随机用户名
    let username = createUserDto.username;
    if (!username) {
      username = this.generateRandomUsername();
    }

    const user = this.usersRepository.create({
      username,
      phoneNumber: createUserDto.phoneNumber,
      uploadCount: DEFAULT_UPLOAD_COUNT,
    });

    return await this.usersRepository.save(user);
  }

  async findByPhone(phoneNumber: string): Promise<JobUser | null> {
    return await this.usersRepository.findOne({
      where: { phoneNumber },
    });
  }

  async findById(id: number): Promise<JobUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async update(id: number, user: JobUser): Promise<JobUser> {
    await this.usersRepository.update(id, user);
    return this.findById(id);
  }

  async generateVerificationCode(): Promise<string> {
    return Math.random().toString().slice(2, 8);
  }

  async sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; codeExists: boolean }> {
    // 检查是否已经存在有效的验证码
    const existingCode = await this.redisService.getVerificationCode(phoneNumber);
    if (existingCode) {
      // 已存在有效验证码
      return { success: false, codeExists: true };
    }

    const code = await this.generateVerificationCode();
    const sent = await this.smsService.sendVerificationCode(phoneNumber, code);
    if (sent) {
      // 设置验证码，5分钟有效期
      await this.redisService.setVerificationCode(phoneNumber, code, 300);
    }
    return { success: sent, codeExists: false };
  }

  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const savedCode = await this.redisService.getVerificationCode(phoneNumber);
    
    // 先判断是否相同
    if (savedCode === code) {
      // 验证成功后删除验证码
      await this.redisService.deleteVerificationCode(phoneNumber);
      return true;
    }
    return code === '123456'; // 备用验证码
  }

  // 检查验证码是否存在
  async checkVerificationCodeExists(phoneNumber: string): Promise<boolean> {
    const code = await this.redisService.getVerificationCode(phoneNumber);
    return !!code;
  }

  async loginOrRegisterWithPhone(phoneNumber: string): Promise<any> {
    let user = await this.findByPhone(phoneNumber);

    if (!user) {
      // 如果用户不存在，创建新用户
      const username = this.generateRandomUsername();
      user = this.usersRepository.create({
        username,
        phoneNumber,
        isActive: true,
      });
      await this.usersRepository.save(user);
    }

    const payload = {
      phoneNumber: user.phoneNumber,
      sub: user.id,
      username: user.username,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        username: user.username,
      },
    };
  }

  // 获取用户多维表配置
  async getBitableInfo(userId: number) {
    const userBitable = await this.userBitableRepository.findOne({
      where: { userId },
    });
    
    if (!userBitable) {
      return {
        configured: false,
        message: '您尚未配置多维表信息'
      };
    }
    
    return {
      configured: true,
      data: userBitable
    };
  }

  // 更新用户多维表配置
  async updateBitableInfo(userId: number, updateBitableDto: UpdateJobBitableDto) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 从 URL 中提取 tableId
      // const extractedTableId = this.extractTableIdFromUrl(updateBitableDto.bitableUrl);

      // 通过查表得到三个表的ID（也能够检测多维表配置是否成功）
      const tableIds = await this.resumeService.checkAndGetTableId(
        updateBitableDto.bitableUrl,
        updateBitableDto.bitableToken
      );
      // 如果数组为空，则多维表配置不成功
      if (tableIds.length === 0) {
        throw new BitableConfigException();
      }

      let userBitable = await this.userBitableRepository.findOne({
        where: { userId },
      });

      if (!userBitable) {
        userBitable = this.userBitableRepository.create({
          user,
          userId,
          bitableUrl: updateBitableDto.bitableUrl,
          bitableToken: updateBitableDto.bitableToken,
          // 默认新提取的tableId作为公司表ID，其他表ID用户需要单独设置
          positionTableId: tableIds[0],
          companyTableId: tableIds[1],
          resumeTableId: tableIds[2]
        });
      } else {
        userBitable.bitableUrl = updateBitableDto.bitableUrl;
        userBitable.bitableToken = updateBitableDto.bitableToken;
        userBitable.positionTableId = tableIds[0];
        userBitable.companyTableId = tableIds[1];
        userBitable.resumeTableId = tableIds[2];
      }

      // 保存bitable信息
      userBitable = await this.userBitableRepository.save(userBitable);
      return userBitable;
    } catch (error) {
      console.error('Error updating bitable info:', error);
      throw error;
    }
  }

  // 获取公司表配置
  async getCompanyBitableInfo(userId: number) {
    const userBitable = await this.userBitableRepository.findOne({
      where: { userId },
    });
    
    if (!userBitable || !userBitable.companyTableId) {
      return {
        configured: false,
        message: '您尚未配置公司信息表'
      };
    }
    
    return {
      configured: true,
      data: {
        bitableUrl: userBitable.bitableUrl,
        bitableToken: userBitable.bitableToken,
        tableId: userBitable.companyTableId,
        userId: userBitable.userId
      }
    };
  }

  // 获取职位表配置
  async getPositionBitableInfo(userId: number) {
    const userBitable = await this.userBitableRepository.findOne({
      where: { userId },
    });
    
    if (!userBitable || !userBitable.positionTableId) {
      return {
        configured: false,
        message: '您尚未配置职位信息表'
      };
    }
    
    return {
      configured: true,
      data: {
        bitableUrl: userBitable.bitableUrl,
        bitableToken: userBitable.bitableToken,
        tableId: userBitable.positionTableId,
        userId: userBitable.userId
      }
    };
  }

  // 获取简历表配置
  async getResumeBitableInfo(userId: number) {
    const userBitable = await this.userBitableRepository.findOne({
      where: { userId },
    });
    
    if (!userBitable || !userBitable.resumeTableId) {
      return {
        configured: false,
        message: '您尚未配置简历信息表'
      };
    }
    
    return {
      configured: true,
      data: {
        bitableUrl: userBitable.bitableUrl,
        bitableToken: userBitable.bitableToken,
        tableId: userBitable.resumeTableId,
        userId: userBitable.userId
      }
    };
  }

  async testSendSms(
    phoneNumber: string,
  ): Promise<{ success: boolean; code?: string }> {
    const code = '123456'; // 测试用固定验证码
    const sent = await this.smsService.sendVerificationCode(phoneNumber, code);
    return {
      success: sent,
      code: sent ? code : undefined,
    };
  }

  async getUploadCount(userId: number) {
    const user = await this.findById(userId);
    const freeUploadLimit = this.getFreeUploadLimit();
    
    if (!user.isVip) {
      return {
        uploadCount: user.uploadCount,
        remainingCount: Math.max(0, freeUploadLimit - user.uploadCount),
        isUnlimited: false,
      };
    }
    
    // 获取VIP用户的上传限制
    const vipUploadLimit = await this.getVipUploadLimit(userId);
    // console.log('vipUploadLimit', vipUploadLimit);
    
    return {
      uploadCount: user.uploadCount,
      remainingCount: Math.max(0, vipUploadLimit - user.uploadCount),
      isUnlimited: false,
    };
  }

  // 检查用户是否有剩余上传次数
  async checkRemainingUploads(userId: number): Promise<{ 
    canUpload: boolean; 
    message?: string;
    remainingCount?: number;
  }> {
    const user = await this.findById(userId);
    const freeUploadLimit = this.getFreeUploadLimit();
    
    if (!user.isVip) {
      // 普通用户
      if (user.uploadCount >= freeUploadLimit) {
        return {
          canUpload: false,
          message: `非会员用户上传次数已达上限（${freeUploadLimit}次），请升级为会员继续使用`,
          remainingCount: 0
        };
      }
      return {
        canUpload: true,
        remainingCount: freeUploadLimit - user.uploadCount
      };
    }
    
    // VIP用户
    const vipUploadLimit = await this.getVipUploadLimit(userId);
    
    if (vipUploadLimit === 0) {
      return {
        canUpload: false,
        message: '您的VIP类型无效或已过期，请重新开通VIP',
        remainingCount: 0
      };
    }
    
    if (user.uploadCount >= vipUploadLimit) {
      return {
        canUpload: false,
        message: `VIP用户上传次数已达上限（${vipUploadLimit}次）`,
        remainingCount: 0
      };
    }
    
    return {
      canUpload: true,
      remainingCount: vipUploadLimit - user.uploadCount
    };
  }

  // 增加上传次数
  async incrementUploadCount(userId: number): Promise<JobUser> {
    const user = await this.findById(userId);
    user.uploadCount += 1;
    return await this.usersRepository.save(user);
  }

  /**
   * 更新用户VIP状态
   * @param userId 用户ID
   * @param isVip 是否为VIP
   * @param vipExpireDate VIP过期时间
   */
  async updateVipStatus(
    userId: number,
    isVip: boolean,
    vipExpireDate: Date,
    vipTypeId?: number,
  ): Promise<JobUser> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.isVip = isVip;
    user.vipExpireDate = vipExpireDate;
    
    if (vipTypeId) {
      // 验证VIP类型是否存在
      const vipType = await this.vipTypeRepository.findOne({
        where: { id: vipTypeId, isActive: true }
      });
      
      if (!vipType) {
        throw new NotFoundException('VIP类型不存在或已禁用');
      }
      
      user.vipTypeId = vipTypeId;
    } else if (!isVip) {
      // 如果取消VIP，清除VIP类型
      user.vipTypeId = null;
    }

    return await this.usersRepository.save(user);
  }

  // 获取所有VIP类型
  async getAllVipTypes(): Promise<JobVipType[]> {
    return await this.vipTypeRepository.find({
      where: { isActive: true },
      order: { uploadLimit: 'ASC' }
    });
  }
  
  // 创建VIP类型
  async createVipType(name: string, uploadLimit: number, description?: string): Promise<JobVipType> {
    const vipType = this.vipTypeRepository.create({
      name,
      uploadLimit,
      description,
      isActive: true
    });
    
    return await this.vipTypeRepository.save(vipType);
  }
  
  // 更新VIP类型
  async updateVipType(id: number, data: Partial<JobVipType>): Promise<JobVipType> {
    const vipType = await this.vipTypeRepository.findOne({
      where: { id }
    });
    
    if (!vipType) {
      throw new NotFoundException('VIP类型不存在');
    }
    
    Object.assign(vipType, data);
    return await this.vipTypeRepository.save(vipType);
  }
  
  // 删除VIP类型
  async deleteVipType(id: number): Promise<void> {
    const result = await this.vipTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('VIP类型不存在');
    }
  }

  private extractTableIdFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const tableId = urlObj.searchParams.get('table');
      if (!tableId) {
        throw new Error('无法从URL中提取tableId');
      }
      return tableId;
    } catch (error) {
      throw new Error('无效的飞书多维表格URL');
    }
  }
} 