# 你与作者的匹配度测试

一个可部署到 **Cloudflare Pages** 的“匹配度测试”网站，带后端数据库（Cloudflare D1）。
前端纯 HTML / CSS / 原生 JS，**不含任何标准答案**；作者答案只保存在 D1 中，由 Pages Functions 在后端独立计算。

## 技术栈

- 前端：原生 HTML / CSS / JS（**无框架、无构建、无外部 CDN**，所有资源本地化）
- 后端：Cloudflare Pages Functions（`functions/` 目录）
- 数据库：Cloudflare D1（Serverless SQLite）

## 目录结构

```
matching-quiz/
├── index.html              # 前端页面（开始 / 答题 / 结果 三个视图）
├── styles.css              # 样式（玻璃拟态卡片，无外部依赖）
├── script.js               # 前端逻辑（不出现任何作者答案，支持单选/多选）
├── functions/
│   └── api/
│       ├── questions.js    # GET  /api/questions  返回题目（id/text/type/options）
│       ├── submit.js       # POST /api/submit    接收字母组合答案、计算分数
│       └── _middleware.js  # 可选：CORS / OPTIONS 预检
├── schema.sql              # D1 建表 + 37 题初始数据（作者答案只在库里）
├── wrangler.toml           # Pages 配置 + D1 绑定
└── README.md
```

## 数据模型（D1）

```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'multiple')),
  options TEXT NOT NULL,          -- JSON 字符串，如 ["A. 可口可乐","B. 百事可乐",...]
  author_answer TEXT NOT NULL,    -- 大写字母组合，如 'A' 或 'ABCD'
  sort_order INTEGER NOT NULL DEFAULT 0
);
```

> 注意：第 16 题原始数据作者是单选但答案是 `ABC`，已在 `schema.sql` 中改为 `multiple` 以保持数据合法。

## 一、环境配置与账号绑定（部署前准备）

### 1. 注册并登录 Cloudflare
打开 https://dash.cloudflare.com/sign-up 注册并登录。

### 2. 安装 Node 18+ 与 Wrangler
```bash
node -v        # 需 >= 18
npx wrangler --version
```
首次运行会让你在浏览器里登录 Cloudflare 并完成 **OAuth 授权** —— 这就是「账号绑定」步骤。

### 3. 创建 D1 数据库（拿到 database_id）
```bash
npx wrangler d1 create matching-quiz-db
```
把返回的 uuid 填进 `wrangler.toml` 的 `database_id = "YOUR_DATABASE_ID_HERE"`。

### 4. 绑定关系对照

| 概念 | 值 | 说明 |
|---|---|---|
| D1 数据库名 | `matching-quiz-db` | `--local` 初始化 / 远程执行用 |
| D1 绑定名 | `DB` | 代码里用 `env.DB` 访问，**三处必须一致** |
| database_id | 控制台返回的 uuid | 填进 `wrangler.toml` |

## 二、本地开发

```bash
cd matching-quiz

# 初始化【本地】D1 数据库（执行 schema.sql 的建表与 37 题）
npx wrangler d1 execute matching-quiz-db --local --file=./schema.sql

# 启动本地开发服务器（Pages + Functions + 本地 D1）
npx wrangler pages dev . --d1 DB=matching-quiz-db
#   若想显式用 id：--d1 DB=你的database_id
```

打开终端提示的本地地址（通常 http://localhost:8788）即可预览。

## 三、部署到 Cloudflare Pages

### 方式 A：连接 Git 仓库（推荐）
1. 把 `matching-quiz/` 推到 GitHub 仓库。
2. Cloudflare 控制台 → **Workers & Pages** → **创建** → **Pages** → 连接 Git 仓库。
3. 构建设置：**Build command** 留空，**Build output directory** 填 `/`。
4. 部署完成后 → **Settings → Bindings → Add → D1 database**：Variable name 填 `DB`，选择 `matching-quiz-db`，保存后**重新部署**。
5. 初始化远程数据库（二选一）：
   - 控制台 **D1** 页面 → 打开 `matching-quiz-db` → 粘贴 `schema.sql` 执行；
   - 或命令行：`npx wrangler d1 execute matching-quiz-db --file=./schema.sql`

### 方式 B：Wrangler 直接部署
```bash
npx wrangler pages deploy . --branch main
# 部署后仍需到控制台绑定 D1（Variable name = DB）并重新部署
```

## 四、API 设计

### GET /api/questions
返回题目（**不含 author_answer**）：
```json
{ "questions": [ { "id": 1, "text": "你喜欢喝什么可乐？", "type": "single", "options": ["A. 可口可乐", "B. 百事可乐", ...] } ] }
```

### POST /api/submit
请求体：
```json
{ "answers": [ { "questionId": 1, "userAnswer": "A" }, { "questionId": 2, "userAnswer": "ABCD" } ] }
```
响应：
```json
{
  "rawScore": 2850,
  "matchPercent": 77,
  "total": 37,
  "level": "高度匹配，默契不错",
  "levelKey": "high",
  "topMatches": [ { "questionId": 4, "text": "...", "userAnswer": "A", "authorAnswer": "A", "score": 100 } ],
  "topDifferences": [ { "questionId": 9, "text": "...", "userAnswer": "A", "authorAnswer": "F", "score": 0 } ]
}
```

## 五、安全设计说明

- **前端零答案**：`script.js` 中不存在任何 `author_answer` 或类似变量；标准答案只存在于 D1。
- **GET /api/questions** 显式只 `SELECT id, text, type, options`，排除 `author_answer`。
- **POST /api/submit** 读取 `author_answer` 后仅用于后端计算；是否回传由
  `submit.js` 顶部 `EXPOSE_AUTHOR_IN_BREAKDOWN` 控制（默认 `true`，仅回传最一致/差异最大的 6 题明细；改为 `false` 则完全不回传作者答案）。
- **防注入**：所有数据库查询均使用 `prepare(...).bind(...)` 参数化。
- **输入校验**：`answers` 长度须与题目数一致；`userAnswer` 必须是大写字母组合；字母须在选项范围内；单选只能 1 个、多选至少 1 个。
- **轻度限流**：`submit.js` 内置基于 IP 的 1 分钟 10 次内存速率限制（单实例有效）。

## 六、匹配度算法

- **单选（single）**：用户选项与作者完全一致得 100，否则 0（二值）。
- **多选（multiple）**：用 **Jaccard 相似度** = `|交集| / |并集|`，范围 0-100，部分重合给部分分。
- 每题得分 0-100，**匹配度百分比 = 各题得分的平均值**（即 `matchPercent = round(Σ得分 / 题数)`）。
- 原始分 `rawScore` = 各题得分之和（满分 `题数 × 100`）。
- 等级：
  - 85-100：灵魂同频，你们很像（soulmate）
  - 70-84：高度匹配，默契不错（high）
  - 50-69：中等匹配，有同有异（medium）
  - 30-49：差异较大，但可能互补（low）
  - 0-29：完全不同频，两个世界（none）
