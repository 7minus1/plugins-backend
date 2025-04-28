import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HrUser } from './entities/user.entity';
import { HrUserBitable } from './entities/user-bitable.entity';
import { CreateHrUserDto } from './dto/create-user.dto';
import { UpdateHrBitableDto } from './dto/update-bitable.dto';
import { JwtService } from '@nestjs/jwt';
import { HrResumeService } from '../resume/resume.service';
import { HrSmsService } from './services/sms.service';
import { HrRedisService } from './services/redis.service';
import { ConfigService } from '@nestjs/config';
import { BitableConfigException } from '../../common/exceptions/bitable-config.exception';

// 用户上传次数相关常量
export const DEFAULT_UPLOAD_COUNT = 0; // 新用户默认已使用次数

@Injectable()
export class HrUsersService {
  constructor(
    @InjectRepository(HrUser)
    private usersRepository: Repository<HrUser>,
    @InjectRepository(HrUserBitable)
    private userBitableRepository: Repository<HrUserBitable>,
    private jwtService: JwtService,
    private smsService: HrSmsService,
    private redisService: HrRedisService,
    private configService: ConfigService,
    @Inject(forwardRef(() => HrResumeService))
    private resumeService: HrResumeService,
  ) {}

  // 获取免费上传次数限制
  private getFreeUploadLimit(): number {
    return parseInt(
      this.configService.get<string>('FREE_UPLOAD_LIMIT', '20'),
      10,
    );
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

  async create(createUserDto: CreateHrUserDto): Promise<HrUser> {
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

  async findByPhone(phoneNumber: string): Promise<HrUser | null> {
    return await this.usersRepository.findOne({
      where: { phoneNumber },
    });
  }

  async findById(id: number): Promise<HrUser> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async update(id: number, user: HrUser): Promise<HrUser> {
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

  async updateTableId(userId: number, tableId: string) {
    return this.userBitableRepository.update({ userId }, { tableId });
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

  async updateBitableInfo(userId: number, updateBitableDto: UpdateHrBitableDto) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 从 URL 中提取 tableId
      const tableId = this.extractTableIdFromUrl(updateBitableDto.bitableUrl);

      // 检测多维表配置是否成功
      const result = await this.resumeService.checkBitableConfig(
        updateBitableDto.bitableUrl,
        tableId,
        updateBitableDto.bitableToken
      );
      
      if (!result) {
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
          tableId: tableId
        });
      } else {
        userBitable.bitableUrl = updateBitableDto.bitableUrl;
        userBitable.bitableToken = updateBitableDto.bitableToken;
        userBitable.tableId = tableId;
      }


      // 保存bitable信息
      userBitable = await this.userBitableRepository.save(userBitable);
      return userBitable;
    } catch (error) {
      console.error('Error updating bitable info:', error);
      throw error;
    }
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
    return {
      uploadCount: user.uploadCount,
      remainingCount: user.isVip
        ? -1
        : Math.max(0, freeUploadLimit - user.uploadCount),
      isUnlimited: user.isVip,
    };
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
  ): Promise<HrUser> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.isVip = isVip;
    user.vipExpireDate = vipExpireDate;

    return await this.usersRepository.save(user);
  }
} 