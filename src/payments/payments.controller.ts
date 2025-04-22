import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  @ApiOperation({ summary: '创建会员订单' })
  async createOrder(@Request() req) {
    return this.paymentsService.createOrder(req.user.userId);
  }

  @Post('notify')
  @ApiOperation({ summary: '微信支付回调通知' })
  async handlePaymentNotify(@Body() notifyData: any) {
    return this.paymentsService.handlePaymentNotify(notifyData);
  }
} 