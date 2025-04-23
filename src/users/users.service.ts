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
import { User } from './entities/user.entity';
import { UserBitable } from './entities/user-bitable.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateBitableDto } from './dto/update-bitable.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
// import { EmailService } from './services/email.service';
import { ResumeService } from '../resume/resume.service';
import { SmsService } from './services/sms.service';
import { RedisService } from './services/redis.service';
import { ConfigService } from '@nestjs/config';

// 用户上传次数相关常量
export const DEFAULT_UPLOAD_COUNT = 0; // 新用户默认已使用次数

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBitable)
    private userBitableRepository: Repository<UserBitable>,
    private jwtService: JwtService,
    // private emailService: EmailService,
    private smsService: SmsService,
    private redisService: RedisService,
    private configService: ConfigService,
    @Inject(forwardRef(() => ResumeService))
    private resumeService: ResumeService,
  ) {}

  // 获取免费上传次数限制
  private getFreeUploadLimit(): number {
    return parseInt(
      this.configService.get<string>('FREE_UPLOAD_LIMIT', '5'),
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

  async create(createUserDto: CreateUserDto): Promise<User> {
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

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      username,
      phoneNumber: createUserDto.phoneNumber,
      password: hashedPassword,
      uploadCount: DEFAULT_UPLOAD_COUNT, // 使用常量设置默认上传次数
    });

    return await this.usersRepository.save(user);
  }

  async findByPhone(phoneNumber: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { phoneNumber },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async validateUser(phoneNumber: string, password: string): Promise<any> {
    const user = await this.findByPhone(phoneNumber);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    return user;
  }

  async login(user: User) {
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

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async update(id: number, user: User): Promise<User> {
    await this.usersRepository.update(id, user);
    return this.findById(id);
  }

  async getBitableInfo(userId: number) {
    const userBitable = await this.userBitableRepository.findOne({
      where: { userId },
    });
    if (!userBitable) {
      return null;
    }
    return userBitable;
  }

  async updateTableId(userId: number, tableId: string) {
    return this.userBitableRepository.update({ userId }, { tableId });
  }

  async updateBitableInfo(userId: number, updateBitableDto: UpdateBitableDto) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
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
        });
      } else {
        userBitable.bitableUrl = updateBitableDto.bitableUrl;
        userBitable.bitableToken = updateBitableDto.bitableToken;
      }

      // 保存bitable信息
      userBitable = await this.userBitableRepository.save(userBitable);

      // 创建新表并更新tableId
      try {
        const newTableId = await this.resumeService.createNewTable(userId);
        userBitable.tableId = newTableId;
        userBitable = await this.userBitableRepository.save(userBitable);
      } catch (error) {
        console.error('Error creating new table:', error);
        // 这里我们不抛出错误，因为bitable信息已经更新成功
      }

      return userBitable;
    } catch (error) {
      console.error('Error updating bitable info:', error);
      throw error;
    }
  }

  async generateVerificationCode(): Promise<string> {
    return Math.random().toString().slice(2, 8);
  }

  async sendVerificationCode(phoneNumber: string): Promise<boolean> {
    const code = await this.generateVerificationCode();
    const sent = await this.smsService.sendVerificationCode(phoneNumber, code);
    if (sent) {
      await this.redisService.setVerificationCode(phoneNumber, code);
    }
    return sent;
  }

  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const savedCode = await this.redisService.getVerificationCode(phoneNumber);
    if (!savedCode) {
      return false;
    }
    return savedCode === code;
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
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.isVip = isVip;
    user.vipExpireDate = vipExpireDate;

    return await this.usersRepository.save(user);
  }
}
