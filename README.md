# 简试（JianShi AI）

简试是一个面向求职者的 AI 模拟面试平台，提供简历上传与解析、面试对话、AI 反馈报告、用户管理和后台运营管理等功能。

## 技术栈

- 用户端与管理端：Vue 3、Vite、Pinia、Vue Router、Axios
- 后端：FastAPI、SQLAlchemy、Alembic、Pydantic
- 数据与任务：PostgreSQL、Redis、Celery
- AI 服务：支持 DeepSeek、OpenAI 及 OpenAI 兼容供应商（由用户在 API 配置页填写）
- 部署：Docker、Docker Compose、Nginx

## 项目结构

```text
ai-interview/
├── ai-interview-frontend/   # 用户端，默认端口 3000
├── ai-interview-admin/      # 管理端，默认端口 3001
├── ai-interview-backend/    # API、数据库迁移与 Docker 配置
└── 部署文档.md
```

## 本地运行

1. 复制 `ai-interview-backend/.env.example` 为 `.env`，填写数据库、管理员和 JWT/加密密钥；AI Key 在登录后的 API 配置页填写。
2. 按照 [部署文档](部署文档.md) 启动 Docker 后端服务。
3. 分别在两个前端目录执行 `npm ci` 和 `npm run dev`。

本地 `.env`、运行日志、上传文件、依赖目录、构建产物和 IDE 配置均已排除，不应提交到 Git 仓库。上传前请执行部署文档中的安全检查。

## 维护者

微信：`Sane_926`
