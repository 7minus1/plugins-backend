import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserBitable } from './entities/user-bitable.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateBitableDto } from './dto/update-bitable.dto';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from './services/sms.service';
import { RedisService } from './services/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBitable)
    private userBitableRepository: Repository<UserBitable>,
    private jwtService: JwtService,
    private smsService: SmsService,
    private redisService: RedisService,
  ) {}

  private generateRandomUsername(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let username = '';
    for (let i = 0; i < 8; i++) {
      username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationCode(phone: string): Promise<boolean> {
    // 检查手机号是否已注册
    const existingUser = await this.usersRepository.findOne({
      where: { phone }
    });

    if (existingUser) {
      throw new ConflictException('手机号已被注册');
    }

    const code = this.generateVerificationCode();
    await this.redisService.setVerificationCode(phone, code);
    return this.smsService.sendVerificationCode(phone, code);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 验证验证码
    const storedCode = await this.redisService.getVerificationCode(createUserDto.phone);
    if (!storedCode || storedCode !== createUserDto.verificationCode) {
      throw new UnauthorizedException('验证码错误或已过期');
    }

    // 如果未提供用户名，生成随机用户名
    let username = createUserDto.username;
    if (!username) {
      username = this.generateRandomUsername();
      while (await this.usersRepository.findOne({ where: { username } })) {
        username = this.generateRandomUsername();
      }
    } else {
      const existingUsername = await this.usersRepository.findOne({
        where: { username }
      });

      if (existingUsername) {
        throw new ConflictException('用户名已存在');
      }
    }

    const user = this.usersRepository.create({
      username,
      phone: createUserDto.phone,
    });

    const savedUser = await this.usersRepository.save(user);
    await this.redisService.deleteVerificationCode(createUserDto.phone);
    
    return savedUser;
  }

  async findByPhone(phone: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { phone }
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async login(phone: string, verificationCode: string): Promise<any> {
    const user = await this.findByPhone(phone);
    
    // 验证验证码
    const storedCode = await this.redisService.getVerificationCode(phone);
    if (!storedCode || storedCode !== verificationCode) {
      throw new UnauthorizedException('验证码错误或已过期');
    }

    await this.redisService.deleteVerificationCode(phone);

    const payload = { phone: user.phone, sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username
      }
    };
  }

  async sendLoginVerificationCode(phone: string): Promise<boolean> {
    // 检查手机号是否已注册
    const existingUser = await this.usersRepository.findOne({
      where: { phone }
    });

    if (!existingUser) {
      throw new NotFoundException('用户不存在');
    }

    const code = this.generateVerificationCode();
    await this.redisService.setVerificationCode(phone, code);
    return this.smsService.sendVerificationCode(phone, code);
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async getBitableInfo(userId: number) {
    const userBitable = await this.userBitableRepository.findOne({ where: { userId } });
    if (!userBitable) {
      return null;
    }
    return userBitable;
  }

  async updateTableId(userId: number, tableId: string) {
    return this.userBitableRepository.update(
      { userId },
      { tableId }
    );
  }

  async updateBitableInfo(userId: number, updateBitableDto: UpdateBitableDto) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      let userBitable = await this.userBitableRepository.findOne({ where: { userId } });
      
      if (!userBitable) {
        userBitable = this.userBitableRepository.create({
          userId,
          bitableUrl: updateBitableDto.bitableUrl,
          bitableToken: updateBitableDto.bitableToken,
        });
      } else {
        userBitable.bitableUrl = updateBitableDto.bitableUrl;
        userBitable.bitableToken = updateBitableDto.bitableToken;
      }

      return await this.userBitableRepository.save(userBitable);
    } catch (error) {
      console.error('Error updating bitable info:', error);
      throw error;
    }
  }
} 