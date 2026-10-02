// functions/api/submit.js
// POST /api/submit
// 接收用户选项（大写字母组合，如 'A' 或 'ABC'），从 D1 读取作者答案（仅后端），
// 按「选项距离衰减」计算每题得分与整体匹配度后返回结果。
//
// 计分模型（详见下方 scoreQuestion）：
//   距离 = 选项字母序号之差的绝对值；作者选项距离 0 得 100，随后 55 / 25 / 8 / 0，更远为 0。
//   单选：直接取距离对应分值；多选：软 Jaccard（按距离亲和度加权 ÷ 并集大小）。
//
// 安全要点：
//  - 所有数据库查询均使用 prepare(...).bind(...) 参数化，杜绝 SQL 注入。
//  - author_answer 只在后端参与计算，绝不进入返回给前端的任何字段。
//
// 两个与「选项顺序」有关的约定（改动前务必读）：
//  - 39 道符合度题里有 12 道是**反向题**（author_answer = 'E' 完全不符合，见 migrations/005），
//    目的就是让「一路选完全符合」不再等于满分。随机乱选的期望分不受影响（仍是 37.6）。
//  - 非量表题的选项**每次抽样都会随机换位**（前端负责），但提交上来的 userAnswer
//    始终是「原序字母」，所以这里一行都不用改；只有反作弊的 straight-line 判定
//    需要借用前端上报的 pick（显示位字母），见 detectCheat。

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// —— 简单内存速率限制（单实例有效，仅作轻度防护）——
const WINDOW_MS = 60 * 1000; // 统计窗口：1 分钟
const MAX_PER_WINDOW = 10;   // 同一 IP 每分钟最多提交次数
const counters = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const rec = counters.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    counters.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

// —— 单题得分（0-100）：按「选项距离衰减」给非标准选项赋分 ——
//   · 单选：用户选项与作者选项的距离 d → 分值 DECAY[d]（100/55/25/8/0，更远 0）。
//   · 多选：软 Jaccard 相似度 ——
//       先给每个字母算出它相对「最近作者选项」的亲和度 a∈(0,1]（作者选项 a=1，其余按 DECAY/100），
//       得分 = Σ a(用户所选项) ÷ |作者选项 ∪ 用户选项| × 100。
//       完全命中作者组合 = 100；多选/错选较远的项会被并集与低亲和度共同稀释。
//
// 标定说明：五级符合度题（选项完全符合～完全不符合）随机乱选的期望分
//   = (100 + 55 + 25 + 8 + 0) / 5 = 37.6 分（旧表 100/70/45/25/10 的期望是 50 分）。
//   也就是说“闭着眼乱点”只能拿到约 38 分，落在「平行宇宙来客」档，不会白送中等分数。
//   想再陡/再缓，只改这张表即可（记得同步 README 的表格）。
const DECAY = [100, 55, 25, 8, 0]; // 距离 0,1,2,3,4
const DECAY_FAR = 0;               // 距离 ≥ 5

function indexOfLetter(ch) {
  return ch.charCodeAt(0) - 65; // 'A' -> 0
}

function lettersOf(str) {
  return (str || "")
    .split("")
    .filter((c) => /[A-Z]/.test(c))
    .map(indexOfLetter);
}

function decayAt(distance) {
  return distance < DECAY.length ? DECAY[distance] : DECAY_FAR;
}

// 某选项相对作者答案集合的亲和度（0-1）
function affinityOf(index, authorIndexes) {
  let best = Infinity;
  for (const j of authorIndexes) {
    const d = Math.abs(index - j);
    if (d < best) best = d;
  }
  if (!Number.isFinite(best)) return 0;
  return best === 0 ? 1 : decayAt(best) / 100;
}

function scoreQuestion(type, userAnswer, authorAnswer) {
  const authorIdx = lettersOf(authorAnswer);
  const userIdx = lettersOf(userAnswer);
  if (userIdx.length === 0 || authorIdx.length === 0) return 0;

  // 单选：距离衰减
  if (type === "single") {
    return decayAt(Math.abs(userIdx[0] - authorIdx[0]));
  }

  // 多选：软 Jaccard
  const union = new Set([...userIdx, ...authorIdx]).size;
  if (union === 0) return 0;
  let credit = 0;
  for (const i of userIdx) credit += affinityOf(i, authorIdx);
  return Math.max(0, Math.min(100, Math.round((credit / union) * 100)));
}

// 等级判定（含 92+ 的“可以跟作者配了”档）
// 阈值随 DECAY 一起上调：随机乱选的期望分已从 50 降到 37.6，
// 若不抬高下沿（15→25 / 35→45），乱点也会落进「差异较大」档，称号就没有区分度了。
function tierOf(percent) {
  if (percent >= 92) return { level: "可以跟作者配了", levelKey: "soulmate" };
  if (percent >= 78) return { level: "灵魂同频，你们很像", levelKey: "high" };
  if (percent >= 62) return { level: "高度匹配，默契不错", levelKey: "medium" };
  if (percent >= 45) return { level: "差异较大，但可能互补", levelKey: "low" };
  if (percent >= 25) return { level: "平行宇宙来客", levelKey: "stranger" };
  return { level: "完全不同频，两个世界", levelKey: "none" };
}

// —— 反作弊：检出明显“没认真作答”的答题模式 ——
//   1) straight-line：所有题目选了完全相同的答案
//        · 前端对「非量表题」的选项做了随机换位，所以「一路点第一个」会产生一串各不相同的
//          原序字母；因此用户实际点的「显示位」由前端额外上报在 pick 字段里，
//          这里优先用 pick 判定（缺省时回退到 userAnswer，兼容老客户端）。
//   2) too-fast：平均每题作答时间过短（疑似连点/脚本）
// 返回命中的原因数组，空数组表示正常。
function detectCheat(answers, durationMs, total) {
  const reasons = [];
  const strs = answers.map((a) => a.pick || a.userAnswer);
  if (new Set(strs).size === 1) reasons.push("straight-line");
  if (Number.isFinite(durationMs) && durationMs > 0 && durationMs / total < 400) {
    reasons.push("too-fast");
  }
  return reasons;
}

// —— 平均分统计 ——
// 记录本次提交，并返回「全网平均分 / 参与人次 / 击败百分比」。
// 命中反作弊（cheated）的记录仍然入库，但不计入平均分（保证均值不被乱点污染）。
// 任何异常（例如 submissions 表尚未迁移）都静默降级为 null，绝不影响正常返回结果。
async function recordAndStats(env, { matchPercent, rawScore, total, levelKey, cheated, durationMs }) {
  try {
    await env.DB
      .prepare(
        "INSERT INTO submissions (match_percent, raw_score, total, level_key, cheated, duration_ms) " +
          "VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(
        matchPercent,
        rawScore,
        total,
        levelKey,
        cheated ? 1 : 0,
        Number.isFinite(durationMs) && durationMs > 0 ? Math.round(durationMs) : null
      )
      .run();

    const row = await env.DB
      .prepare(
        "SELECT COUNT(*) AS c, AVG(match_percent) AS a, " +
          "SUM(CASE WHEN match_percent < ? THEN 1 ELSE 0 END) AS lower " +
          "FROM submissions WHERE cheated = 0"
      )
      .bind(matchPercent)
      .first();

    const count = row && row.c ? Number(row.c) : 0;
    if (count === 0) return { average: null, count: 0, beatPercent: null };

    const average = Math.round(Number(row.a));
    const lower = Number(row.lower) || 0;
    const beatPercent = Math.round((lower / count) * 100);
    return { average, count, beatPercent };
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  // 1) 速率限制
  const ip = request.headers.get("cf-connecting-ip") || "local";
  if (isRateLimited(ip)) {
    return json({ error: "提交过于频繁，请稍后再试。" }, 429);
  }

  // 2) 解析请求体
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求体格式错误（需为 JSON）。" }, 400);
  }

  const answers = body && body.answers;
  if (!Array.isArray(answers) || answers.length === 0) {
    return json({ error: "answers 字段必须为非空数组。" }, 400);
  }

  // 3) 读取全部题目（含 author_answer 与 options，仅后端使用）
  let questions;
  try {
    const { results } = await env.DB
      .prepare(
        "SELECT id, text, type, options, author_answer FROM questions ORDER BY sort_order"
      )
      .all();
    questions = results;
  } catch {
    return json({ error: "数据库读取失败。" }, 500);
  }

  const totalBank = questions.length;
  if (totalBank === 0) {
    return json({ error: "题库为空，请先初始化数据库。" }, 500);
  }
  // 支持「从题库抽样」的部分提交：answers 只需是题库的子集（去重、不超总量）。
  if (answers.length > totalBank) {
    return json(
      { error: `答案数量（${answers.length}）超过题库总量（${totalBank}）。` },
      400
    );
  }

  // 4) 校验每题答案（仅校验本次提交的子集）
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const seenIds = new Set();
  for (const a of answers) {
    const qid = a ? Number(a.questionId) : NaN;
    if (!Number.isInteger(qid)) {
      return json({ error: "答案格式非法：questionId 须为整数。" }, 400);
    }
    if (seenIds.has(qid)) {
      return json({ error: `题目 ${qid} 重复提交。` }, 400);
    }
    seenIds.add(qid);
    const q = qMap.get(qid);
    if (!q) {
      return json({ error: `题目不存在：questionId=${qid}` }, 400);
    }
    const ua = a.userAnswer;
    if (typeof ua !== "string" || !/^[A-Z]+$/.test(ua)) {
      return json(
        { error: `答案非法：题目 ${q.id} 的答案须为大写字母组合` },
        400
      );
    }
    // 选项范围校验
    const numOptions = safeParse(q.options, []).length;
    for (const ch of ua) {
      const idx = ch.charCodeAt(0) - 65; // 'A' -> 0
      if (idx < 0 || idx >= numOptions) {
        return json(
          { error: `答案非法：题目 ${q.id} 的选项 ${ch} 超出范围` },
          400
        );
      }
    }
    if (q.type === "single" && ua.length !== 1) {
      return json({ error: `题目 ${q.id} 为单选，只能选一个选项` }, 400);
    }
    if (q.type === "multiple" && ua.length < 1) {
      return json({ error: `题目 ${q.id} 为多选，至少选一个选项` }, 400);
    }
    // 用户自定义文本（仅“其他”选项会带）：只做长度与类型收敛，不参与计分
    if (a.userText != null && typeof a.userText !== "string") {
      return json({ error: `题目 ${q.id} 的自定义文本格式非法` }, 400);
    }
    // 显示位字母（前端换位后用户实际点在第几个位置）：仅用于反作弊判定，可选
    if (a.pick != null && (typeof a.pick !== "string" || !/^[A-Z]*$/.test(a.pick))) {
      return json({ error: `题目 ${q.id} 的 pick 字段格式非法` }, 400);
    }
  }

  // 5) 计算每题得分（仅本次抽取提交的题目，返回明细供前端做维度分析）
  const details = answers.map((a) => {
    const q = qMap.get(Number(a.questionId));
    const detail = {
      questionId: q.id,
      text: q.text,
      type: q.type,
      userAnswer: a.userAnswer, // 如 'A' 或 'ABC'
      score: scoreQuestion(q.type, a.userAnswer, q.author_answer),
    };
    if (a.userText) {
      // 截断，防止异常长文本；仅用于前端展示，不参与计分
      detail.userText = String(a.userText).trim().slice(0, 40);
    }
    return detail;
  });

  const total = details.length; // 本次提交的题量（抽样后的题数），满分 total*100
  const rawScore = details.reduce((s, d) => s + d.score, 0);
  const matchPercent = Math.round(rawScore / total); // 0-100

  const tier = tierOf(matchPercent);

  // 反作弊判定（durationMs 由前端上报，缺省则只做模式判定）
  const durationMs = Number(body.durationMs);
  const cheatReasons = detectCheat(answers, durationMs, total);
  const cheated = cheatReasons.length > 0;

  // 记录提交并统计全网平均分（失败不影响主流程）
  const stats = await recordAndStats(env, {
    matchPercent,
    rawScore,
    total,
    levelKey: tier.levelKey,
    cheated,
    durationMs,
  });

  return json({
    rawScore,
    matchPercent,
    total,
    level: tier.level,
    levelKey: tier.levelKey,
    cheated,
    cheatReasons,
    stats, // { average, count, beatPercent }，表未迁移时为 null
    details, // 全部题目（含每题得分），不含 author_answer
  });
}
