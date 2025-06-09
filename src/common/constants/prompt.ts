export const KIMI_SYSTEM_PROMPT = '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。';

export const RESUME_PARSE_PROMPT = `简历文件的内容是正确的，但文件末尾：其他 xx 牛人以下的内容不用输出。
请严格按此 JSON 结构化输出：

{
  // 基本信息
  "basic_info": {
    "name": "姓名",
    "gender_inf": "性别推断",
    "age_inf": "年龄推断",
    "height": "身高",
    "weight": "体重",
    "marital_status": "婚姻状况",
    "birthday": "出生日期",
    "hukou_address": "户口地址",
    "hometown_address": "籍贯地址",
    "race": "民族",
    "nationality": "国籍",
    "polit_status": "政治面貌",
    "star_sign": "星座",
    "languages": "语言能力",
    "english_level": "英语水平",
    "computer_level": "计算机水平",
    "blog": "个人博客",
    "apply_job": "应聘职位",
    "apply_cpy": "应聘公司",
    "work_year": "工作年限",
    "work_year_inf": "工作年限推断",
    "work_start_time_inf": "参加工作时间推断",
    "work_position": "当前职位",
    "work_pos_type_p": "职位类型",
    "work_company": "当前公司",
    "work_industry": "所在行业",
    "work_status": "工作状态",
    "work_location": "工作地点",
    "work_job_nature": "工作性质",
    "has_oversea_edu": "是否有海外教育经历",
    "has_oversea_exp": "是否有海外工作经历",
    "grad_time": "毕业时间",
    "college": "毕业院校",
    "school_name" : "学校名称",
    "college_type": "院校类型",
    "college_rank": "院校排名",
    "college_rank_qs": "QS世界排名",
    "college_dept": "院系",
    "major": "专业",
    "degree": "学历/学位",
    "self_evaluation": "自我评价",
    "hobbies": ["兴趣爱好1", "兴趣爱好2"]
  },

  // 联系方式
  "contact_info": {
    "email": "电子邮箱",
    "phone": "手机号码",
    "virtual_phone": "虚拟号码",
    "qq": "QQ号码",
    "weixin": "微信号",
    "city": "所在城市",
    "living_address": "居住地址"
  },

  // 求职意向
  "expect_job": {
    "expect_job": "期望职位",
    "expect_cpy": "期望公司",
    "expect_salary": "期望薪资",
    "expect_industry": "期望行业",
    "expect_time": "到岗时间",
    "expect_jnature": "期望工作性质",
    "expect_jstatus": "求职状态",
    "expect_jlocation": "期望工作地点",
    "expect_benefits": ["期望福利1", "期望福利2"]
  },

  // 简历来源
  "resume_info": {
    "resume_source": "简历来源"
  },

  // 技能标签（新增）
  "skills": ["技能1", "技能2", "技能3"],

  // 奖项荣誉（新增）
  "award_objs": [
    {
      "award_name": "奖项名称",
      "award_date": "获奖日期",
      "award_desc": "奖项描述"
    }
  ],

  // 工作经历
  "job_exp_objs": [
    {
      "start_date": "开始时间",
      "end_date": "结束时间",
      "job_cpy": "公司名称",
      "job_cpy_nature": "公司性质",
      "job_cpy_size": "公司规模",
      "job_cpy_desc": "公司描述",
      "job_industry": "所属行业",
      "job_position": "职位名称",
      "job_pos_type": "职位类型",
      "job_dept": "所在部门",
      "job_nature": "工作性质",
      "job_salary": "薪资待遇",
      "job_staff": "下属人数",
      "job_report_to": "汇报对象",
      "job_location": "工作地点",
      "job_why_leave": "离职原因",
      "job_duration": "任职时长",
      "job_capacity": "工作能力",
      "job_content": "工作内容"
    }
  ],

  // 社会实践
  "social_exp_objs": [
    {
      "start_date": "开始时间",
      "end_date": "结束时间",
      "job_cpy": "组织名称",
      "job_cpy_nature": "组织性质",
      "job_cpy_size": "组织规模",
      "job_cpy_desc": "组织描述",
      "job_industry": "所属行业",
      "job_position": "职位名称",
      "job_dept": "所在部门",
      "job_nature": "工作性质",
      "job_salary": "薪资待遇",
      "job_staff": "团队人数",
      "job_report_to": "汇报对象",
      "job_location": "工作地点",
      "job_why_leave": "离开原因",
      "job_duration": "实践时长",
      "job_capacity": "实践能力",
      "job_content": "实践内容"
    }
  ],

  // 项目经历
  "proj_exp_objs": [
    {
      "start_date": "开始时间",
      "end_date": "结束时间",
      "proj_name": "项目名称",
      "proj_cpy": "所属公司",
      "proj_position": "项目角色",
      "proj_content": "项目内容",
      "proj_resp": "项目职责"
    }
  ],

  // 培训经历
  "training_objs": [
    {
      "start_date": "开始时间",
      "end_date": "结束时间",
      "train_org": "培训机构",
      "train_loc": "培训地点",
      "train_name": "培训名称",
      "train_cert": "获得证书",
      "train_cont": "培训内容"
    }
  ],

  // 语言能力
  "lang_objs": [
    {
      "language_name": "语言名称",
      "language_level": "掌握水平",
      "language_read_write": "读写能力",
      "language_listen_speak": "听说能力"
    }
  ],

  // 证书
  "all_cert_objs": [
    {
      "cert_name": "证书名称",
      "cert_type": "证书类型"
    }
  ]
}


## 解析规则：
1.字段映射规则，
- 简历中的“姓名”映射到 JSON 中的 basic_info.name。
- 简历中的“性别”映射到 JSON 中的 basic_info.gender。
- 简历中的“出生日期”映射到 JSON 中的 basic_info.birthday。
2. 日期格式规则
- 所有日期字段（如 start_date 和 end_date）应使用 YYYY-MM-DD 格式。
- 如果日期不完整（如只有年份），则使用 YYYY-01-01 作为默认日期。
3. 数值转换规则
- 将 work_salary 字段中的数值去除单位（如“元/月”）并转换为整数。
- 将 age 字段转换为整数。
4.地址标准化规则
- 使用地理编码服务将 living_address 和 hukou_address 标准化为“国家-省-市-区”格式。
5.语言和技能等级规则
- 将语言等级（如“熟练”）转换为标准化的英文描述（如“proficient”）。
- 将技能等级（如“精通”）转换为标准化的英文描述（如“expert”）。
6. 空值处理规则
- 对于缺失的字段请直接删除，不要猜测或推断。
7.多值字段规则
- 对于 languages 和 skills 等多值字段，使用数组格式。例如，languages 字段应为 ["英语", "日语"]。
8.文本清理规则
- 确保文本字段的内容整洁且易于阅读。
9.数据验证规则
- 验证 work_year 是否为合理的数值（如大于 0 且小于 50）。
- 验证 email 字段是否符合电子邮件格式。
---
请直接输出JSON结构化信息，不要添加解释性内容。`

export function getResumeEvalPrompt(positionProfile: string, positionInfo: string, resumeContent: string) {
  const prompt = `
基于职位JD和候选人简历，利用AI智能分析，生成全面客观的人岗匹配报告，提高招聘筛选效率与准确性。

## 输入要求
- **职位画像**： ${positionProfile}
- **职位JD**： ${positionInfo}
- **候选人简历**： ${resumeContent}

系统将自动从JD中提取以下三类关键信息，构建职位画像：

必备项：岗位所必需的资质、能力和经验
加分项：能提升候选人竞争力的额外能力或经验
排除项：不符合要求的明确条件

分析流程

JD解析：提取岗位核心要求和关键技能
简历解析：识别候选人资质、经验和能力
智能画像匹配：将职位画像与候选人画像进行多维度匹配
匹配度计算：基于必备项、加分项、排除项计算综合匹配得分
生成评估报告：提供详细的匹配分析和招聘建议

评估维度（自动根据岗位调整权重）

专业能力：岗位核心专业技能和知识
行业经验：相关行业背景和经验深度
项目经历：项目规模、复杂度和相关性
管理能力：团队管理、项目管理经验
技术工具：相关工具和技术掌握程度
沟通协作：跨部门协作和沟通能力
学习成长：学习能力和职业发展轨迹
基础匹配：学历、工作年限等基本要求

匹配度评估规则

强烈推荐 (≥85%)： 核心要求全部满足，无明显短板
推荐 (70-84%)：核心要求基本满足，差距可接受
待定 (60-69%)：部分满足要求，有待进一步确认
不推荐 (<60%)：与岗位需求差距明显

输出格式
AI人才匹配报告
一、概述
1、匹配程度：满分100%
2、合适的地方，20字以内
3、不合适的地方，20字以内
4、存疑的地方，20字以内
二、候选人概览
基本信息
👤 姓名：{姓名}
📊 最终匹配度：
🎓 学历背景：{最高学历} | {毕业院校} | {专业}
📅 工作经验：{总工作年限}
💼 应聘职位：{职位名称}
🔍 核心评价：{简明核心评价，30字内}

亮点标签
{自动生成3-5个候选人亮点标签，如"中级专业资质"、"产品功能设计"等}
三、匹配度评估
最终匹配度：{得分}% 
{匹配度概述，包含优势和不足，50-80字}
评估维度（各维度权重根据岗位自动调整）

{维度1}：{得分}% | {权重}%

{简要评估内容，基于简历事实}
{优势或不足分析}


{维度2}：{得分}% | {权重}%

{简要评估内容，基于简历事实}
{优势或不足分析}



...（根据岗位特点显示相关维度）
四、深度分析
核心优势（3项）

{优势1具体说明}
{优势2具体说明}
{优势3具体说明}

待验证事项（2-3项）

{待验证事项1}：{具体说明}
{待验证事项2}：{具体说明}
{待验证事项3}：{具体说明}

期望考察点（2-3项）
{期望考察点1}：{具体说明}
{期望考察点2}：{具体说明}
{期望考察点3}：{具体说明}
  `
  return prompt;
}

export const POSITION_INFO = `职位名称：【外企-WLB】AI产品经理（C端）
薪资范围：25-40k 14薪
工作区域：北京市海淀区
工作经验：一年以上互联网移动应用工作经验
学历要求：计算机科学或相关工程学科本科及以上学历
职位描述：Job Responsibilities:
1. Responsible for demand analysis and product prototype output of AI products, writing product requirement documents, and preparing project-related documentation.
2. Follow up on all processes of AI product UI design, product development, acceptance testing, and launch promotion, coordinating and communicating requirements during the process to ensure the project goes live on schedule.
3. Address issues exposed during the development and acceptance process of the project, collaborating with developers for continuous optimization and modification.
4. Organize and analyze product iteration requirements, complete product planning and continuous improvement.
5. Track product data, perform data analysis, pay attention to feedback from business departments and users, extract user needs, and guide product design.
职位要求：Job Requirements:
1. Bachelor's degree or above in computer science or related engineering disciplines; more than one year of work experience in internet mobile applications.
2. Strong comprehension, logical analysis, and verbal communication skills, able to clearly articulate requirements.
3. Familiar with the overall production process of internet mobile products, having participated in the completion of projects from 0 to 1, including demand analysis, product design, technical development, and testing acceptance; capable of independently leading and completing product output.
4. Passionate about the AI industry, keeping up with the latest trends and technical developments in the industry, and continuously learning and improving professional knowledge and skills.
加分项：无`

export const POSITION_PROFILE = `### **【职位画像分析】AI产品经理（C端）**

---

#### **一、硬性条件画像**
1. **学历背景**  
   - **核心要求**：计算机科学或相关工程类专业本科及以上学历。  
   - **考察点**：技术理解能力、与开发团队的高效沟通基础。

2. **工作经验**  
   - **核心要求**：1年以上互联网移动应用产品经验，参与过从0到1的全流程项目。  
   - **关键门槛**：需提供完整项目案例（需求分析→设计→开发→上线），证明独立输出能力。

3. **技能要求**  
   - **工具能力**：熟练输出产品原型（Axure/Figma等）、PRD文档、数据分析工具（SQL/Tableau）。  
   - **技术认知**：了解AI技术基础（如自然语言处理、生成式AI），能与技术团队对齐需求。

---

#### **二、软性素质画像**
1. **逻辑分析能力**  
   - **考察点**：能否快速拆解复杂需求（如用户模糊需求→结构化功能模块），输出清晰的流程图或逻辑文档。

2. **沟通协调能力**  
   - **核心场景**：跨部门协作（UI设计、开发、测试）、推动项目按时上线，需展现冲突解决案例（如资源不足时优先级协调）。

3. **产品思维与用户洞察**  
   - **关键指标**：数据敏感度（如通过用户行为数据优化功能迭代）、需求优先级判断（MVP设计能力）。

4. **学习与适应能力**  
   - **行业特性**：AI技术更新快（如大模型演进），需持续跟踪行业动态（如AIGC应用场景创新）。

---

#### **三、行业/岗位偏好**
1. **AI领域经验优先**  
   - **加分项**：参与过AI类C端产品（如智能助手、AI生成工具），熟悉生成式AI技术应用（如ChatGPT、Midjourney）。

2. **技术背景偏好**  
   - **隐性需求**：有开发经验或技术背景的候选人（如曾参与算法优化）更易获得信任。

3. **创业型人才特质**  
   - **岗位特性**：从0到1项目经验要求，需具备快速试错、抗压能力，适应外企扁平化协作模式。

---

#### **四、潜在加分项**
1. **技术落地案例**  
   - 例如：主导过AI模型与产品的结合（如推荐算法优化、语音交互设计）。

2. **行业认知深度**  
   - 对AI伦理、数据隐私等合规问题的理解，或参与过AI行业峰会/技术社区。

3. **跨文化协作经验**  
   - 外企背景或英语沟通能力（可能涉及全球团队协作）。

---

#### **五、考察重点与面试设计建议**
1. **需求分析能力验证**  
   - **面试问题**：  
     “请举例说明如何从用户反馈中挖掘出未被明确提出的需求，并转化为产品方案？”

2. **项目管理能力验证**  
   - **模拟场景**：  
     “若开发进度因技术瓶颈延迟，如何调整方案保证核心功能上线？”

3. **AI行业认知验证**  
   - **开放问题**：  
     “你认为未来6个月内，生成式AI在C端产品的突破点可能在哪里？”

---

#### **六、风险规避建议**
1. **警惕“伪经验”候选人**  
   - 关注项目细节：要求提供原型文档/PRD片段，验证实际参与深度。

2. **技术背景理解需务实**  
   - 避免过度强调“计算机专业”：可通过技术方案讨论（如API接口设计）检验实际能力。

3. **评估AI热情真实性**  
   - 观察候选人是否主动提及行业动态（如近期Stable Diffusion 3发布的影响）。

---

### **总结**  
该岗位画像需围绕“技术型产品经理+AI落地能力+创业精神”展开，重点考察候选人能否在快速迭代的AI领域平衡用户需求与技术可行性，同时适应外企协作文化。招聘过程中需通过项目复盘、场景模拟、技术讨论等多维度验证匹配度。`

export function getResumeMatchPrompt(companyName: string, positionName: string, positionInfo: string, resumeContent: string) {
  const prompt = `#你曾经是${companyName} ${positionName}该岗位的资深专家，面试委员会成员，具备丰富的职位任职经验，并且同时兼任过招聘面试经验丰富的HR专家。现在你的目标是要竭尽全力帮助求职者进行筛选职位，针对这个岗位判断求职者的简历是否能够通过目标公司的 AI 招聘工具、面试官和HR的简历筛选，进入面试、拿到 offer。

基于职位描述和简历，利用AI智能分析，生成全面客观的职位匹配报告和匹配度，提高求职者的职位筛选和投递效率

输入要求
- 职位描述：${positionInfo}
- 求职者简历： {### 基本信息
- 姓名：张天天
- 年龄：28
- 学历：本科
- 工作年限：6 年
- 求职状态：在职
- 手机号：13912345678
- 邮箱：tinatian840910080@qq.com
- 微信号：未提供

### 教育经历
- 学校名称：南京大学
- 学历：本科
- 时间段：2014.09 - 2018.06
- 在校经历：计算机科学与技术专业

### 获奖证书
CET6、PMP、全国计算机等级二级

### 个人优势
1. AIGC 产品设计专家，成功主导千万级下载量 AIGC 产品，进入 AI 产品全球增速榜 Top 2、出海总榜 Top 10。
2. 数据驱动与商业化，实现季度内 IAP 收入增长 150%，订阅转化率 3%以上。
3. 深刻理解技术逻辑，熟悉 Stable Diffusion 等 AI 模型，推动 AI 模型创新落地。
4. 跨团队协作与高效交付，协调算法、开发、设计等团队，推动复杂项目高质量交付。
5. 全球市场拓展，推动产品全球用户规模突破 900 万+。
6. 熟练使用 Axure、Xmind 等产品生产力工具，具备英语听说读写能力。

### 工作经历
#### 爱画科技 - AI 产品经理（2018.07 - 2025.05）
##### 工作内容
1. **核心业务突破**：主导生图类&视频类 AIGC 产品从 0 到 1 开发，完成用户调研、需求定义及全流程管理，推动 AI 绘画平台 6 个月内实现 70 万用户增长，微信小程序 DAU 突破 2 万。
2. **数据驱动迭代**：搭建数据分析体系，基于用户反馈优化功能设计，图片保存率从 13%提升至 28%，人均生成次数增长 88%（1.7→3.2）。
3. **商业化闭环构建**：设计会员订阅与内购功能策略，付费用户增长 3 倍，月流水突破 70 万美元，订阅转化率达行业领先水平（3.1%）。
4. **AI 技术攻坚**：联合算法团队优化模型训练流程，上线 50 + 风格模型，生成效率提升 40%，支持 5 秒内简笔画生成。

##### 工作业绩
- **用户增长**：主导产品用户规模突破 600 万（AI 视频工具），DAU 峰值 15 万，生成内容超 800 万次（图像 + 视频）。
- **商业价值**：制定多元变现策略，累计贡献超 840 万美元年流水，核心功能（如 AI Hug）内购收入占比 37%。
- **技术突破**：推动生成速度从 5 分钟缩短至 2 分钟，上线 200 + 动态模板，产品位列 2024 全球 AI 增速榜 Top2。
- **体验优化**：关键指标显著提升，视频保存率从 15%→35%，用户满意度达行业 Top10%。

##### 工作技能
- Axure
- Xmind
- Visio
- 墨刀
- 数据分析
- AI 模型训练（LoRA）
- 商业化策略
- 跨团队协作
- 英语听说读写

### 项目经历
#### 项目 1：AI 动态化视频创作工具项目（2022.11 - 2025.05）
##### 项目描述
- MVP 产品设计：主导用户调研与需求定义，发现普通用户对“一键生成动态内容”的强需求，完成功能原型设计与 PRD 撰写，优化交互流程。
- 跨团队协作：协调设计、开发、运营、算法团队，确保按时上线并实现高质量交付。
- 数据驱动增长：通过埋点分析发现“音频驱动面部动画”功能渗透率低，优化入口曝光并增加新手引导，3 个月内渗透率提升至 27%，用户次日留存率提高至 22%。
- AI 模型迭代：配合算法团队准备训练集与测试集，针对舞蹈视频生成场景优化动作库匹配算法，使生成速度从 5 分钟缩短至 2 分钟，并新增 60 + 热门舞蹈模板。

##### 项目业绩
- 用户增长：上线 6 个月全球用户突破 600 万，Google Play 摄影类应用 Top 10，TikTok 相关话题播放量超 2 亿次。
- 商业化突破：订阅转化率达 3.1%，月流水突破 70 万美元，其中“AI 拥抱&AI 亲吻”功能内购贡献 37%收入。
- 产品体验优化：视频保存率从 15%提升至 35%，用户平均生成次数从 2.2 次增至 4.5 次，DAU 峰值达 15 万。
- AI 竞争力：累计上线 200 + 动态模板，差异化功能（如 AI Hug、AI Kiss）渗透率超 60%。产品荣登 2024 年 AI 产品全球增速榜 Top2、2025 年 AI 产品出海总榜 Top10。

#### 项目 2：AI 绘画创意平台（2022.11 - 2025.05）
##### 项目描述
- 需求分析：通过用户调研与数据分析，明确生成图像质量、多样性等核心需求，制定产品迭代路线。
- 产品设计：主导 AI 生成模块产品设计，优化 Prompt 界面、风格选择与编辑器功能。
- 算法优化：转化用户反馈为算法优化需求，推动新模型上线，提高生成效果和效率。
- 商业化策划：设计订阅模式与付费功能（高分辨率输出、专业模板），提升转化率与用户 ARPU 值。
- AI 风格模型与训练：定义艺术风格模型方向，搭建 LoRA 训练流程，提高风格生成的多样性和稳定性。

##### 项目业绩
- 市场表现：上线 6 个月用户超 70 万，微信小程序 DAU 突破 2 万，生成图像超过 200 万张。
- 技术突破：上线 50 + 风格模型，支持 5 秒内完成简笔画生成，生成效率提升 40%，用户创作丰富度大幅提升。
- 收入与商业化：制定多元转化策略，订阅转化率显著提升，付费用户增长 3 倍。
- 产品体验优化：图片保存率从 13%提升至 28%，人均生成次数从 1.7 提升至 3.2，用户满意度大幅提升。}

系统将自动职位描述中提取以下三类关键信息，构建职位画像：
必备项：岗位所必需的资质、能力和经验
加分项：能提升求职者竞争力的额外能力或经验
排除项：求职者不符合要求的明确条件
分析流程
JD解析：提取岗位核心要求和关键技能
简历解析：识别求职者资质、经验和能力
智能画像匹配：将职位画像与求职者画像进行多维度匹配

匹配度计算：基于必备项、加分项、排除项计算综合匹配得分
生成评估报告：提供详细的匹配分析和求职建议
评估维度（自动根据岗位调整权重）
专业能力：岗位核心专业技能和知识
行业经验：相关行业背景和经验深度
项目经历：项目规模、复杂度和相关性
管理能力：团队管理、项目管理经验
技术工具：相关工具和技术掌握程度
沟通协作：跨部门协作和沟通能力
学习成长：学习能力和职业发展轨迹
基础匹配：学历、工作年限等基本要求
匹配度评估规则
强烈推荐 (≥85%)： 核心要求全部满足，无明显短板
推荐 (70-84%)：核心要求基本满足，差距可接受
待定 (60-69%)：部分满足要求，有待进一步确认
不推荐 (<60%)：与岗位需求差距明显

输出格式：
AI职位匹配报告
一、职位概览
基本信息
👤 职位：{职位名称}
📊 最终匹配度：
推荐等级：
🎓 公司：{公司名称} 
📅 公司信息：{公司业务概述}
🔍 职位核心评价：{简明核心评价，30字内}
亮点标签
{自动生成3-5个职位亮点标签}
二、匹配度评估
最终匹配度：{得分}% 
{匹配度概述，包含优势和不足，50-80字}
评估维度（各维度权重根据岗位自动调整）
{维度1}：{得分}% | {权重}%
{简要评估内容，基于职位事实}
{优势或不足分析}
{维度2}：{得分}% | {权重}%
{简要评估内容，基于职位事实}
{优势或不足分析}
...（根据岗位特点显示相关维度）
三、深度分析
职位核心优势（3项）
{优势1具体说明}
{优势2具体说明}
{优势3具体说明}
求职者待提升事项（2-3项）
{待提升事项1}：{具体说明}
预计考察求职者的点（2-3项）
{预计考察点1}：{具体说明}
  `
  return prompt;
}

export const POSITION_DESCRIPTION = `
1、负责Bambu Lab官方商城和生态社区的功能迭代和产品设计，深入理解购买动机及路径，优化产品体验，为业务结果负责； 2、根据公司战略和行业发展趋势分析，设计产品原型，撰写需求文档，不断改进产品； 3、跨部门沟通团队协作，共同达到项目目标，高质量推进相关团队工作。 职位要求： 1、3年以上互联网产品相关工作经验； 2、极强的逻辑思维能力和数据分析能力，具备优秀的沟通表达能力； 3、拥有创新思维，不拘泥于行业已有经验；具备系统化思考问题的习惯，能从全局最优出发； 4、解决问题注重过程和结果，关注细节，抗压能力强； 5、有国际化产品或内容型产品等相关经验者优先。
`
