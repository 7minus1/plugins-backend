import {
  Injectable,
  Inject,
  forwardRef,
  ForbiddenException,
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

  async processResume(file: Express.Multer.File, userId: number) {
    // 获取用户信息
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

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
      // 获取用户的bitable信息
      const userBitable = await this.usersService.getBitableInfo(userId);
      if (!userBitable) {
        throw new Error('请先配置多维表格信息');
      }

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

      // 上传文件到飞书多维表格
      const fileToken = await this.feishuService.uploadFile(
        file,
        newFileName,
        appToken,
        bitableToken,
      );
      console.log('fileToken', fileToken);

      // 解析简历
      const parseResult = await this.cozeApi.executeResumeParser(
        fileName,
        fileUrl,
      );

      // 验证解析结果
      if (!parseResult) {
        throw new Error('简历解析失败：未能获取解析结果');
      }

      const parsedResume: ResumeParserDto = {
        name: parseResult.name || '',
        mobile: parseResult.mobile || '',
        gender: parseResult.gender ?? -1,
        email: parseResult.email || '',
        work_year: parseResult.work_year ?? 0,
        home_location: parseResult.home_location || '',
        self_evaluation: parseResult.self_evaluation || '',
        willing_location_list: parseResult.willing_location_list || [],
        willing_position_list: parseResult.willing_position_list || [],
        social_links: parseResult.social_links || [],
        date_of_birth: parseResult.date_of_birth || '',
        current_location: parseResult.current_location || '',
        new_content: parseResult.new_content || '',
        award_list: (parseResult.award_list || []).map((award: any) => ({
          award: award.award || '',
          date: award.date || '',
          description: award.description || '',
        })),
        education_list: (parseResult.education_list || []).map((education: any) => ({
          school: education.school || '',
          major: education.major || '',
          degree: education.degree || '',
          start_date: education.start_date || '',
          end_date: education.end_date || '',
          qualification: education.qualification || '',
        })),
        career_list: (parseResult.career_list || []).map((career: any) => ({
          type_str: career.type_str || '',
          company: career.company || '',
          title: career.title || '',
          start_date: career.start_date || '',
          end_date: career.end_date || '',
          job_description: career.job_description || '',
        })),
        language_list: (parseResult.language_list || []).map((language: any) => ({
          language: language.language || '',
          level: language.level || '',
          description: language.description || '',
        })),
        certificate_list: (parseResult.certificate_list || []).map(
          (certificate: any) => ({
            name: certificate.name || '',
            desc: certificate.desc || '',
          }),
        ),
        competition_list: (parseResult.competition_list || []).map(
          (competition: any) => ({
            name: competition.name || '',
            desc: competition.desc || '',
          }),
        ),
        project_list: (parseResult.project_list || []).map((project: any) => ({
          name: project.name || '',
          title: project.title || '',
          description: project.description || '',
          start_date: project.start_date || '',
          end_date: project.end_date || '',
        })),
      };

      const feishuResponse = await this.feishuService.addBitableRecord(
        appToken,
        tableId,
        bitableToken,
        {
          fields: {
            file_url: [fileToken],
            name: parsedResume.name || '',
            mobile: parsedResume.mobile,
            email: parsedResume.email,
            gender: parsedResume.gender.toString() || '0',
            work_year: parsedResume.work_year?.toString() || '0',
            home_location: parsedResume.home_location,
            self_evaluation: parsedResume.self_evaluation,
            willing_location_list: JSON.stringify(
              parsedResume.willing_location_list,
            ),
            willing_position_list: JSON.stringify(
              parsedResume.willing_position_list,
            ),
            social_links: JSON.stringify(parsedResume.social_links),
            date_of_birth: parsedResume.date_of_birth,
            current_location: parsedResume.current_location,
            new_content: parsedResume.new_content,
            award_list: JSON.stringify(parsedResume.award_list),
            language_list: JSON.stringify(parsedResume.language_list),
            certificate_list: JSON.stringify(parsedResume.certificate_list),
            competition_list: JSON.stringify(parsedResume.competition_list),
            career_list: JSON.stringify(parsedResume.career_list),
            education_list: JSON.stringify(parsedResume.education_list),
            project_list: JSON.stringify(parsedResume.project_list),
          },
        },
      );

      // 只有在整个流程成功完成后，才增加上传次数
      if (!user.isVip) {
        user.uploadCount += 1;
        await this.usersService.update(user.id, user);
      }

      return {
        ...feishuResponse,
        remainingUploads: user.isVip ? '无限' : 5 - user.uploadCount,
      };
    } catch (error) {
      // 如果过程中出现任何错误，直接抛出，不增加上传次数
      throw error;
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
