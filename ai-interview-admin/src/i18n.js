import { createI18n } from 'vue-i18n'

const messages = {
  zh: {
    common: { brand: '简试', product: 'JianShi AI', overview: '数据概览', users: '用户管理', interviews: '面试记录', logout: '退出登录', theme: '切换主题', language: '切换语言', loading: '加载中...', email: '邮箱', password: '密码', login: '登录', loggingIn: '登录中...', search: '搜索邮箱或姓名...', allStatus: '全部状态', inProgress: '进行中', completed: '已完成', enabled: '正常', disabled: '禁用', enable: '启用', disable: '禁用', detail: '详情', delete: '删除', back: '上一页', next: '下一页', actions: '操作', date: '时间', score: '得分', difficulty: '难度', questions: '题数', page: '页', confirmDelete: '确定删除这条面试记录吗？', deleteFailed: '删除失败', noData: '暂无数据' },
    auth: { eyebrow: 'ADMIN CONSOLE', title: '后台登录', subtitle: '管理 JianShi AI 的用户、面试与反馈。', placeholderEmail: "admin{'@'}jianshi-ai.local", placeholderPassword: '输入密码' },
    dashboard: { eyebrow: 'OVERVIEW', title: '数据概览', subtitle: '实时查看平台运行与面试活动。', users: '注册用户', resumes: '上传简历', interviews: '面试总数', completed: '已完成面试' },
    users: { eyebrow: 'PEOPLE', title: '用户管理', subtitle: '查看账户状态和注册信息。', id: 'ID', email: '邮箱', name: '姓名', status: '状态', created: '注册时间' },
    interviews: { eyebrow: 'SESSIONS', title: '面试记录', subtitle: '筛选、查看并管理平台上的面试会话。', id: 'ID', user: '用户', role: '目标岗位', status: '状态', time: '时间' },
    detail: { eyebrow: 'SESSION DETAIL', title: '面试详情', role: '目标岗位', difficulty: '难度', questions: '题数', overall: '综合得分', status: '状态', report: '评估报告', summary: '总体评价', strengths: '优势', weaknesses: '不足', conversation: '对话记录', interviewer: '面试官', candidate: '候选人', rating: '评分' }
  },
  en: {
    common: { brand: 'JianShi', product: 'JianShi AI', overview: 'Overview', users: 'Users', interviews: 'Interviews', logout: 'Sign out', theme: 'Toggle theme', language: 'Switch language', loading: 'Loading...', email: 'Email', password: 'Password', login: 'Sign in', loggingIn: 'Signing in...', search: 'Search email or name...', allStatus: 'All statuses', inProgress: 'In progress', completed: 'Completed', enabled: 'Active', disabled: 'Disabled', enable: 'Enable', disable: 'Disable', detail: 'Details', delete: 'Delete', back: 'Previous', next: 'Next', actions: 'Actions', date: 'Date', score: 'Score', difficulty: 'Difficulty', questions: 'Questions', page: 'page', confirmDelete: 'Delete this interview?', deleteFailed: 'Delete failed', noData: 'No data yet' },
    auth: { eyebrow: 'ADMIN CONSOLE', title: 'Admin sign in', subtitle: 'Manage JianShi AI users, interviews and feedback.', placeholderEmail: "admin{'@'}jianshi-ai.local", placeholderPassword: 'Enter password' },
    dashboard: { eyebrow: 'OVERVIEW', title: 'Overview', subtitle: 'A real-time view of platform activity and interview health.', users: 'Registered users', resumes: 'Uploaded resumes', interviews: 'Total interviews', completed: 'Completed interviews' },
    users: { eyebrow: 'PEOPLE', title: 'User management', subtitle: 'Review account status and registration details.', id: 'ID', email: 'Email', name: 'Name', status: 'Status', created: 'Registered' },
    interviews: { eyebrow: 'SESSIONS', title: 'Interview records', subtitle: 'Filter, inspect and manage interview sessions.', id: 'ID', user: 'User', role: 'Target role', status: 'Status', time: 'Time' },
    detail: { eyebrow: 'SESSION DETAIL', title: 'Interview details', role: 'Target role', difficulty: 'Difficulty', questions: 'Questions', overall: 'Overall score', status: 'Status', report: 'Evaluation report', summary: 'Summary', strengths: 'Strengths', weaknesses: 'Areas to improve', conversation: 'Conversation', interviewer: 'Interviewer', candidate: 'Candidate', rating: 'Rating' }
  }
}
const locale = localStorage.getItem('jianshi-locale') || (navigator.language.startsWith('zh') ? 'zh' : 'en')
export default createI18n({ legacy: false, locale, fallbackLocale: 'zh', messages })
