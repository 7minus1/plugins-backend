import { Injectable, ConflictException, NotFoundException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserBitable } from './entities/user-bitable.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateBitableDto } from './dto/update-bitable.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './services/email.service';
import { ResumeService } from '../resume/resume.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserBitable)
    private userBitableRepository: Repository<UserBitable>,
    private jwtService: JwtService,
    private emailService: EmailService,
    @Inject(forwardRef(() => ResumeService))
    private resumeService: ResumeService,
  ) {}

  private generateRandomUsername(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let username = '';
    for (let i = 0; i < 8; i++) {
      username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查邮箱是否已存在
    const existingEmail = await this.usersRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingEmail) {
      throw new ConflictException('邮箱已被注册');
    }

    // 如果未提供用户名，生成随机用户名
    let username = createUserDto.username;
    if (!username) {
      username = this.generateRandomUsername();
      // 确保生成的用户名不重复
      while (await this.usersRepository.findOne({ where: { username } })) {
        username = this.generateRandomUsername();
      }
    } else {
      // 检查用户名是否已存在
      const existingUsername = await this.usersRepository.findOne({
        where: { username }
      });

      if (existingUsername) {
        throw new ConflictException('用户名已存在');
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      username,
      email: createUserDto.email,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    
    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(user.email, user.username);
    
    return savedUser;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email }
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.findByEmail(email);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new NotFoundException('邮箱或密码错误');
    }

    return user;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
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
} 