import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';

type CozeApiConfig = {
  endpoint: string;
  apiKey: string;
  workflowId: string;
};

@Injectable()
export class CozeApiService {
  private readonly config: CozeApiConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.config = {
      endpoint: this.configService.get('COZE_API_ENDPOINT'),
      apiKey: this.configService.get('COZE_API_KEY'),
      workflowId: this.configService.get('COZE_WORKFLOW_ID')
    };
  }

  async executeResumeParser(fileName: string, fileUrl: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          this.config.endpoint,
          {
            parameters: {
              file_name: fileName,
              file_url: fileUrl,
            },
            workflow_id: this.config.workflowId,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        ).pipe(
          catchError(error => {
            throw new HttpException(
              `Coze API请求失败: ${error.response?.data?.message || error.message}`,
              HttpStatus.BAD_REQUEST
            );
          })
        )
      );
      // console.log(data);
      /*
      {
  code: 0,
  cost: '0',
  data: '{"output":{"award_list":[],"career_list":[{"company":"XX科技有限公司","end_date":"2021-06-01","end_time":"2021-06-01","job_description":"运营 App 内的 UGC“话题”功能，每天提出一个学习、教育类话题，搜集素材、撰写引导文案、配图、上 线话题、总结 UGC 进行二次传播，最高话题活跃度达到 App 全站流量的 1／5 采编学习类文章、教程等、整合成适合微信公众号发布 的内容，并撰写标题和导读，共发表文章 20＋篇，平均阅读量 2w＋，最高阅读达到 6w＋","start_date":"2021-02-01","start_time":"2021-02-01","title":"UGC内容运营实习生","type":1,"type_str":"实习"},{"company":"XX科技有限公司","end_date":"2019-09-01","end_time":"2019-09-01","job_description":"负责在线教育类 app 专栏的内容撰写、审稿和更新。平均每周撰写 3 篇专栏文章 ，平均阅读量 2w＋统计用户专栏阅读数据并归纳用户感兴趣的话题，同时根据话题调整写作方向，阅读量成功提升 20％","start_date":"2019-06-01","start_time":"2019-06-01","title":"内容运营实习生","type":1,"type_str":"实习"}],"certificate_list":[],"competition_list":[],"content":"jMk-YZ14202504121701\\n教育经历\\t\\t\\t\\t\\nXX大学\\n传播学\\t本科\\n2018年09月\\t\\t-\\t2022年06月\\n工作经历\\t\\t\\t\\t\\nXX科技有限公司\\nUGC内容运营实习生\\n2021年02月\\t\\t-\\t2021年06月\\n运营App内 的UGC“话题”功能，每天提出一个学习、教育类话题，搜集素材、撰写引导文案、配图、上线话题、总结UGC进行二次传\\n播，最高话题活跃度达到App全站流量的1/5\\n采编学习类文章、教程等、整合成适合微信公众号发布的内容，并撰写标题和导读，共发表文章20+篇 ，平均阅读量2w+，最高阅读达到\\n6w+\\nXX科技有限公司\\n内容运营实习生\\n2019年06月\\t\\t-\\t2019年09月\\n负责在线教育类app专栏的内容撰写、审稿和更新。平均每周撰写3篇专栏文章，平均阅读量2w+\\n统计用户专栏阅读数据并归纳用户感兴趣的话题，同 时根据话题调整写作方向，阅读量成功提升20%\\n项目经历\\t\\t\\t\\t\\n校园自媒体运营\\n负责给校园官方微信公众号撰文，每星 期平均贡献3篇图文，平均阅读量3000+\\n使学校官方微信号一年内新增粉丝5000+\\t，\\t增长超过20%；文章平均阅读量提升18%\\t，\\t阅读完成率提升7%\\n传播数据分析\\n经授权获得本校公众号的运营数据，通过Google\\tAnalytics和微信公众号官方工具分析该校园公众号的运营模式和用户画像\\n通过得到的分析报告优化文章的文字、图片等，提升用户阅读完成度约14%\\n使用Visual.ly将该报 告的数据做可视化处理，在班级中公开展示，被评为优秀报告\\n工作以外经历\\t\\t\\t\\t\\n公益社团活动\\n负责人\\n2018年09月\\t\\t-\\t2018年10月\\n作为负责人，协同体育社同事主办校级公益筹款项目，联系各院系社联参与活动，同时联系多家校园自媒体推 广该活动\\n在校园内组织地推和宣传，最终参与人数300+，盈利5k+，全部捐献给公益组织\\n其他\\t\\t\\t\\t\\n技能：\\tOffice，内容运营，数据分析，文案写作\\n语言：\\t英语（CET-6）\\n超级简历\\n188-8888-8888\\t丨success@wondercv.com\\n","cost":2.66944551467896,"country_code":"86","current_location":"","date_of_birth":"","education_list":[{"degree":"本科","end_date":"2022-06-01","end_time":"2022-06-01","major":"传播学","qualification":6,"school":"XX大学","start_date":"2018-09-01","start_time":"2018-09-01"}],"email":"success@wondercv.com","error_code":0,"file_md5":"262f6bc8f18e480188e9bad20356c3d6","gender":0,"home_location":"","language_list":[{"description":"英语(cet-6)","language":1,"level":2}],"message":"succ parse","mobile":"18888888888","mobile_is_virtual":false,"name":"","new_content":"resume.pdf\\n\\n超级简历\\n188-8888-8888  | success@wondercv.com\\n教育经历\\nxx大学\\n2018年09月-2022年06月\\n传播学本科\\n工作经历\\nxx科技有限公司 2021年02月 -2021年06月\\nugc内容运营实习生\\n运营app内的ugc\\"话题\\"功能,每天提出一个学习、教育类话题,搜集素材、撰写引导文案、配图、上线话题、总结ugc进行二次传播,最高话题活跃度达到app全站流量的1/5\\n采编学习类文章、教程等、整合成适合微信公众号发布的内容,并撰写标题和导读,共发表文章20+篇,平均阅读量2w+,最高阅读达到\\n6w+\\nxx科技有限公司 2019年06月-2019年09月\\n内 容运营实习生\\n负责在线教育类app专栏的内容撰写、审稿和更新。平均每周撰写3篇专栏文章,平均阅读量2w+\\n统计用户专栏阅读数 据并归纳用户感兴趣的话题,同时根据话题调整写作方向,阅读量成功提升20%\\n项目经历\\n校园自媒体运营\\n负责给校园官方微信公 众号撰文,每星期平均贡献3篇图文,平均阅读量3000+\\n使学校官方微信号一年内新增粉丝5000+,增长超过20%;文章平均阅读量提升18%,阅读完成率提升7%\\n传播数据分析\\n经授权获得本校公众号的运营数据,通过google analytics和微信公众号官方工具分析该校园公众号的运营模式和用户画像\\n通过得到的分析报告优化文章的文字、图片等,提升用户阅读完成度约14%\\n使用visual.ly将该报告的数据做可视化处理,在班级中公开展示,被评为优秀报告\\n工作以外经历\\n公益社团活动 2018年09月 -2018年10月\\n负责人\\n作为负责人,协同体育社同事主办校级公益筹款项目,联系各院系社联参与活动,同时联系多家校园自媒体推广该活动\\n在校园内组织地推和宣传,最终参与人数300+,盈利5k+,全部捐献给公益组织\\n其他\\n技能:office,内容运营,数据分析,文案写作\\n语言:英语(cet-6)","project_list":[{"description":"负责给校园官方微信公众号撰文，每星期平均贡献 3 篇图文，平均阅读量 3000＋\\n使学校官方微信号一年 内新增粉丝 5000＋ ， 增长超过 20％；文章平均阅读量提升 18％， 阅读完成率提升 7％","end_date":"","end_time":"","name":" 校园自媒体运营","start_date":"","start_time":"","title":""},{"description":"经授权获得本校公众号的运营数据，通过 Google Analytics 和微信公众号官方工具分析该校园公众号的运营模式和用户画像通过得到的分析报告优化文章的文字、图片等，提升用户阅读完成度约 14％\\n使用 Visual.ly 将该报告的数据做可视化处理，在班级中公开展示，被评为优秀报告","end_date":"","end_time":"","name":"传播数据分析","start_date":"","start_time":"","title":""}],"self_evaluation":"","social_links":[],"source_id":"","url_list":[],"use_ocr":0,"willing_location_list":[],"willing_position_list":[],"work_year":2}}',
  debug_url: 'https://www.coze.cn/work_flow?execute_id=7492361551715647527&space_id=7444005295271165971&workflow_id=7492307996975333387&execute_mode=2',
  msg: 'Success',
  token: 0
  }
      */
      return this.parseResponse(data);
    } catch (error) {
      throw new HttpException(
        `简历解析失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private parseResponse(response: any) {
    // response.data是一个字符串，需要解析为JSON对象
    const data = JSON.parse(response.data);
    return data.output;
  }
}