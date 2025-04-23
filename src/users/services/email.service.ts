import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    this.transporter.verify(function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log('email is ready');
      }
    });
  }

  async sendWelcomeEmail(email: string, username: string) {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject: '欢迎使用我们的产品',
      html: `
        <h1>欢迎加入我们！</h1>
        <p>亲爱的 ${username}：</p>
        <p>感谢您注册我们的产品。我们很高兴您能成为我们的一员！</p>
        <p>如果您有任何问题，请随时联系我们。</p>
        <p>祝您使用愉快！</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('发送欢迎邮件失败:', error);
      return false;
    }
  }

  async sendVerificationCode(email: string, code: string) {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject: '验证码 - 用户注册',
      html: `
        <h1>验证码</h1>
        <p>您的验证码是: <strong>${code}</strong></p>
        <p>验证码有效期为10分钟，请尽快使用。</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('发送邮件失败:', error);
      return false;
    }
  }
}
