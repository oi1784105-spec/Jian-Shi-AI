// 演示模式的静态内容与内容生成器。
//
// 这里的所有内容都在浏览器本地生成，不会发起任何真实网络请求，
// 也不会调用任何模型接口。它的作用只有一个：让访客打开 GitHub Pages
// 上的在线版时，能够完整走通「注册 → 配置 Provider → 上传简历 → 面试 → 报告」
// 的全流程，并看到与真实产品一致的交互反馈（流式输出、进度条、状态轮询）。

/** 演示账号：登录页会预填这组信息，但演示模式下任意非空账号均可登录。 */
export const DEMO_ACCOUNT = {
  email: 'demo@jianshi.ai',
  password: 'jianshi2026'
}

/** Provider 协议预设，字段名与 ApiSettings.vue 的用法保持一致。 */
export const PROVIDER_PRESETS = [
  {
    key: 'deepseek',
    label: 'DeepSeek',
    protocol: 'openai-compatible',
    website_url: 'https://platform.deepseek.com',
    default_base_url: 'https://api.deepseek.com/v1',
    default_models: ['deepseek-chat', 'deepseek-reasoner']
  },
  {
    key: 'openai',
    label: 'OpenAI',
    protocol: 'openai',
    website_url: 'https://platform.openai.com',
    default_base_url: 'https://api.openai.com/v1',
    default_models: ['gpt-4o-mini', 'gpt-4o']
  },
  {
    key: 'anthropic',
    label: 'Anthropic',
    protocol: 'anthropic',
    website_url: 'https://console.anthropic.com',
    default_base_url: 'https://api.anthropic.com',
    default_models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest']
  },
  {
    key: 'gemini',
    label: 'Google Gemini',
    protocol: 'gemini',
    website_url: 'https://aistudio.google.com',
    default_base_url: 'https://generativelanguage.googleapis.com',
    default_models: ['gemini-2.0-flash', 'gemini-2.0-pro']
  },
  {
    key: 'custom',
    label: 'OpenAI Compatible',
    protocol: 'openai-compatible',
    website_url: '',
    default_base_url: '',
    default_models: []
  }
]

/** 演示模式下预置的 Provider，默认已启用，避免访客被路由守卫拦到配置页。 */
export const SEED_PROVIDER = {
  id: 1,
  identifier: 'demo-deepseek',
  provider: 'deepseek',
  name: '演示 · DeepSeek',
  note: '演示模式预置配置，不会发起真实模型请求',
  website_url: 'https://platform.deepseek.com',
  base_url: 'https://api.deepseek.com/v1',
  api_key_masked: 'sk-••••••••demo',
  models: ['deepseek-chat', 'deepseek-reasoner'],
  default_model: 'deepseek-chat',
  api_version: '',
  is_active: true,
  is_validated: true
}

/** 演示用户的个人资料，字段与 Profile.vue 读取的字段一一对应。 */
export const SEED_PROFILE = {
  id: 1,
  email: DEMO_ACCOUNT.email,
  first_name: '明',
  last_name: '陈',
  avatar: '',
  gender: 'male',
  phone: '13800000000',
  university: '演示大学 · 计算机科学与技术',
  career_goal: 'AI Agent 开发工程师',
  location: '上海'
}

/** 「简历解析」这一步的模拟结果，字段与 ResumeUpload.vue 的读取路径一致。 */
export const DEMO_RESUME_RESULT = {
  parsed_content: {
    name: '陈明',
    education: '本科 · 计算机科学与技术 · 2026 届',
    skills: [
      'Python', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'Redis',
      'Celery', 'Docker', 'Vue 3', 'LangChain', 'SSE'
    ],
    summary:
      '具备完整 AI 应用后端开发经验，独立完成过基于大模型的多轮对话系统，' +
      '熟悉异步 Web 框架、关系型数据库与容器化部署，能承担从接口设计到上线运维的全链路工作。'
  },
  analysis: {
    overall_score: 8.1,
    summary:
      '简历与目标岗位的整体匹配度较高：后端技术栈完整，具备 AI 应用落地经验；' +
      '建议补充可量化的性能指标与系统设计层面的描述，让成果更有说服力。',
    keyword_match: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', '异步任务'],
    missing_keywords: ['Kubernetes', '可观测性', '单元测试覆盖率', '高并发压测'],
    strengths: [
      '技术栈与岗位要求高度重合，异步 Web 与数据库能力完整',
      '有大模型应用的真实落地经验，能覆盖 Prompt 工程到流式响应',
      '具备容器化与部署经验，工程习惯贴近生产环境'
    ],
    weaknesses: [
      '项目描述偏功能罗列，缺少性能与稳定性方面的量化结果',
      '缺少分布式与高并发场景下的取舍说明',
      '测试与质量保障方面的经历描述较少'
    ],
    suggestions: [
      '为每个项目补充 1—2 个可量化指标，例如响应时间、并发量或成本下降比例',
      '补充一次系统设计取舍的完整叙述，体现判断依据而非结论',
      '在简历中体现单元测试、CI 流程或压测经验，会明显提升可信度'
    ]
  }
}

/** 技术关键词：用于给演示回答打分，让「回答越具体、得分越高」这件事可被感知。 */
const TECH_KEYWORDS = [
  '索引', '缓存', '事务', '并发', '异步', '队列', '锁', '幂等', '一致性', '限流',
  '熔断', '降级', '监控', '压测', '分库分表', '连接池', '线程', '协程', '内存', 'GC',
  '微服务', '性能优化', '单元测试', '灰度', '容灾', 'Redis', 'Kafka', 'MySQL',
  'PostgreSQL', 'Docker', 'Kubernetes', 'Linux', 'JWT', 'SSE', 'WebSocket',
  'REST', 'API', 'LangChain', 'RAG', 'Embedding', '向量', 'Prompt', 'Agent',
  'Function Calling', 'SQL', 'FastAPI', 'Celery', 'Vue'
]

const ROLE_BANKS = [
  {
    match: ['前端', 'front', 'web', 'vue', 'react'],
    questions: [
      '请先用两分钟介绍一下你最近负责的一个前端项目，以及你在其中承担的部分。',
      '页面首次加载偏慢时，你会按什么顺序定位和排查问题？',
      '你如何设计一个需要频繁交互、状态较多的复杂组件？',
      '说说你对前端跨域与同源策略的理解，实际项目里是怎么处理的？',
      '你如何保证前端代码的可维护性？举例说明你的工程实践。',
      '如果要做一个大列表的虚拟滚动，你会怎么实现？',
      '前端如何做性能监控与异常上报？',
      '如果让你从零搭建一个团队的前端规范，你会包含哪些内容？'
    ]
  },
  {
    match: ['算法', '数据', '机器学习', 'ml', '推荐', 'analyst'],
    questions: [
      '介绍一下你做过的一个数据分析或建模项目，数据规模和你的具体角色是什么？',
      '面对一份缺失值较多的数据集，你会如何制定清洗策略？',
      '如何判断一个模型在业务上是否真的有效？你会看哪些指标？',
      '解释一下过拟合，以及你在实践中用过哪些应对方法。',
      '如果离线指标很好但线上效果不达标，你会从哪里开始排查？',
      '你如何设计一个可复用的特征工程流程？',
      '说说你对 A/B 实验设计与统计显著性的理解。',
      '如果要你把一个模型部署成线上服务，你会怎么设计整个链路？'
    ]
  },
  {
    match: ['ai', 'agent', '大模型', 'llm', '算法工程师', 'nlp'],
    questions: [
      '介绍一下你做过的大模型应用，它解决了什么真实问题？',
      '在多轮对话系统里，你是如何管理上下文长度的？',
      'RAG 的召回效果不理想时，你会从哪些环节排查？',
      '你如何评估一次 Prompt 改动的效果是变好还是变差？',
      '讲一下 Function Calling 或工具调用在你的项目里是如何落地的。',
      '流式输出（SSE）相比一次性返回，工程上带来了哪些额外复杂度？',
      '如果模型输出格式不稳定，你会怎么保证下游能安全解析？',
      '你会如何控制大模型应用的成本？请给出具体手段。'
    ]
  },
  {
    match: ['后端', 'backend', 'java', 'go', 'python', '服务端', '运维', 'sre'],
    questions: [
      '介绍一下你最近负责的一个后端项目，整体架构和你的职责是什么？',
      '数据库查询变慢时，你的排查步骤是什么？',
      '你如何设计一个需要保证幂等的接口？',
      '谈谈你对缓存穿透、击穿和雪崩的理解，以及各自的应对方式。',
      '一次线上接口响应时间突然翻倍，你会怎么定位问题？',
      '你是如何做数据库事务边界划分的？',
      '说说你做过的一次性能优化，优化前后的指标变化是多少？',
      '如果让你设计一个任务排队与重试机制，你会考虑哪些点？'
    ]
  }
]

const DIFFICULTY_PROBES = {
  easy: ['可以从基础概念讲起。', '先说说你的整体理解。'],
  medium: ['请结合具体项目说明。', '希望能听到实现层面的细节。'],
  hard: ['如果数据量增长到十倍，你的方案还成立吗？', '请说明关键技术取舍和理由。']
}

const GREETINGS = [
  '你好，我是本次面试的 AI 面试官。我会根据你的简历和目标岗位提问，每题回答后我会给出即时点评。我们开始吧。',
  '你好，欢迎参加本次模拟面试。接下来的问题会围绕你的简历展开，回答时尽量结合具体项目，这样点评会更有针对性。'
]

const REPORT_HIRE_RECOMMENDATIONS = [
  '建议进入下一轮 · 技术基础扎实，工程表述清晰，可进一步考察系统设计深度。',
  '建议进入下一轮 · 项目经验与岗位匹配度高，回答有条理，注意补充量化结果。',
  '可继续观察 · 基础能力达标，复杂场景下的技术取舍还需更具体的说明。'
]

/** 根据目标岗位选择题目库。 */
function pickBank (targetPosition = '') {
  const lower = targetPosition.toLowerCase()
  for (const bank of ROLE_BANKS) {
    if (bank.match.some(keyword => lower.includes(keyword.toLowerCase()))) return bank
  }
  return ROLE_BANKS[ROLE_BANKS.length - 1]
}

/**
 * 生成一套面试题。
 * 题目会带上目标岗位与简历技能，让演示内容看起来是针对性的，而不是通用题库。
 */
export function buildQuestions ({ targetPosition, difficulty = 'medium', total = 5, skills = [] }) {
  const bank = pickBank(targetPosition)
  const pools = bank.questions.slice()
  const questions = []

  // 首题优先围绕简历技能发问，体现「题目来自简历」这件事。
  const focusSkill = skills.find(skill => /python|fastapi|redis|postgres|docker|langchain/i.test(skill))
  if (focusSkill) {
    questions.push(`你的简历里提到了 ${focusSkill}，请讲讲你在哪个项目中真正用它解决过问题。`)
  }

  while (questions.length < total && pools.length) {
    questions.push(pools.shift())
  }
  while (questions.length < total) {
    questions.push('请补充一个你最有成就感的项目，并说明你的具体贡献。')
  }
  return questions.slice(0, total)
}

/** 生成一句难度相关的追问式提示，作为点评的收尾。 */
export function difficultyProbe (difficulty) {
  const probes = DIFFICULTY_PROBES[difficulty] || DIFFICULTY_PROBES.medium
  return probes[Math.floor(Math.random() * probes.length)]
}

/** 随机取一句开场白。 */
export function pickGreeting () {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
}

/**
 * 根据回答内容计算演示分数。
 * 规律是刻意设计的：回答越长、命中的技术关键词越多，得分越高，
 * 这样访客能直观感受到「回答质量 → 评分」的因果关系。
 */
export function scoreAnswer (answer = '', { base = 6.0 } = {}) {
  const text = String(answer)
  const lengthBonus = Math.min(1.8, text.length / 110)
  const hits = TECH_KEYWORDS.filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()))
  const keywordBonus = Math.min(1.6, hits.length * 0.28)
  const structureBonus = /(第一|第二|第三|首先|其次|最后|1\.|2\.|3\.|一是|二是)/.test(text) ? 0.5 : 0

  const raw = base + lengthBonus + keywordBonus + structureBonus
  const score = Math.max(3.5, Math.min(9.7, raw))
  return {
    score: Math.round(score * 10) / 10,
    hits,
    hasStructure: structureBonus > 0
  }
}

/** 生成一段点评文本，模拟真实模型流式输出的措辞与结构。 */
export function buildEvaluation ({ answer, result, question, index, total, targetPosition, difficulty }) {
  const { score, hits, hasStructure } = result
  const highlight = hits.slice(0, 3)
  const opening = score >= 8
    ? '整体回答质量较高，思路清晰。'
    : score >= 6.5
      ? '回答方向正确，主干内容是站得住的。'
      : '回答勉强覆盖了问题，但信息量偏少。'

  const detailLines = []
  if (highlight.length) {
    detailLines.push(`你提到了 ${highlight.join('、')}，这些是面试官会重点关注的技术点，说明你对相关机制有实际接触。`)
  } else {
    detailLines.push('回答里缺少具体的技术名词与机制说明，建议把「做了什么」补充成「用什么方式做到的」。')
  }
  if (hasStructure) {
    detailLines.push('表述有分点结构，逻辑容易跟随，这是加分项。')
  } else {
    detailLines.push('建议用分点的方式组织回答，先给结论再展开，避免信息堆在一起。')
  }
  if (answer && answer.length < 40) {
    detailLines.push('回答偏短，建议补充背景、你的动作和最终结果，让面试官能判断你的实际参与深度。')
  } else {
    detailLines.push('如果能再补一个可量化的结果（例如耗时、并发量或成本变化），说服力会更强。')
  }

  return [
    opening,
    '',
    ...detailLines.map(line => `- ${line}`),
    '',
    difficultyProbe(difficulty),
    '',
    `（第 ${index + 1} / ${total} 题 · 目标岗位：${targetPosition || '未填写'}）`,
    '',
    '```json',
    JSON.stringify({ score, question: question?.slice(0, 24) || '', comment: opening }, null, 0),
    '```'
  ].join('\n')
}

/** 根据各题得分汇总生成评估报告。 */
export function buildReport ({ questionScores = [], targetPosition }) {
  const scores = questionScores.map(item => item.score)
  const overall = scores.length
    ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10
    : 0
  const weakest = [...questionScores].sort((a, b) => a.score - b.score)[0]
  const strongest = [...questionScores].sort((a, b) => b.score - a.score)[0]

  return {
    overall_score: overall,
    hire_recommendation: REPORT_HIRE_RECOMMENDATIONS[overall >= 8 ? 0 : overall >= 6.5 ? 1 : 2],
    summary:
      `本次模拟面试共 ${questionScores.length} 题，综合得分 ${overall} / 10。` +
      (strongest ? `你在「${strongest.question.slice(0, 28)}」这类问题上表现最好。` : '') +
      (weakest ? `「${weakest.question.slice(0, 28)}」这类问题相对薄弱，建议优先补齐。` : '') +
      `针对 ${targetPosition || '目标岗位'}，整体表达与工程基础已经达到可面试的水准。`,
    strengths: [
      strongest
        ? `在「${strongest.question.slice(0, 26)}」上回答具体，能讲清实现方式（得分 ${strongest.score}）`
        : '技术基础较扎实，能覆盖岗位核心问题',
      '项目经验与技术栈相关，具备可追问的真实细节',
      '表达有条理，回答节奏稳定，能在压力下保持结构'
    ],
    weaknesses: [
      weakest
        ? `「${weakest.question.slice(0, 26)}」的回答深度不足（得分 ${weakest.score}），缺少取舍分析`
        : '复杂场景下的技术取舍说明不足',
      '部分回答缺少可量化结果，成果不易被验证',
      '系统设计层面的思考偏少，多停留在功能实现'
    ],
    suggestions: [
      '用 STAR 法则重写项目经历：背景、你的动作、结果、复盘各一句话',
      '为每个项目准备 2 个量化指标，例如 QPS、P99 延迟或成本下降比例',
      '针对薄弱题型准备一个「设计取舍」模板，主动说明为什么不用另一种方案',
      '练习在 90 秒内讲完一个项目，先给结论再补细节'
    ],
    question_scores: questionScores
  }
}
