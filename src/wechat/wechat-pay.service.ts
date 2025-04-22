// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as crypto from 'crypto';
// import axios from 'axios';
// import { v4 as uuidv4 } from 'uuid';

// @Injectable()
// export class WechatPayService {
//   private readonly logger = new Logger(WechatPayService.name);
//   private readonly appId: string;
//   private readonly mchId: string;
//   private readonly apiKey: string;
//   private readonly notifyUrl: string;
//   private readonly tradeType = 'NATIVE'; // 网页扫码支付

//   constructor(private configService: ConfigService) {
//     this.appId = this.configService.get<string>('WECHAT_APP_ID');
//     this.mchId = this.configService.get<string>('WECHAT_MCH_ID');
//     this.apiKey = this.configService.get<string>('WECHAT_API_KEY');
//     this.notifyUrl = this.configService.get<string>('WECHAT_NOTIFY_URL');
//   }

//   /**
//    * 创建支付订单
//    * @param userId 用户ID
//    * @param amount 支付金额（分）
//    * @param description 商品描述
//    * @returns 支付二维码链接
//    */
//   async createOrder(userId: number, amount: number, description: string): Promise<string> {
//     try {
//       const outTradeNo = `VIP_${userId}_${Date.now()}`; // 商户订单号
//       const nonceStr = uuidv4().replace(/-/g, ''); // 随机字符串
//       const timestamp = Math.floor(Date.now() / 1000).toString(); // 时间戳
      
//       // 构建统一下单请求参数
//       const params = {
//         appid: this.appId,
//         mch_id: this.mchId,
//         nonce_str: nonceStr,
//         body: description,
//         out_trade_no: outTradeNo,
//         total_fee: amount,
//         spbill_create_ip: '127.0.0.1', // 终端IP，实际应用中应该从请求中获取
//         notify_url: this.notifyUrl,
//         trade_type: this.tradeType,
//       };
      
//       // 签名
//       const sign = this.generateSign(params);
      
//       // 构建XML请求体
//       const xml = this.buildXml({ ...params, sign });
      
//       // 发送请求到微信支付接口
//       const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xml, {
//         headers: { 'Content-Type': 'text/xml' },
//       });
      
//       // 解析响应
//       const result = this.parseXml(response.data);
      
//       if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
//         // 返回二维码链接
//         return result.code_url;
//       } else {
//         this.logger.error(`微信支付下单失败: ${result.return_msg || result.err_code_des}`);
//         throw new Error(`微信支付下单失败: ${result.return_msg || result.err_code_des}`);
//       }
//     } catch (error) {
//       this.logger.error(`创建微信支付订单失败: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * 验证支付回调
//    * @param xmlData 回调XML数据
//    * @returns 解析后的回调数据
//    */
//   verifyNotify(xmlData: string): any {
//     try {
//       const data = this.parseXml(xmlData);
      
//       // 验证签名
//       const sign = data.sign;
//       delete data.sign;
//       const calculatedSign = this.generateSign(data);
      
//       if (sign !== calculatedSign) {
//         this.logger.error('微信支付回调签名验证失败');
//         return null;
//       }
      
//       return data;
//     } catch (error) {
//       this.logger.error(`解析微信支付回调数据失败: ${error.message}`);
//       return null;
//     }
//   }

//   /**
//    * 生成签名
//    * @param params 参数对象
//    * @returns 签名字符串
//    */
//   private generateSign(params: any): string {
//     // 1. 参数名ASCII码从小到大排序
//     const sortedKeys = Object.keys(params).sort();
    
//     // 2. 拼接字符串
//     let stringSignTemp = '';
//     for (const key of sortedKeys) {
//       if (params[key] !== undefined && params[key] !== '') {
//         stringSignTemp += `${key}=${params[key]}&`;
//       }
//     }
    
//     // 3. 拼接API密钥
//     stringSignTemp += `key=${this.apiKey}`;
    
//     // 4. MD5加密并转大写
//     return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
//   }

//   /**
//    * 构建XML
//    * @param params 参数对象
//    * @returns XML字符串
//    */
//   private buildXml(params: any): string {
//     let xml = '<xml>';
//     for (const key in params) {
//       xml += `<${key}>${params[key]}</${key}>`;
//     }
//     xml += '</xml>';
//     return xml;
//   }

//   /**
//    * 解析XML
//    * @param xml XML字符串
//    * @returns 解析后的对象
//    */
//   private parseXml(xml: string): any {
//     const result = {};
//     const reg = /<([^>]+)>([^<]+)<\/\1>/g;
//     let match;
    
//     while ((match = reg.exec(xml)) !== null) {
//       result[match[1]] = match[2];
//     }
    
//     return result;
//   }
// } 