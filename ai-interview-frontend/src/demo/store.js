// 演示模式的内存数据库。
//
// 设计要点：
// 1. 状态写入 localStorage，刷新页面后数据仍在，访客的演示体验是连续的；
// 2. 「解析中」「报告生成中」这类异步状态用时间戳（*_ready_at）表达，
//    而不是 setTimeout，这样刷新页面后状态依然正确，不会被重置；
// 3. 随机性只用于现场生成的点评文案，预置的历史记录保持稳定。

import {
  DEMO_ACCOUNT,
  DEMO_RESUME_RESULT,
  PROVIDER_PRESETS,
  SEED_PROFILE,
  SEED_PROVIDER,
  buildEvaluation,
  buildQuestions,
  buildReport,
  pickGreeting,
  scoreAnswer
} from './data.js'

const STORAGE_KEY = 'jianshi-demo-db-v1'
const DB_VERSION = 1

/** 简历解析耗时（毫秒），对应真实项目的后台解析任务。 */
const PARSE_DURATION = 2600
/** 综合报告生成耗时（毫秒），对应真实项目里报告与答题解耦后的后台生成。 */
const REPORT_DURATION = 2400

const DAY = 24 * 60 * 60 * 1000

let state = null

function isoAgo (ms) {
  return new Date(Date.now() - ms).toISOString()
}

function nextId () {
  state.sequence += 1
  return state.sequence
}

/** 构造一条消息记录，字段与 Interview.vue 读取的字段保持一致。 */
function message ({ role, content, questionIndex = null, score = null, feedback = null }) {
  return {
    id: nextId(),
    role,
    content,
    question_index: questionIndex,
    score,
    feedback,
    created_at: new Date().toISOString()
  }
}

/** 为一套题目补上模拟作答记录。 */
function seedAnswers (interview, scores) {
  const list = []
  const questions = interview.questions
  list.push(message({
    role: 'interviewer',
    content: `${pickGreeting()}\n\n${questions[0]}`,
    questionIndex: 0
  }))

  scores.forEach((score, index) => {
    list.push(message({
      role: 'candidate',
      content: SAMPLE_ANSWERS[index % SAMPLE_ANSWERS.length],
      questionIndex: index
    }))
    list.push(message({
      role: 'interviewer',
      content: `这道题的得分为 ${score} / 10。回答能覆盖核心要点，建议补充具体的实现细节与取舍理由。`,
      questionIndex: index,
      score,
      feedback: '结构清晰，细节可再补充'
    }))
    if (index + 1 < questions.length) {
      list.push(message({
        role: 'interviewer',
        content: questions[index + 1],
        questionIndex: index + 1
      }))
    }
  })

  return list
}

const SAMPLE_ANSWERS = [
  '我负责的是接口层的设计与实现。项目用 FastAPI 做异步服务，PostgreSQL 存业务数据，Redis 做缓存和限流。' +
  '上线前我压测过核心接口，把 P99 从 380ms 降到了 120ms 左右，主要手段是补齐索引并给热点数据加了缓存。',
  '排查慢查询我会先看慢日志确认是哪条 SQL，再用 EXPLAIN 看执行计划。' +
  '常见原因是索引缺失或者回表过多，我会先补联合索引，如果数据量太大再考虑分库分表。',
  '幂等我会用业务唯一键加数据库唯一索引兜底，同时用 Redis 记录请求凭证做前置拦截，' +
  '这样重复请求在进入业务逻辑之前就被挡掉了，避免重复扣款这类问题。'
]

function emptyState () {
  return {
    version: DB_VERSION,
    // 预置记录的 id 固定在 900 / 1001 / 1002，运行时新建的 id 从 5001 起，
    // 两段区间互不重叠，避免预置数据被新建数据覆盖。
    sequence: 5000,
    user: null,
    providers: [],
    presets: PROVIDER_PRESETS,
    resumes: {},
    interviews: {},
    messages: {},
    activeResumeId: null
  }
}

/** 生成两条预置的面试记录：一条已完成（带报告），一条进行中（可继续作答）。 */
function seed (target) {
  const providers = [{ ...SEED_PROVIDER }]

  const completedQuestions = buildQuestions({
    targetPosition: 'Python 后端开发工程师',
    difficulty: 'hard',
    total: 5,
    skills: DEMO_RESUME_RESULT.parsed_content.skills
  })
  const completedScores = [8.4, 7.6, 8.1, 6.9, 7.4]
  const completed = {
    interview_id: 1001,
    created_at: isoAgo(3 * DAY),
    updated_at: isoAgo(3 * DAY - 20 * 60 * 1000),
    target_position: 'Python 后端开发工程师',
    difficulty: 'hard',
    total_questions: 5,
    status: 'completed',
    overall_score: Math.round((completedScores.reduce((a, b) => a + b, 0) / completedScores.length) * 10) / 10,
    resume_id: 900,
    questions: completedQuestions,
    current_index: 4,
    provider_name: SEED_PROVIDER.name,
    model: SEED_PROVIDER.default_model,
    report_ready_at: Date.now() - 3 * DAY,
    report: null
  }
  completed.report = buildReport({
    targetPosition: completed.target_position,
    questionScores: completedQuestions.map((question, index) => ({ question, score: completedScores[index] }))
  })

  const runningQuestions = buildQuestions({
    targetPosition: 'AI Agent 开发工程师',
    difficulty: 'medium',
    total: 3,
    skills: DEMO_RESUME_RESULT.parsed_content.skills
  })
  // 已作答的题目数量。current_index 必须与之一致：
  // 它决定访客继续作答时从第几题开始，写错会导致某道题被重复提问。
  const runningScores = [7.8]
  const running = {
    interview_id: 1002,
    created_at: isoAgo(26 * 60 * 60 * 1000),
    updated_at: isoAgo(25 * 60 * 60 * 1000),
    target_position: 'AI Agent 开发工程师',
    difficulty: 'medium',
    total_questions: 3,
    status: 'in_progress',
    overall_score: null,
    resume_id: 901,
    questions: runningQuestions,
    current_index: runningScores.length,
    provider_name: SEED_PROVIDER.name,
    model: SEED_PROVIDER.default_model,
    report_ready_at: null,
    report: null
  }
  const runningMessages = seedAnswers(running, runningScores)

  // 就地写入而不是返回新对象：seed() 内部会调用 nextId()，
  // 它依赖模块级 state 已经指向当前对象。
  target.providers = providers
  target.resumes = {
    900: {
      resume_id: 900,
      filename: 'demo-backend-resume.pdf',
      target_position: completed.target_position,
      status: 'completed',
      parsed_content: DEMO_RESUME_RESULT.parsed_content,
      analysis: DEMO_RESUME_RESULT.analysis,
      parse_ready_at: Date.now() - 3 * DAY
    },
    901: {
      resume_id: 901,
      filename: 'demo-agent-resume.pdf',
      target_position: running.target_position,
      status: 'completed',
      parsed_content: DEMO_RESUME_RESULT.parsed_content,
      analysis: DEMO_RESUME_RESULT.analysis,
      parse_ready_at: Date.now() - 26 * 60 * 60 * 1000
    }
  }
  target.interviews = { 1001: completed, 1002: running }
  target.messages = { 1001: seedAnswers(completed, completedScores), 1002: runningMessages }
  target.activeResumeId = 901
  return target
}

function persist () {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (_) {
    // 隐私模式下 localStorage 可能不可写，此时退化为纯内存演示。
  }
}

function load () {
  if (state) return state
  let restored = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.version === DB_VERSION) restored = parsed
    }
  } catch (_) {
    restored = null
  }
  if (restored) {
    state = restored
  } else {
    // 必须先把空状态挂到模块级 state，再填充预置数据：
    // seed() 内部生成消息时会调用 nextId()，它读取的正是这个 state。
    state = emptyState()
    seed(state)
  }
  persist()
  return state
}

/** 重置演示数据，回到初始的预置状态。 */
export function resetDemoState () {
  state = emptyState()
  seed(state)
  persist()
  return state
}

export function demoState () {
  return load()
}

export { DEMO_ACCOUNT }

// ---------------------------------------------------------------------------
// 账号
// ---------------------------------------------------------------------------

export function login (payload = {}) {
  const email = payload.email || DEMO_ACCOUNT.email
  const db = load()
  if (!db.user) {
    db.user = { ...SEED_PROFILE, email: email || SEED_PROFILE.email }
  } else {
    db.user.email = email || db.user.email
  }
  persist()
  return buildAuthResponse(db.user)
}

export function register (payload = {}) {
  const db = load()
  db.user = {
    ...SEED_PROFILE,
    email: payload.email || SEED_PROFILE.email,
    first_name: payload.first_name || SEED_PROFILE.first_name,
    last_name: payload.last_name || SEED_PROFILE.last_name
  }
  persist()
  return buildAuthResponse(db.user)
}

function buildAuthResponse (user) {
  return {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar
    }
  }
}

export function getProfile () {
  const db = load()
  if (!db.user) db.user = { ...SEED_PROFILE }
  return { ...db.user }
}

export function updateProfile (payload = {}) {
  const db = load()
  db.user = { ...(db.user || SEED_PROFILE), ...payload }
  persist()
  return { ...db.user }
}

export function changePassword () {
  return { changed: true }
}

export function uploadAvatar () {
  const db = load()
  // 演示模式不保存真实图片，仅回一个占位标记，避免额外网络请求。
  db.user = { ...(db.user || SEED_PROFILE), avatar: '' }
  persist()
  return { avatar: '' }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function listProviders () {
  return load().providers.map(item => ({ ...item }))
}

export function providerPresets () {
  return PROVIDER_PRESETS.map(item => ({ ...item }))
}

export function providerStatus () {
  const active = load().providers.find(item => item.is_active) || null
  return {
    configured: Boolean(active),
    active_provider: active ? { ...active } : null
  }
}

function normalizeProvider (payload = {}, existing = null) {
  const preset = PROVIDER_PRESETS.find(item => item.key === payload.provider)
  const models = Array.isArray(payload.models) ? payload.models.filter(Boolean) : []
  return {
    id: existing?.id ?? null,
    identifier: payload.identifier || preset?.key || 'custom',
    provider: payload.provider || existing?.provider || 'custom',
    name: payload.name || existing?.name || preset?.label || '自定义配置',
    note: payload.note ?? existing?.note ?? '',
    website_url: payload.website_url ?? existing?.website_url ?? '',
    base_url: payload.base_url || existing?.base_url || '',
    api_key_masked: payload.api_key
      ? maskKey(payload.api_key)
      : (existing?.api_key_masked || 'sk-••••••••'),
    models,
    default_model: payload.default_model || models[0] || '',
    api_version: payload.api_version ?? existing?.api_version ?? '',
    is_active: existing?.is_active ?? false,
    is_validated: existing?.is_validated ?? false
  }
}

function maskKey (key) {
  const text = String(key)
  if (text.length <= 8) return 'sk-••••'
  return `${text.slice(0, 3)}••••${text.slice(-4)}`
}

export function createProvider (payload) {
  const db = load()
  const provider = normalizeProvider(payload)
  provider.id = nextId()
  db.providers.push(provider)
  persist()
  return { ...provider }
}

export function updateProvider (id, payload) {
  const db = load()
  const index = db.providers.findIndex(item => String(item.id) === String(id))
  if (index < 0) throw new Error('配置不存在')
  const merged = normalizeProvider(payload, db.providers[index])
  merged.id = db.providers[index].id
  db.providers[index] = merged
  persist()
  return { ...merged }
}

export function deleteProvider (id) {
  const db = load()
  db.providers = db.providers.filter(item => String(item.id) !== String(id))
  persist()
  return { deleted: true }
}

/** 演示模式的“连接测试”不做真实请求，直接标记为已验证。 */
export function testProvider (id) {
  const db = load()
  const provider = db.providers.find(item => String(item.id) === String(id))
  if (!provider) throw new Error('请先保存配置，再进行连接测试')
  provider.is_validated = true
  persist()
  return { ...provider }
}

export function activateProvider (id) {
  const db = load()
  const target = db.providers.find(item => String(item.id) === String(id))
  if (!target) throw new Error('配置不存在')
  if (!target.is_validated) throw new Error('请先测试连接')
  db.providers.forEach(item => { item.is_active = String(item.id) === String(id) })
  persist()
  return { ...target }
}

export function discoverModels (payload = {}) {
  const preset = PROVIDER_PRESETS.find(item => item.key === payload.provider)
  const models = preset?.default_models?.length
    ? preset.default_models
    : ['demo-model-chat', 'demo-model-reasoner']
  return { models: [...models] }
}

// ---------------------------------------------------------------------------
// 简历
// ---------------------------------------------------------------------------

export function uploadResume (payload = {}) {
  const db = load()
  const resumeId = nextId()
  db.resumes[resumeId] = {
    resume_id: resumeId,
    filename: payload.filename || 'resume.pdf',
    target_position: payload.targetPosition || '',
    status: 'parsing',
    parsed_content: null,
    analysis: null,
    parse_ready_at: Date.now() + PARSE_DURATION
  }
  db.activeResumeId = resumeId
  persist()
  return { resume_id: resumeId, status: 'parsing' }
}

export function getResume (id) {
  const db = load()
  const resume = db.resumes[id]
  if (!resume) throw new Error('简历不存在')
  if (resume.status === 'parsing' && Date.now() >= resume.parse_ready_at) {
    resume.status = 'completed'
    resume.parsed_content = DEMO_RESUME_RESULT.parsed_content
    resume.analysis = DEMO_RESUME_RESULT.analysis
    persist()
  }
  return {
    resume_id: resume.resume_id,
    filename: resume.filename,
    target_position: resume.target_position,
    status: resume.status,
    parsed_content: resume.parsed_content,
    analysis: resume.analysis
  }
}

export function listResumes () {
  const db = load()
  const items = Object.values(db.resumes).sort((a, b) => b.resume_id - a.resume_id)
  return { items }
}

// ---------------------------------------------------------------------------
// 面试
// ---------------------------------------------------------------------------

export function startInterview (payload = {}) {
  const db = load()
  const resume = db.resumes[payload.resume_id] || null
  const skills = resume?.parsed_content?.skills || DEMO_RESUME_RESULT.parsed_content.skills
  const total = Number(payload.total_questions) || 5
  const questions = buildQuestions({
    targetPosition: payload.target_position,
    difficulty: payload.difficulty,
    total,
    skills
  })
  const interviewId = nextId()
  const now = new Date().toISOString()
  const active = db.providers.find(item => item.is_active) || null

  db.interviews[interviewId] = {
    interview_id: interviewId,
    created_at: now,
    updated_at: now,
    target_position: payload.target_position || '未指定岗位',
    difficulty: payload.difficulty || 'medium',
    total_questions: total,
    status: 'in_progress',
    overall_score: null,
    resume_id: payload.resume_id ?? null,
    questions,
    current_index: 0,
    provider_name: active?.name || '演示 · DeepSeek',
    model: active?.default_model || 'deepseek-chat',
    report_ready_at: null,
    report: null
  }
  db.messages[interviewId] = [
    message({
      role: 'interviewer',
      content: `${pickGreeting()}\n\n${questions[0]}`,
      questionIndex: 0
    })
  ]
  persist()
  return { interview_id: interviewId, status: 'in_progress' }
}

export function listInterviews () {
  const db = load()
  const items = Object.values(db.interviews)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(item => ({
      interview_id: item.interview_id,
      created_at: item.created_at,
      target_position: item.target_position,
      difficulty: item.difficulty,
      total_questions: item.total_questions,
      status: item.status,
      overall_score: item.overall_score
    }))
  return { items }
}

export function deleteInterview (id) {
  const db = load()
  delete db.interviews[id]
  delete db.messages[id]
  persist()
  return { deleted: true }
}

export function getMessages (id) {
  const db = load()
  const list = db.messages[id] || []
  return {
    // 一并返回题目总数：前端用它显示「第 n / m 题」，避免 3 题或 8 题模式下计数错误。
    total_questions: db.interviews[id]?.total_questions ?? null,
    items: list.map(item => ({
      id: item.id,
      role: item.role,
      content: item.content,
      score: item.score,
      feedback: item.feedback,
      question_index: item.question_index
    }))
  }
}

export function getReport (id) {
  const db = load()
  const interview = db.interviews[id]
  if (!interview) throw new Error('面试记录不存在')

  if (interview.status === 'in_progress') {
    return { report_status: 'pending', report: null, overall_score: null }
  }
  if (interview.report_ready_at && Date.now() < interview.report_ready_at) {
    return { report_status: 'generating', report: null, overall_score: null }
  }
  if (!interview.report) {
    const questionScores = (db.messages[id] || [])
      .filter(item => item.role === 'interviewer' && item.score != null)
      .map((item, index) => ({ question: interview.questions[index] || `第 ${index + 1} 题`, score: item.score }))
    interview.report = buildReport({ targetPosition: interview.target_position, questionScores })
    interview.overall_score = interview.report.overall_score
    persist()
  }
  return {
    report_status: 'completed',
    report: interview.report,
    overall_score: interview.report.overall_score
  }
}

/**
 * 准备一次作答的结果：计算分数并生成点评文本。
 * 返回的 done 事件字段与真实后端 SSE 的 done 事件保持一致。
 */
export function prepareAnswer (id, answer) {
  const db = load()
  const interview = db.interviews[id]
  if (!interview) throw new Error('面试记录不存在')

  const index = interview.current_index || 0
  const question = interview.questions[index]
  const isLast = index >= interview.total_questions - 1
  const result = scoreAnswer(answer)
  const text = buildEvaluation({
    answer,
    result,
    question,
    index,
    total: interview.total_questions,
    targetPosition: interview.target_position,
    difficulty: interview.difficulty
  })

  return {
    text,
    question,
    result,
    done: {
      score: result.score,
      is_finished: isLast,
      next_question: isLast ? null : interview.questions[index + 1],
      question_index: index
    }
  }
}

/** 流式输出结束后落库，保证刷新页面后对话仍在。 */
export function commitAnswer (id, answer, prepared) {
  const db = load()
  const interview = db.interviews[id]
  if (!interview) return
  const index = interview.current_index || 0

  const list = db.messages[id] || (db.messages[id] = [])
  list.push(message({ role: 'candidate', content: answer, questionIndex: index }))
  list.push(message({
    role: 'interviewer',
    content: prepared.text,
    questionIndex: index,
    score: prepared.done.score,
    feedback: '演示模式生成的点评'
  }))

  if (prepared.done.is_finished) {
    interview.status = 'completed'
    interview.current_index = index
    interview.updated_at = new Date().toISOString()
    interview.report_ready_at = Date.now() + REPORT_DURATION
    const scores = list.filter(item => item.role === 'interviewer' && item.score != null).map(item => item.score)
    interview.overall_score = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null
  } else {
    interview.current_index = index + 1
    interview.updated_at = new Date().toISOString()
    list.push(message({
      role: 'interviewer',
      content: prepared.done.next_question,
      questionIndex: index + 1
    }))
  }
  persist()
}
