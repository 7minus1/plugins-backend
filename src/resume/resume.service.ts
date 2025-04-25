import {
  Injectable,
  Inject,
  forwardRef,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { createReadStream } from 'fs';
// import { FeishuService } from '../feishu/feishu.service';
// import { CloudStorageService } from '../cloud-storage/cloud-storage.service';
import { TencentCloudService } from 'src/tencent-cloud/tencent-cloud.service';
import { CozeApiService } from '../coze-api/coze-api.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { ResumeParserDto } from './dto/resume.dto';
import { FeishuService } from '../feishu/feishu.service';
import { console } from 'inspector';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResumeService {
  constructor(
    private readonly feishuService: FeishuService,
    // private readonly cloudStorage: CloudStorageService,
    private readonly cloudStorage: TencentCloudService,
    private readonly cozeApi: CozeApiService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async processResume(file: Express.Multer.File, userId: number, createResumeDto: CreateResumeDto) {
    console.log('开始处理简历上传请求');
    // 获取用户信息
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    console.log('用户信息获取成功:', { userId, isVip: user.isVip, uploadCount: user.uploadCount });

    // 检查用户是否是会员
    if (!user.isVip) {
      // 检查上传次数是否超过限制
      if (user.uploadCount >= 5) {
        throw new ForbiddenException(
          '非会员用户上传次数已达上限，请升级为会员继续使用',
        );
      }
    }

    try {
      console.log('开始获取用户bitable信息');
      // 获取用户的bitable信息
      const userBitable = await this.usersService.getBitableInfo(userId);
      if (!userBitable) {
        throw new Error('请先配置多维表格信息');
      }
      console.log('用户bitable信息获取成功:', { 
        appToken: userBitable.bitableUrl.split('?')[0].split('/').pop(),
        tableId: userBitable.tableId 
      });

      // 解析得到apptoken
      const appToken = userBitable.bitableUrl.split('?')[0].split('/').pop();
      const tableId = userBitable.tableId;
      const bitableToken = userBitable.bitableToken;

      // 生成新的文件名
      const fileExtension = file.originalname.split('.').pop();
      const newFileName = `${Date.now()}.${fileExtension}`;

      console.log('newFileName', newFileName);
      const fileInfo = await this.cloudStorage.uploadFile(
        newFileName,
        file.buffer,
      );
      const fileName = fileInfo.name;
      const fileUrl = fileInfo.url;
      console.log('文件上传成功:', { fileName, fileUrl });

      console.log('开始上传文件到飞书');
      // 上传文件到飞书多维表格
      let fileToken;
      try {
        fileToken = await this.feishuService.uploadFile(
        file,
        newFileName,
        appToken,
        bitableToken,
      );
        console.log('文件上传到飞书成功:', { fileToken });
      } catch (error) {
        console.error('飞书文件上传失败:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        
        // 检查是否是飞书验证失败
        if (error.response?.status === 400 && error.response?.data?.code === 9499) {
          throw new HttpException(
            '飞书多维表格验证失败，请检查多维表格配置是否正确',
            HttpStatus.BAD_REQUEST,
          );
        }
        
        throw new HttpException(
          `飞书文件上传失败: ${error.response?.data?.msg || error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 添加数据到飞书表格
      try {
        console.log('开始添加数据到飞书表格');
        
        // 检查必要参数
        if (!appToken || !tableId || !bitableToken) {
          console.error('缺少必要参数:', { appToken, tableId, bitableToken });
          throw new Error('缺少必要参数');
        }

        // 检查文件token
        if (!fileToken) {
          console.error('文件token为空');
          throw new Error('文件上传失败');
        }

        // 打印请求数据，方便调试
        console.log('飞书表格请求数据:', {
          appToken,
          tableId,
          bitableToken,
          fileToken,
          deliveryChannel: createResumeDto.deliveryChannel,
          deliveryPosition: createResumeDto.deliveryPosition,
        });

        const feishuResponse = await this.feishuService.addFileRecord(
        appToken,
        tableId,
        bitableToken,
          fileToken,
          {
            deliveryChannel: createResumeDto.deliveryChannel,
            deliveryPosition: createResumeDto.deliveryPosition,
          }
        );
        console.log('飞书表格数据添加成功:', feishuResponse);

        if (!feishuResponse || !feishuResponse.record?.record_id) {
          throw new Error('飞书表格响应数据格式错误');
        }

      // 只有在整个流程成功完成后，才增加上传次数
      if (!user.isVip) {
        user.uploadCount += 1;
        await this.usersService.update(user.id, user);
      }

      return {
          message: '简历上传成功',
          data: {
            recordId: feishuResponse.record.record_id,
            fileName: file.originalname,
            deliveryChannel: createResumeDto.deliveryChannel,
            deliveryPosition: createResumeDto.deliveryPosition,
          },
        remainingUploads: user.isVip ? '无限' : 5 - user.uploadCount,
      };
      } catch (error) {
        console.error('添加飞书表格数据失败:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
          stack: error.stack,
        });
        
        // 根据不同的错误类型返回不同的错误信息
        if (error.response?.status === 400) {
          // 检查是否是飞书验证失败
          if (error.response?.data?.code === 9499) {
            throw new HttpException(
              '飞书多维表格验证失败，请检查多维表格配置是否正确',
              HttpStatus.BAD_REQUEST,
            );
          }
          throw new HttpException(
            `添加飞书表格数据失败: ${error.response?.data?.msg || '请求参数错误'}`,
            HttpStatus.BAD_REQUEST,
          );
        }
        
        throw new HttpException(
          `添加飞书表格数据失败: ${error.response?.data?.msg || error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      console.error('简历处理失败:', error);
      throw new HttpException(
        error.message || '简历处理失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 建立新数据表
  async createNewTable(userId: number) {
    // 获取用户的bitable信息
    const userBitable = await this.usersService.getBitableInfo(userId);
    console.log(userBitable);

    if (!userBitable) {
      throw new Error('请先配置多维表格信息');
    }

    const newTableId = await this.feishuService.createNewTable(
      userBitable.bitableUrl,
      userBitable.bitableToken,
    );

    // 更新用户的tableId记录
    await this.usersService.updateTableId(userId, newTableId);

    return newTableId;
  }
  //   // 返回的parseResult示例
  //   const parseResult = {
  //     "award_list": [],
  //     "career_list": [
  //         {
  //             "company": "XX科技有限公司",
  //             "end_date": "2021-06-01",
  //             "end_time": "2021-06-01",
  //             "job_description": "运营 App 内的 UGC"话题"功能，每天提出一个学习、教育类话题，搜集素材、撰写引导文案、配图、上线话题、总结 UGC 进行二次传播，最高话题活跃度达到 App 全站流量的 1／5 采编学习类文章、教程等、整合成适合微信公众号发布的内容，并撰写标题和导读，共发表文章 20＋篇，平均阅读量 2w＋，最高阅读达到 6w＋",
  //             "start_date": "2021-02-01",
  //             "start_time": "2021-02-01",
  //             "title": "UGC内容运营实习生",
  //             "type": 1,
  //             "type_str": "实习"
  //         },
  //         {
  //             "company": "XX科技有限公司",
  //             "end_date": "2019-09-01",
  //             "end_time": "2019-09-01",
  //             "job_description": "负责在线教育类 app 专栏的内容撰写、审稿和更新。平均每周撰写 3 篇专栏文章，平均阅读量 2w＋统计用户专栏阅读数据并归纳用户感兴趣的话题，同时根据话题调整写作方向，阅读量成功提升 20％",
  //             "start_date": "2019-06-01",
  //             "start_time": "2019-06-01",
  //             "title": "内容运营实习生",
  //             "type": 1,
  //             "type_str": "实习"
  //         }
  //     ],
  //     "certificate_list": [],
  //     "competition_list": [],
  //     "content": "jMk-YZ14202504121701\n教育经历\t\t\t\t\nXX大学\n传播学\t本科\n2018年09月\t\t-\t2022年06月\n工作经历\t\t\t\t\nXX科技有限公司\nUGC内容运营实习生\n2021年02月\t\t-\t2021年06月\n运营App内的UGC"话题"功能，每天提出一个学习、教育类话题，搜集素材、撰写引导文案、配图、上线话题、总结UGC进行二次传\n播，最高话题活跃度达到App全站流量的1/5\n采编学习类文章、教程等、整合成适合微信公众号发布的内容，并撰写标题和导读，共发表文章20+篇，平均阅读量2w+,最高阅读达到\n6w+\nXX科技有限公司\n内容运营实习生\n2019年06月\t\t-\t2019年09月\n负责在线教育类app专栏的内容撰写、审稿和更新。平均每周撰写3篇专栏文章，平均阅读量2w+\n统计用户专栏阅读数据并归纳用户感兴趣的话题，同时根据话题调整写作方向，阅读量成功提升20%\n项目经历\t\t\t\t\n校园自媒体运营\n负责给校园官方微信公众号撰文，每星期平均贡献3篇图文，平均阅读量3000+\n使学校官方微信号一年内新增粉丝5000+\t，\t增长超过20%；文章平均阅读量提升18%\t，\t阅读完成率提升7%\n传播数据分析\n经授权获得本校公众号的运营数据，通过Google\tAnalytics和微信公众号官方工具分析该校园公众号的运营模式和用户画像\n通过得到的分析报告优化文章的文字、图片等，提升用户阅读完成度约14%\n使用Visual.ly将该报告的数据做可视化处理，在班级中公开展示，评为优秀报告\n工作以外经历\t\t\t\t\n公益社团活动\n负责人\n2018年09月\t\t-\t2018年10月\n作为负责人，协同体育社同事主办校级公益籌款項目，聯系各院系社聯參與活動，同時聯系多家校园自媒体推廣該活動\n在校园内组织地推和宣传，最终参与人数300+，盈利5k+，全部捐贈給公益組織\n其他\t\t\t\t\n技能：\tOffice，内容运营，数据分析，文案写作\n语言：\t英语（CET-6）\n超级简历\n188-8888-8888\t丨success@wondercv.com\n",
  //     "cost": 2.63293051719666,
  //     "country_code": "86",
  //     "current_location": "",
  //     "date_of_birth": "",
  //     "education_list": [
  //         {
  //             "degree": "本科",
  //             "end_date": "2022-06-01",
  //             "end_time": "2022-06-01",
  //             "major": "传播学",
  //             "qualification": 6,
  //             "school": "XX大学",
  //             "start_date": "2018-09-01",
  //             "start_time": "2018-09-01"
  //         }
  //     ],
  //     "email": "success@wondercv.com",
  //     "error_code": 0,
  //     "file_md5": "dcb1e756d3904df195f20050716762b4",
  //     "gender": 0,
  //     "home_location": "",
  //     "language_list": [
  //         {
  //             "description": "英语(cet-6)",
  //             "language": 1,
  //             "level": 2
  //         }
  //     ],
  //     "message": "succ parse",
  //     "mobile": "18888888888",
  //     "mobile_is_virtual": false,
  //     "name": "",
  //     "new_content": "resume.pdf\n\n超级简历\n188-8888-8888  | success@wondercv.com\n教育经历\nxx大学\n2018年09月-2022年06月\n传播学本科\n工作经历\nxx科技有限公司 2021年02月 -2021年06月\nugc内容运营实习生\n运营app内的ugc"话题"功能,每天提出一个学习、教育类话题,搜集素材、撰写引导文案、配图、上线话题、总结ugc进行二次传播,最高话题活跃度达到app全站流量的1/5\n采编学习类文章、教程等、整合成适合微信公众号发布的内容,并撰写标题和导读,共发表文章20+篇,平均阅读量2w+,最高阅读达到\n6w+\nxx科技有限公司 2019年06月-2019年09月\n内容运营实习生\n负责在线教育类app专栏的内容撰写、审稿和更新。平均每周撰写3篇专栏文章,平均阅读量2w+\n统计用户专栏阅读数据并归纳用户感兴趣的话题,同时根据话题调整写作方向,阅读量成功提升20%\n项目经历\n校园自媒体运营\n负责给校园官方微信公众号撰文,每星期平均贡献3篇图文,平均阅读量3000+\n使学校官方微信号一年内新增粉丝5000+,增长超过20%;文章平均阅读量提升18%,阅读完成率提升7%\n传播数据分析\n经授权获得本校公众号的运营数据,通过google analytics和微信公众号官方工具分析该校园公众号的运营模式和用户画像\n通过得到的分析报告优化文章的文字、图片等,提升用户阅读完成度约14%\n使用visual.ly将该报告的数据做可视化处理,在班级中公开展示,评为优秀报告\n工作以外经历\n公益社团活动 2018年09月 -2018年10月\n负责人\n作为负责人,协同体育社同事主办校级公益籌款項目,聯系各院系社聯參與活動,同時聯系多家校园自媒体推廣該活動\n在校园内组织地推和宣传,最終參與數量300+,盈利5k+,全部捐贈給公益組織\n其他\n技能:office,内容运营,数据分析,文案写作\n语言:英语(cet-6)",
  //     "project_list": [
  //         {
  //             "description": "负责给校园官方微信公众号撰文，每星期平均贡献 3 篇图文，平均阅读量 3000＋\n使学校官方微信号一年内新增粉丝 5000＋ ， 增长超过 20％；文章平均阅读量提升 18％， 阅读完成率提升 7％",
  //             "end_date": "",
  //             "end_time": "",
  //             "name": "校园自媒体运营",
  //             "start_date": "",
  //             "start_time": "",
  //             "title": ""
  //         },
  //         {
  //             "description": "经授权获得本校公众号的运营数据，通过 Google Analytics 和微信公众号官方工具分析该校园公众号的运营模式和用户画像通过得到的分析报告优化文章的文字、图片等，提升用户阅读完成度约 14％\n使用 Visual.ly 将该报告的数据做可视化处理，在班级中公开展示，评为优秀报告",
  //             "end_date": "",
  //             "end_time": "",
  //             "name": "传播数据分析",
  //             "start_date": "",
  //             "start_time": "",
  //             "title": ""
  //         }
  //     ],
  //     "self_evaluation": "",
  //     "social_links": [],
  //     "source_id": "",
  //     "url_list": [],
  //     "use_ocr": 0,
  //     "willing_location_list": [],
  //     "willing_position_list": [],
  //     "work_year": 2
  // }
}
