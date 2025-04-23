import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { UsersService } from '../users/users.service';
import WxPay from 'wechatpay-node-v3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private wxpay: any;

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    this.wxpay = new WxPay({
      appid: this.configService.get('WXPAY_APPID'),
      mchid: this.configService.get('WXPAY_MCHID'),
      privateKey: this.configService.get('WXPAY_PRIVATE_KEY'),
      serial_no: this.configService.get('WXPAY_SERIAL_NO'),
      key: this.configService.get('WXPAY_KEY'),
      publicKey: this.configService.get('WXPAY_PUBLIC_KEY'),
      authType: 'WECHATPAY2-SHA256-RSA2048',
    });
  }

  async createOrder(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const orderNo = `VIP${Date.now()}${Math.random().toString().slice(2, 6)}`;
    const amount = 9900; // 99元，单位：分

    const payment = this.paymentsRepository.create({
      userId,
      orderNo,
      amount,
      status: 'PENDING',
    });

    await this.paymentsRepository.save(payment);

    const result = await this.wxpay.transactions_jsapi({
      description: '会员订阅',
      out_trade_no: orderNo,
      amount: {
        total: amount,
        currency: 'CNY',
      },
      payer: {
        // openid: user.openid, // 需要用户授权获取openid
      },
    });

    return {
      orderNo,
      paymentInfo: result,
    };
  }

  async handlePaymentNotify(notifyData: any) {
    const { resource } = notifyData;
    const { out_trade_no, transaction_id, trade_state } =
      resource.original_type === 'encrypt'
        ? this.wxpay.decipher_gcm(resource)
        : resource;

    const payment = await this.paymentsRepository.findOne({
      where: { orderNo: out_trade_no },
    });
    if (!payment) {
      throw new NotFoundException('订单不存在');
    }

    if (trade_state === 'SUCCESS') {
      payment.status = 'SUCCESS';
      payment.transactionId = transaction_id;
      payment.paymentResult = resource;
      await this.paymentsRepository.save(payment);

      // 更新用户会员状态
      const user = await this.usersService.findById(payment.userId);
      user.isVip = true;
      user.vipExpireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天会员
      await this.usersService.update(user.id, user);
    }

    return { code: 'SUCCESS', message: '成功' };
  }
}
