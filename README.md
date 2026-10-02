# 你与作者的匹配度测试

一个可部署到 **Cloudflare Pages** 的“匹配度测试”网站，带后端数据库（Cloudflare D1）。
前端纯 HTML / CSS / 原生 JS，**不含任何标准答案**；作者答案只保存在 D1 中，由 Pages Functions 在后端独立计算。

## 技术栈

- 前端：原生 HTML / CSS / JS（**无框架、无构建、无外部 CDN**，所有资源本地化）
- 后端：Cloudflare Pages Functions（`functions/` 目录）
- 数据库：Cloudflare D1（Serverless SQLite）

## 功能特性

- **界面：极简玻璃拟态（Minimal Glassmorphism）**——深空极光底色 + 毛玻璃面板 + 克制留白，全站暗色，纯 CSS 手写，无 UI 框架、无外部字体/CDN。见下文「界面与动效」。
- **三种作答形态**（题目带题型徽标与进度条）：`单选`、`多选（可多选）`，以及题干为陈述句、选项固定为「完全符合 → 完全不符合」的 **`符合度`** 五级题；**单选与符合度题选中后自动跳到下一题**（多选需手动点“下一题”）。
- **题库共 58 题**：39 道符合度题 + 14 道多选题 + 5 道常规单选题。全库已移除需要手填的「其他____」选项，作答过程不再需要输入文字。
- **反向题**：39 道符合度题里有 **12 道**的作者答案故意是「完全不符合」——**「一路点完全符合」不再等于满分**（实测由 76% 掉到 55%，而认真作答者仍是 100%、随机乱点仍是 38%）。详见「题型与题库」。
- **选项随机换位**：除五级符合度题外，其余题目的选项**每次抽样都重新打乱显示顺序**，且换位不会串答案（提交的始终是该项在原序里的字母）。
- **按主题维度均衡抽题**：开始页可自选本轮抽多少题（10 / 20 / 30 / 全部），抽题时按 7 个主题维度轮转分配，保证各维度题量接近。
- **反作弊（惩罚模式）**：后端依据「连续同选（straight-line）」与「作答过快」两个信号判定异常作答，命中则结果页显示惩罚提示，需点「我偏要看真实结果」才解锁分析。
- **结果页（借鉴 femboy 模式，更详细）**：
  - 匹配度圆环（SVG）+ 称号大标题（**92%+ → “可以跟作者配了 💍”**）；
  - 四格汇总卡（匹配度 / 等级称号 / 最强同频 / 最离谱分歧）；
  - **回答稳定度**（见下文「作答稳定度」）；
  - **多维同频雷达图**（纯 SVG 手绘，零依赖）；
  - **各维度同频度** 进度条 + 趣味评语；
  - **专属深度报告**（共同点 / 最离谱分歧 / 终极结论）；
  - 最一致 / 分歧最大的 3 题；
  - **保存结果长图**（html2canvas，**已本地化到 `vendor/`**，不外链 CDN）；
  - **一键复制结果文案**（原生 `navigator.clipboard`）。
- **「计算中」过场动画**：答完最后一题后，先过一屏 ANALYSING（圆环进度 + 五步清单 + 轮换状态文案）再切结果页。
  动画与 `/api/submit` **并行**跑，两边都完成才出结果 —— 服务器快时不会一闪而过，慢时也不会干等一片空白。
- **全网平均分对比**：每次提交都会入库（命中反作弊的记录不计入），结果页展示「你 vs 全网平均」双条对比、差值徽标与「击败了 X% 的参与者」；开始页也会显示参与人次与平均分。
- **断点续答 + 回看上次结果**（本机存档，不依赖账号）：
  - 答到一半关掉网页，下次打开开始页会出现「**未完成的测试**」卡片（已答 N / 共 M 题 + 进度条），点「继续答题」回到原题原选项原进度；
  - 测完一次后，下次打开开始页会出现「**上次的结果**」卡片（分数 + 称号 + 时间），点「查看结果」直接重看那一份完整报告，**不会重新提交、不会污染全网统计**；
  - 两张卡片各有「✕」可单独清除；有未完成进度时主按钮会改叫「**开始新的一局**」，点了就等于放弃旧进度。
- **文案偏搞笑风**，等级称号与评语均为段子向。

## 本机存档（localStorage）

| 键 | 内容 | 生命周期 |
|---|---|---|
| `mq.progress.v1` | 本轮题集、已选项、当前题序、已用作答时长、每题停留时长（`timings`） | 7 天过期；答完题清空 |
| `mq.lastResult.v1` | 上一次 `/api/submit` 的响应（含本机算出的 `stability`）+ 当时那套题 | 长期保留，直到手动清除或被下一次结果覆盖 |

要点：

- **只写本机、不上传**。两个键里没有任何 `author_answer` —— 存的题目来自 `/api/questions`、结果来自 `/api/submit`，这两个接口本来就不返回作者答案，所以即便被本机用户翻出来也拿不到答案键。
- **隐私模式 / 禁用存储时静默降级**：`lsRead/lsWrite/lsRemove` 全部包了 `try/catch`，storage 不可用时只是没有续答与回看，作答流程不受影响。
- **存档带版本号**（`SAVE_VERSION`）。改动存档字段结构时把它 +1，旧存档会被自动忽略，不必写迁移逻辑。
- **回看历史结果时必须用「当时那套题」渲染**：结果页要把选项字母还原成文案（`fmtUserAnswer`），而开始页会预抽一套新题。因此结果存档里连 `questions` 一起存，并用 `state.resultQuestions` 作为查找源 —— 否则回看时整列「你的选择」会显示成「—」。
- **续答时只复原「真正用于作答的时间」**（`elapsedMs`），中途离开的几小时不计入 `durationMs`，否则反作弊的 `too-fast` 判定会被撑大而永远失效。
- **`state.quizActive` 是存档的总开关**：开始页也会预抽题（`state.questions` 非空），所以不能靠「有没有题」来判断是否在作答，否则开始页一刷新就会写出一份 0/N 的假进度。
- **题库接口可能比用户点击更晚返回**：`loadBank()` 里判断了 `!state.quizActive && !state.result` 才重新抽样，否则会把用户手上正在答的题集当场换掉。

## 回答稳定度（结果页模块）

用途：给「这份答案是不是认真答的」一个**可解释的分档**，而不是只丢一句「疑似乱点」。
它只看**作答行为**，不评价答案对错，**全部在本机算**、不上传任何新字段。

三个互不重叠的轴，加权合成 0-100 分（节奏 0.3 / 投入 0.4 / 选择 0.3）：

| 指标 | 数据来源 | 判定 |
|---|---|---|
| **节奏平稳** | 每题停留时长的变异系数（n≥8 时掐掉最快/最慢各一道再算） | `100·e^(-max(0, cv-0.3)·1.6)`；平均每题 <1.2s 时上限压到 55（「匀速狂点」不该算平稳） |
| **作答投入** | 平均每题耗时，分段线性 | `0.4s→0`、`1.0s→30`、`1.6s→60`、`2.4s→82`、`3.5s→94`、`≥5s→100`；再按「秒过题占比」打折 |
| **选择变化** | 最长连击 + 答案分散度 | 连击 ≥8 开始扣分；「分散度低」**必须同时「快」才扣分**（见下） |

**两条硬顶**（单项分再好看也压下来）：

- 平均每题 <0.6s → 总分 ≤20；<0.9s → ≤38；
- 全程只有一个答案 → ≤30；八成以上同一项 → ≤48。

分档：**≥85 稳如老狗 / ≥70 踏实作答 / ≥55 略有起伏 / ≥40 有点敷衍 / ≥25 相当可疑 / 其余 基本是乱点**。

### 关键设计：为什么不能只看「选得单调」

39 道符合度题的题干是「我更喜欢 X，而不是 Y」，其中 27 道作者答案是「完全符合」、12 道是「完全不符合」——
也就是说，**跟作者越像的人，答案会高度集中在这两个极端值上**。
如果因为「答案集中」就扣分，会把最该拿高分的人判成敷衍。
所以：分散度低**单独不算证据**，必须叠加「答得快」才计入；连击要长到 ≥8 才开始扣。
反过来，**「节奏 + 投入」两项也可能被「慢慢点同一个选项」骗到**（看着很稳很投入），
所以「全程同一答案」必须单独设硬顶，否则这种最典型的敷衍能拿到 70+。

对照测试（离线夹具）：
| 画像 | 结果 |
|---|---|
| 正常作答 3.1s/题、答案多样 | **96 稳如老狗** |
| 认真作答但 8 成选「完全符合」（**误伤测试**） | **96 稳如老狗**，无可疑信号 ✓ |
| 3.1s/题 但全程同一个答案 | **30 相当可疑**（硬顶生效） |
| 1.4s/题 | **63 略有起伏** |
| 0.3s/题 一路点到底 | **20 基本是乱点** |

### 数据从哪来

- **每题停留时长**（`state.timings`）：进入某题时打点，离开时结算并**累加**（回头改答案也算进去）。
  超过 30 分钟的停留视为走神，直接丢弃。
- 用**累加**而不是覆盖，是为了让「回头改一遍」也计入这道题 —— 那同样是花在它上面的时间。
- 续答时 `timings` 一并存进进度档、恢复时读回，否则稳定度会只有后半程的数据。
  万一确实缺（旧存档/长时间离开），模块会补一句「另有 N 题没有用时记录……仅供参考」，**而不是当成可疑信号**。
- **每题用时柱状图**：按最长一题归一，不足 1 秒的标红，缺记录的画一条贴地暗条 —— 哪几题没看，一眼可见。

> 与服务端反作弊的关系：后端只认「连续同选」与「作答过快」两个粗信号（`straight-line` / `too-fast`），
> 命中即进惩罚模式、分析区整体隐藏；稳定度是**更细的用户侧说明**，两者口径刻意对齐
> （「全程同一答案」在两边都会被判掉），但稳定度不参与入库、不影响全网平均分。

## 界面与动效

设计语言：**极简玻璃拟态**（暗色）。所有视觉均来自 `styles.css`，通过 CSS 变量集中控制：

| 变量 | 作用 |
|---|---|
| `--glass` / `--glass-2` / `--glass-3` | 三级玻璃透明度（面板 / 次级 / 内嵌块） |
| `--brd` / `--brd-hi` | 玻璃描边（常态 / 悬停高亮） |
| `--blur` | `backdrop-filter` 模糊半径 |
| `--a1` `--a2` `--a3` | 强调色（靛 → 紫 → 青），用于渐变文字/按钮/进度条 |
| `--ease` / `--ease-soft` / `--snap` | 三档缓动曲线 |

**动效清单**（均可用 `prefers-reduced-motion` 一键关闭）：

> ⚠️ 入场动效大多是「**延迟 + `fill-mode: both`**」写法（`animation: rise .6s var(--ease) .46s both`）。
> 这类写法有两个坑，改样式时注意：
> ① `prefers-reduced-motion` 的降级块**必须连 `animation-delay` 一起清零**，只压 `animation-duration`
> 的话元素仍会在延迟窗口里保持 `opacity: 0`，等于逼着「要减少动效」的用户多等半秒才看到内容；
> ② **由 JS 动态显示的容器不要带 `animation-delay`**（如 `.resume-slot`，它出生时是 `hidden`，
> 由 `renderResume()` 摘掉）。延迟期内 `fill-mode: both` 会把 `opacity` 按在 0 —— 内容明明已在 DOM 里
> 却看不见，动画一跑不起来就是永久不可见。

- 背景：三团极光光晕缓慢漂移（34–50s 交替），叠加内联 SVG 噪点提升质感；
- 屏幕切换：淡入 + 上浮 + 轻微去模糊（`screen-in`）；
- 开始页：标题/正文/芯片/按钮/脚注逐级错峰上浮；渐变标题色相缓慢流动；按钮悬停扫光；
- 答题页：选项逐条错峰入场、悬停右移、选中时左侧强调条弹出 + 圆点发光；进度条带流光 sheen；换题时题干重放动效；
- 计算页：圆环 `stroke-dashoffset` 进度 + 外圈 conic-gradient 扫描光弧（`mask` 抠环）匀速旋转；百分比缓出爬升；五步清单逐条打勾（当前项脉冲）；
- 结果页：分数环「从 0 画到 N」的 `stroke-dashoffset` 动画、分数数字滚动、雷达图整体缩放生长（轴标签随生长淡入）、维度进度条与稳定度指标条错峰生长、汇总卡与各区块逐级入场；
- 反馈：错误提示从底部滑入。

> ⚠️ **动画一律走 `animate()` / `nextFrame()`，不要直接裸用 `requestAnimationFrame`。**
> rAF 在「标签页切到后台」「省电模式」「无头/降帧环境」下会被节流甚至完全停摆。
> 只用 rAF 会把「先设 0、下一帧再赋目标值」的写法永久卡在起点（柱宽恒为 0、雷达多边形恒为 `scale(0)`），
> 更严重的是**依赖它 resolve 的 Promise 会永远挂着** —— 计算页的动画就是这样，会让人卡在过场里看不到结果。
> `animate()` 的做法是 rAF 为主时钟 + `setTimeout` 看门狗（连续 250ms 收不到帧才接管），
> 正常浏览器里看门狗几乎不触发，帧停摆时保证动画照样跑完。

**截图导出兼容**：`html2canvas` 不支持 `backdrop-filter`，因此长图导出时给 `#result-screen` 加 `.capturing` 类，临时提高玻璃不透明度、改为纯色深底 `#0a0c16` 并停掉所有动画，保证导出的 PNG 与屏幕观感一致（`script.js` 中 `downloadResult()` 的 `backgroundColor` 需与此一致）。

## 目录结构

```
matching-quiz/
├── public/                 # ★ 唯一会被发布上线的目录（pages_build_output_dir = "public"）
│   ├── index.html          # 前端页面（开始 / 答题 / 计算中 / 结果 四个视图）
│   ├── styles.css          # 极简玻璃拟态样式 + 全套动效（无外部依赖）
│   ├── script.js           # 前端逻辑（无作者答案；单选自动跳题、符合度题徽标、非量表题选项随机换位、计算过场、回答稳定度、多维雷达、维度剖析、深度报告、反作弊、长图导出、动效钩子）
│   └── vendor/
│       └── html2canvas.min.js  # 本地化的 html2canvas（用于“保存结果长图”，不外链 CDN）
├── functions/              # Pages Functions（不发布为非静态文件，由平台编译执行）
│   └── api/
│       ├── questions.js    # GET  /api/questions  返回题目（id/text/type/options）
│       ├── submit.js       # POST /api/submit    接收字母组合答案、计算分数、记录并统计平均分
│       ├── stats.js        # GET  /api/stats     返回参与人次 / 全网平均分 / 最高分
│       └── _middleware.js  # 可选：CORS / OPTIONS 预检
├── migrations/             # 增量迁移（仅源码，不发布）
│   ├── 001_submissions.sql       # 增量迁移：submissions 表（可对已有线上库安全重复执行）
│   ├── 002_questions_38_58.sql   # 增量迁移：情景题 38-58（幂等 INSERT）
│   ├── 003_questions_likert.sql  # 增量迁移：题型改造（符合度题 + 移除「其他」，按 sort_order UPDATE）
│   └── 004_questions_wording.sql # 增量迁移：题干改为「我更……而不是……」对照写法（幂等 UPDATE text）
├── schema.sql              # D1 建表 + 58 题初始数据（39 符合度题 / 14 多选题 / 5 常规单选；作者答案只在库里，其中 12 道符合度题是反向题）
├── wrangler.toml           # Pages 配置 + D1 绑定
└── README.md
```

> ⚠️ **为什么要有 `public/`**：`schema.sql` 里写着全部 `author_answer`。只要源码目录被当成发布目录（`pages_build_output_dir = "."`），`https://<站点>/schema.sql` 就能被任何人直接下载，答案键当场泄露。把静态资源收进 `public/`、源码留在仓库根目录，是从结构上避免这类泄露——**别再往 `public/` 外面放需要发布的东西，也别把源码放进去**。

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

-- 答题记录表：仅用于聚合统计，不存任何选项内容
CREATE TABLE submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  match_percent INTEGER NOT NULL,             -- 本次匹配度 0-100
  raw_score     INTEGER NOT NULL,
  total         INTEGER NOT NULL,
  level_key     TEXT,
  cheated       INTEGER NOT NULL DEFAULT 0,   -- 命中反作弊的行不计入平均分
  duration_ms   INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

> 注意：第 16 题原始数据作者是单选但答案是 `ABC`，已在 `schema.sql` 中改为 `multiple` 以保持数据合法。

## 题型与题库

| 题型（`type`） | 题数 | 题干 | 选项 | 作者答案 |
|---|---|---|---|---|
| `single`（符合度题） | 39 | 第一人称陈述句，如「我更喜欢辣条，而不是薯片或巧克力。」 | 固定 `["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]` | **27 道为 `A`（完全符合），12 道为 `E`（完全不符合）** |
| `multiple` | 14 | 常规疑问句 | 具体偏好选项（**已无「其他」**） | 字母组合，如 `ABCD` / `A` |
| `single`（常规单选） | 5 | 常规疑问句（第 1 / 14 / 18 / 20 / 37 题） | 具体偏好选项 | 单个字母 |

> 数据层只有 `single` / `multiple` 两种 `type`（受 `CHECK` 约束），「符合度题」是前端依据选项内容识别出的展示形态（见 `script.js` 的 `isScaleQuestion()`），作答与计分仍走 `single` 分支。

### 反向题（为什么不是「全选完全符合」就满分）

原来 39 道符合度题的 `author_answer` 全是 `A`，于是「一路选完全符合」＝满分，
既不认真也能拿最高档。现在把其中 **12 道**（占 31%，接近心理测量学里反向题的常规比例）
翻成反向：作者其实更偏好题面里的**另一个**选项。

- 名单：`sort_order` = **5, 11, 13, 17, 19, 25, 28, 34, 40, 44, 47, 51**（见 `migrations/005_questions_reverse.sql`，幂等）；
  铺在各能出五级题的维度上：吃喝日常 11/25/34、数码科技 5/13/28、生活节奏 17、审美性情 19、处世之道 40/44/47/51。
- **校准（用仓库根的 `_subcheck.mjs` 实测，它直接 import 真实的 `functions/api/submit.js` 配假 D1）**：

  | 作答策略 | 反向题之前 | 反向题之后 |
  |---|---|---|
  | 诚实作答（与作者答案一致） | 100% | **100%** ✓ 不受影响 |
  | 一路点第一个（连文案都不看） | 78%，被判异常 | 57%，**仍被判异常** |
  | 一直选「完全符合」（故意隐去 `pick` 以规避反作弊） | 76% | **55.4%** → 掉出「灵魂同频」档 |
  | 完全随机乱点 | 38.6% | 38.5%（期望 37.6 不变） |

  也就是说：**认真作答的人一分不掉，靠「全选完全符合」混分的人掉 21 分**，
  而随机乱点的基准线完全没变（`DECAY` 的期望值与该选项是不是作者选项无关）。
- 题目本身没有对错，所以反向题不需要任何标记：跟作者像的人自然会在那几道上选「完全不符合」。

### 选项随机换位

除五级符合度题外，其余 19 道题（多选 + 常规单选）的选项**每次抽样都重新打乱显示顺序**。

- 为什么量表题不换：五级题本身就是一套「完全符合 → 完全不符合」的刻度，乱序只会让人每题重新找一遍位置；
  而且想偷懒的人是**按文案**找「完全符合」，换位拦不住他 —— 拦住他的是上面那 12 道反向题。
- 为什么其他题要换：「每次都点第一个」不再等于每次都选同一个东西，也顺带废掉「照着某份答案键的字母位置去点」。
- **实现口径（改这块前务必读）**：`script.js` 里 `q.order` 是「显示位 → 原序下标」的映射；
  `state.answers` 与提交给后端的 `userAnswer` **始终是原序字母**，所以计分、结果页 `fmtUserAnswer` 都不用改。
  界面上印的字母是**显示位**（A/B/C…），元素上另存 `data-letter`（原序）。
  `order` 随题集一起进本机存档，续答时显示顺序不会变。
- **反作弊配套**：换位会让「一路点第一个」产生一串各不相同的原序字母，原来的 straight-line 判定会失效。
  因此前端额外上报 `pick`（用户实际点的**显示位**字母），后端 `detectCheat` 优先用它判定，缺省回退到 `userAnswer`（兼容老客户端）。

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

# 初始化【本地】D1 数据库（执行 schema.sql 的建表与 58 题）
npx wrangler d1 execute matching-quiz-db --local --file=./schema.sql

# 启动本地开发服务器（发布目录 public/ + Functions + 本地 D1）
npx wrangler pages dev public --d1 DB=matching-quiz-db
#   若想显式用 id：--d1 DB=你的database_id
```

打开终端提示的本地地址（通常 http://localhost:8788）即可预览。

> 若你的本地库是更早版本（还没有 `submissions` 表），补跑一次增量迁移即可：
> ```bash
> npx wrangler d1 execute matching-quiz-db --local --file=./migrations/001_submissions.sql
> ```

## 三、部署到 Cloudflare Pages

### 方式 A：连接 Git 仓库（推荐）
1. 把 `matching-quiz/` 推到 GitHub 仓库。
2. Cloudflare 控制台 → **Workers & Pages** → **创建** → **Pages** → 连接 Git 仓库。
3. 构建设置：**Build command** 留空，**Build output directory** 填 `public`。
4. 部署完成后 → **Settings → Bindings → Add → D1 database**：Variable name 填 `DB`，选择 `matching-quiz-db`，保存后**重新部署**。
5. 初始化远程数据库（二选一）：
   - 控制台 **D1** 页面 → 打开 `matching-quiz-db` → 粘贴 `schema.sql` 执行；
   - 或命令行：`npx wrangler d1 execute matching-quiz-db --file=./schema.sql`

### 方式 B：Wrangler 直接部署
```bash
npx wrangler pages deploy public --branch main
# 部署后仍需到控制台绑定 D1（Variable name = DB）并重新部署
```

## 四、API 设计

### GET /api/questions
返回题目（**不含 author_answer**）：
```json
{ "questions": [ { "id": 1, "text": "你喜欢喝什么可乐？", "type": "single", "options": ["A. 可口可乐", "B. 百事可乐", ...] } ] }
```

### POST /api/submit
请求体（`answers` 为**本次抽取的题目子集**——支持「从题库抽样」，无需提交全部题目；`durationMs` 为作答总耗时，用于反作弊）：
```json
{ "durationMs": 186000, "answers": [ { "questionId": 1, "userAnswer": "A" }, { "questionId": 2, "userAnswer": "ABCD" }, { "questionId": 3, "userAnswer": "E" } ] }
```
响应（**绝不包含 `authorAnswer`**；`total` 为本次提交题量，`details` 为本次题目明细，供前端做维度分析）：
```json
{
  "rawScore": 1760,
  "matchPercent": 88,
  "total": 20,
  "level": "灵魂同频，你们很像",
  "levelKey": "high",
  "cheated": false,
  "cheatReasons": [],
  "stats": { "average": 41, "count": 148, "beatPercent": 88 },
  "details": [
    { "questionId": 1, "text": "你喜欢喝什么可乐？", "type": "single", "userAnswer": "A", "score": 100 },
    { "questionId": 3, "text": "我更喜欢的手机是小米，而不是华为或 OPPO。", "type": "single", "userAnswer": "E", "score": 0 }
  ]
}
```

> 反作弊命中时 `cheated=true`，`cheatReasons` 为命中的原因（`straight-line` 连续同选 / `too-fast` 作答过快，判定阈值：平均每题 < 400ms）。

### GET /api/stats
返回全网聚合统计（仅用于展示，**不含任何个人答案**；命中反作弊的记录不计入）：
```json
{ "count": 148, "average": 41, "best": 100 }
```
> `submissions` 表尚未迁移时返回 `{ "count": 0, "average": null, "best": null }`，前端会自动隐藏平均分模块，不影响正常测试。

### 平均分统计说明

- 每次 `POST /api/submit` 都会把结果写入 `submissions`（`match_percent` / `raw_score` / `level_key` / `cheated` / `duration_ms`）。
- **命中反作弊的提交（`cheated=1`）不入平均分**，避免乱点污染均值；但它们仍会入库以便日后排查。
- 写入或统计失败时**静默降级**（`stats: null`），绝不影响正常返回结果。
- `beatPercent` = 全网有效记录中分数低于你的比例。
- 已有线上库升级：只需执行增量迁移，**不要**重跑 `schema.sql`（那会 `DROP` 掉 `questions` 重建）：
  ```bash
  npx wrangler d1 execute matching-quiz-db --remote --file=./migrations/001_submissions.sql
  ```

> 🧹 **计分口径切换（2026-10-02）**：`DECAY` 由 `100/70/45/25/10` 调陡为 `100/55/25/8/0`、阈值由 `90/75/55/35/15` 上调为 `92/78/62/45/25` 时，`submissions` 里按旧口径产生的记录已整体清空（本地留了备份），**全网平均分从 0 人次重新累积**。
>
> ⚠️ **答案键变更（2026-10-02）**：12 道符合度题改为反向题（作者答案 `A` → `E`）也算一次口径变化 —— 同一份作答在新旧答案键下会得到不同的 `match_percent`，所以旧记录与新记录混在一个均值里是不严谨的。这次**没有清空**（当时库里只有 2 条记录，影响很小），若你觉得那个 80% 看着别扭，按下面流程清一次即可。
>
> 这是「一次性的运维动作」，没有被写进 `migrations/`——否则以后按顺序重跑迁移会把新累积的统计又抹掉。若将来再调 `DECAY`，请照做一次：
> ```bash
> # 1) 先备份
> npx wrangler d1 execute matching-quiz-db --remote --command="SELECT * FROM submissions;" --json > submissions_backup.json
> # 2) 再清空
> npx wrangler d1 execute matching-quiz-db --remote --command="DELETE FROM submissions;" --yes
> ```
> 清空后 `/api/stats` 返回 `count: 0`，前端会自动显示「等你第一个」并隐藏平均分对比模块——这是预期行为，不是故障。

> 前端的多维雷达、维度剖析、深度报告均由 `script.js` 依据 `details` 在本地聚合生成（维度分组定义在 `script.js` 的 `DIMENSIONS` 常量里，可自行调整）。

## 五、安全设计说明

- **前端零答案**：`script.js` 中不存在任何 `author_answer` 或类似变量；标准答案只存在于 D1。
- **源码不进发布目录**：发布目录是 `public/`（`pages_build_output_dir = "public"`），`schema.sql` / `migrations/` / `README.md` / `wrangler.toml` 都留在仓库根目录，**不会被当成静态文件公开下载**。此前用 `.` 当发布目录时，`/schema.sql` 是可以直接下载到全部 `author_answer` 的——已修正，改动后请顺手回归验证 `/schema.sql` 返回 404。
- **GET /api/questions** 显式只 `SELECT id, text, type, options`，排除 `author_answer`。
- **POST /api/submit** 读取 `author_answer` 后仅用于后端计算，**返回结果中不含作者答案**（只回传每题得分与你的选择）。
- **防注入**：所有数据库查询均使用 `prepare(...).bind(...)` 参数化。
- **输入校验**：`answers` 须为题库的子集（去重、不超过题库总量）；`userAnswer` 必须是大写字母组合；字母须在选项范围内；单选只能 1 个、多选至少 1 个；可选字段 `pick`（用户点的显示位字母，仅用于反作弊）必须是 `A-Z*`。
- **轻度限流**：`submit.js` 内置基于 IP 的 1 分钟 10 次内存速率限制（单实例有效）。
- **平均分只做聚合**：`submissions` 表**不存**用户选了哪些选项、也不存 IP 或任何身份标识，只存分数与耗时；接口只返回平均值/人次/击败比例这类聚合数字。

## 六、匹配度算法（选项距离衰减）

核心思想：**不再是非黑即白的“对 / 错”**，而是按「你选的选项离作者的选项有多远」给分。

把选项字母换算成序号（A=0、B=1、…），定义距离衰减表：

| 距离 | 0（就是作者选项） | 1 | 2 | 3 | 4 | ≥5 |
|---|---|---|---|---|---|---|
| 得分 | **100** | 55 | 25 | 8 | 0 | 0 |

- **单选（`single`，含全部 39 道符合度题）**：直接取「用户选项 ↔ 作者选项」距离对应的分值。
  例：作者选 A，你选 B → 55 分；选 C → 25；选 D → 8；选 E → 0。
- **多选（`multiple`）**：**软 Jaccard**——
  1. 先给每个字母算「亲和度」`a`：与最近作者选项的距离为 0 → `a = 1`，否则 `a = 衰减分 / 100`；
  2. `得分 = round( Σ a(你选的每一项) ÷ |作者选项 ∪ 你的选项| × 100 )`。
  完全命中作者组合 = 100；多选或错选离作者偏好很远的项，会被「并集变大」与「低亲和度」双重稀释。
- 每题得分 0-100，**匹配度百分比 = 各题得分的平均值**（即 `matchPercent = round(Σ得分 / 题数)`）。
- 原始分 `rawScore` = 各题得分之和（满分 `题数 × 100`）。
- 等级（分界线定义在 `submit.js` 的 `tierOf()`，称号文案在 `script.js` 的 `TIERS` 里，可自由改）：
  - 92-100：可以跟作者配了 💍（soulmate）
  - 78-91：灵魂同频 🌟（high）
  - 62-77：半同频选手 🤝（medium）
  - 45-61：熟悉的陌生人 👀（low）
  - 25-44：平行宇宙来客 🛸（stranger）
  - 0-24：作者看了陷入沉默 🤐（none）

> 📐 **标定口径**：五级符合度题「闭着眼乱点」的期望分 = `(100+55+25+8+0)/5 = **37.6**`，落在「平行宇宙来客」档；想要 92+ 基本得几乎条条命中。阈值（92/78/62/45/25）与 `DECAY` 是一起标定的——改其中一个就要回头核对另一个，否则会出现「乱点也能拿中等档」的失真。

## 七、维度分组（结果页分析用，共七维）

| 维度 | 题目 id |
|---|---|
| 🍜 吃喝日常 | 1, 4, 11, 20, 21, 22, 23, 24, 25, 34, 35 |
| 💻 数码科技 | 3, 5, 12, 13, 26, 27, 28, 29, 30, 31, 32 |
| 🎮 游戏娱乐 | 2, 14 |
| 🎬 内容口味 | 6, 7, 15, 16, 33 |
| 🛌 生活节奏 | 8, 10, 17, 36, 37 |
| 🎨 审美性情 | 9, 18, 19 |
| 🧭 处世之道 | 38-58（情景题） |

> 需与 `script.js` 中 `DIMENSIONS` 保持一致（改题号时两处都要改）。

## 八、部署实战踩坑备忘（Cloudflare Pages + D1）

- **Build command 不能填 `npx wrangler deploy`**（那是 Workers 命令，会报 `Missing entry-point`）。控制台又不允许留空，可填 `echo "no build step"`；或干脆用命令行 `wrangler pages deploy public` 直推（本项目即采用此方式）。
- **API Token 必须是通用 Token**（My Profile → API Tokens → Custom token，含 `Cloudflare Pages: Edit`、`D1: Edit`），**不是 R2/S3 凭证**（后者会报 `Invalid access token [9109]`）。
- **首次部署若报 “The Pages project xxx does not exist”**：先 `npx wrangler pages project create <name> --production-branch=main`。
- **灌数据到线上库必须加 `--remote`**：`npx wrangler d1 execute matching-quiz-db --remote --file=./schema.sql`；不加则只写进本地库 `.wrangler/state`，线上仍是空库。
- 用 `wrangler pages deploy` 时，`wrangler.toml` 的 `[[d1_databases]]` 会自动绑定 D1（变量名 `DB`）。
