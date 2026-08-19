# 简试 JianShi AI

简试是一个面向求职者的 AI 模拟面试平台。用户上传 PDF 简历后，可以选择目标岗位和面试难度，完成多轮 AI 面试，并获得逐题反馈与综合评估报告。

> 本项目是个人学习与工程实践项目，支持中文/English 和白昼/黑夜两套界面主题。

## 功能

- **简历解析**：PDF 文本提取、结构化信息识别、岗位匹配分析。
- **AI 模拟面试**：根据简历、目标岗位和难度动态生成问题。
- **实时反馈**：通过 SSE 流式返回回答点评和评分。
- **综合报告**：汇总优势、不足、建议和录用倾向。
- **个人 API 配置**：用户填写自己的模型供应商、Endpoint、模型和 API Key；API Key 服务端加密保存，不在接口中回传。
- **多供应商兼容**：支持 DeepSeek、OpenAI、Anthropic、Gemini、通用 OpenAI Compatible 等配置。
- **双端界面**：用户端和管理端分离，支持中文/English、白昼/黑夜主题。
- **后台管理**：用户、面试记录和基础运营数据管理。

## 页面预览

### 用户端

| 黑夜主题 · 中文 | 白昼主题 · English |
|---|---|
| ![面试记录黑夜中文](docs/screenshots/interview-history-dark-zh.png) | ![Interview history light English](docs/screenshots/interview-history-light-en.png) |

### API 配置

| 黑夜主题 · 中文 | 白昼主题 · English |
|---|---|
| ![API 配置黑夜中文](docs/screenshots/api-settings-dark-zh.png) | ![API settings light English](docs/screenshots/api-settings-light-en.png) |

## 技术架构

```text
用户端 Vue 3 ─┐
              ├─ FastAPI Client API ─ PostgreSQL
管理端 Vue 3 ─┘                    └ Redis / Celery Worker
                                         └ AI Provider Runtime
```

| 模块 | 技术 |
|---|---|
| 用户端 / 管理端 | Vue 3、Vite、Pinia、Vue Router、Axios |
| 后端 | FastAPI、SQLAlchemy 2、Pydantic |
| 数据库 | PostgreSQL 16、Alembic |
| 缓存与队列 | Redis 7、Celery Worker |
| AI 调用 | LiteLLM、OpenAI Compatible 协议 |
| 部署 | Docker Compose、Ubuntu、Nginx（可选） |

简历上传和最终报告采用后台处理，PDF 提取放到线程池，避免阻塞 FastAPI 事件循环；SQL 日志、Redis 日志和数据库连接池均针对单机开发环境做了收紧。

## 快速开始

完整的 VMware、Ubuntu、Docker、数据库迁移、前端启动和故障排查步骤请阅读 [部署文档](部署文档.md)。基本流程如下：

### 1. 后端

```bash
cd ai-interview-backend
cp .env.example .env
# 编辑 .env，至少设置 ADMIN_PASSWORD、SECRET_KEY、API_KEY_ENCRYPTION_KEY
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
docker exec -it jianshi-ai-app alembic upgrade head
docker exec -it jianshi-ai-app python scripts/create_first_admin.py
```

### 2. 前端

Windows 本地需要 Node.js 18+。分别在两个前端目录执行：

```bash
cp .env.example .env.local
# 将 VITE_API_TARGET 设置为 http://你的Ubuntu虚拟机IP:8006
npm ci
npm run dev
```

用户端默认地址：`http://localhost:3000`  
管理端默认地址：`http://localhost:3001`

### 3. 配置 AI Provider

登录用户端后进入 **API 配置**，填写供应商、Endpoint、API Key 和模型，先执行连接测试，再设为启用。AI Key 不需要写入前端代码，也不需要提交到 `.env`。

## 环境变量与安全

- `.env`、`.env.local`、日志、上传文件、数据库文件、`dist`、`node_modules` 和 IDE 配置均被忽略。
- `API_KEY_ENCRYPTION_KEY` 用于加密用户 API Key，生产环境必须使用新的 Fernet 密钥。
- `SECRET_KEY` 和 `ADMIN_PASSWORD` 必须使用随机值，不能使用示例值。
- 如果任何真实 API Key 曾经进入 Git 历史，应立即在供应商后台撤销并重新生成；仅删除工作区文件是不够的。
- 上传 GitHub 前执行 `git status --short`，确认没有 `.env`、`logs/`、`uploads/` 或构建产物。

## API 文档

后端启动后：

- 用户端 API：`http://你的Ubuntu虚拟机IP:8006/client/docs`
- 管理端 API：`http://你的Ubuntu虚拟机IP:8006/backoffice/docs`

## 项目结构

```text
ai-interview/
├── ai-interview-frontend/   # 用户端
├── ai-interview-admin/      # 管理端
├── ai-interview-backend/    # FastAPI、数据库迁移、Docker 配置
├── docs/                    # 设计记录与页面截图
├── 部署文档.md
└── README.md
```

## 许可证与联系

当前仓库未额外声明开源许可证。使用、二次分发或商用前，请先补充合适的 LICENSE 文件。

维护者：Sane_926
