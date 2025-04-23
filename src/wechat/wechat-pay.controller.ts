// import { Controller, Post, Body, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
// import { WechatPayService } from './wechat-pay.service';
// import { UsersService } from '../users/users.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
// import { Response } from 'express';

// @ApiTags('微信支付')
// @Controller('wechat-pay')
// export class WechatPayController {
//   constructor(
//     private readonly wechatPayService: WechatPayService,
//     private readonly usersService: UsersService,
//   ) {}

//   @Post('create-vip-order')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
//   @ApiOperation({ summary: '创建VIP支付订单' })
//   @ApiResponse({ status: 200, description: '创建成功，返回支付二维码链接' })
//   async createVipOrder(@Request() req) {
//     const amount = 9900; // 99元，单位：分
//     const description = 'VIP会员一年';
//     const qrCodeUrl = await this.wechatPayService.createOrder(
//       req.user.userId,
//       amount,
//       description,
//     );
//     return { qrCodeUrl };
//   }

//   @Post('notify')
//   @ApiOperation({ summary: '微信支付回调接口' })
//   async handlePaymentNotify(@Body() xmlData: string, @Res() res: Response) {
//     const notifyData = this.wechatPayService.verifyNotify(xmlData);

//     if (!notifyData) {
//       return res.status(HttpStatus.BAD_REQUEST).send('FAIL');
//     }

//     if (notifyData.return_code === 'SUCCESS' && notifyData.result_code === 'SUCCESS') {
//       // 解析商户订单号，获取用户ID
//       const outTradeNo = notifyData.out_trade_no;
//       const userId = parseInt(outTradeNo.split('_')[1]);

//       // 更新用户VIP状态
//       const oneYearLater = new Date();
//       oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

//       await this.usersService.updateVipStatus(userId, true, oneYearLater);

//       return res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
//     }

//     return res.status(HttpStatus.BAD_REQUEST).send('FAIL');
//   }
// }
