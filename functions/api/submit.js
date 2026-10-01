// functions/api/submit.js
// POST /api/submit
// 接收用户选项（大写字母组合，如 'A' 或 'ABC'），从 D1 读取作者答案（仅后端），
// 按「单选完全匹配 / 多选 Jaccard 相似度」计算匹配度后返回结果。
//
// 安全要点：
//  - 所有数据库查询均使用 prepare(...).bind(...) 参数化，杜绝 SQL 注入。
//  - author_answer 只在后端参与计算，默认不进入前端（见 EXPOSE_AUTHOR_IN_BREAKDOWN）。

// 若设为 true，结果明细中会附带作者答案（最多 6 题），方便前端展示“你的选择 vs 作者选择”。
// 若想更严格地保密，可改为 false，前端将只展示你自己的选择与得分。
const EXPOSE_AUTHOR_IN_BREAKDOWN = true;

// —— 简单内存速率限制（单实例有效，仅作轻度防护）——
const WINDOW_MS = 60 * 1000;   // 统计窗口：1 分钟
const MAX_PER_WINDOW = 10;     // 同一 IP 每分钟最多提交次数
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

// 单题得分（0-100）
//  单选：用户选项与作者完全一致得 100，否则 0（二值）。
//  多选：用 Jaccard 相似度 = |交集| / |并集|，范围 0-100，部分重合给部分分。
function scoreQuestion(type, userAnswer, authorAnswer) {
  const authorSet = new Set(
    (authorAnswer || "").split("").filter((c) => /[A-Z]/.test(c))
  );
  const userSet = new Set(
    (userAnswer || "").split("").filter((c) => /[A-Z]/.test(c))
  );

  if (type === "single") {
    const u = [...userSet][0] || "";
    const a = [...authorSet][0] || "";
    return u === a ? 100 : 0;
  }

  // 多选：Jaccard
  if (userSet.size === 0 || authorSet.size === 0) return 0;
  let inter = 0;
  for (const x of userSet) if (authorSet.has(x)) inter++;
  const union = new Set([...authorSet, ...userSet]).size;
  return Math.round((inter / union) * 100);
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
  if (!Array.isArray(answers)) {
    return json({ error: "answers 字段必须为数组。" }, 400);
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

  const total = questions.length;
  if (total === 0) {
    return json({ error: "题库为空，请先初始化数据库。" }, 500);
  }
  if (answers.length !== total) {
    return json(
      { error: `答案数量应为 ${total} 题，实际收到 ${answers.length} 题。` },
      400
    );
  }

  // 4) 校验每题答案
  const qMap = new Map(questions.map((q) => [q.id, q]));
  for (const a of answers) {
    const q = qMap.get(a.questionId);
    if (!q) {
      return json({ error: `题目不存在：questionId=${a.questionId}` }, 400);
    }
    const ua = a.userAnswer;
    if (typeof ua !== "string" || !/^[A-Z]+$/.test(ua)) {
      return json(
        { error: `答案非法：题目 ${q.id} 的答案须为大写字母组合` },
        400
      );
    }
    // 选项范围校验
    let numOptions = 0;
    try {
      numOptions = safeParse(q.options, []).length;
    } catch {}
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
  }

  // 5) 计算每题得分并汇总
  let rawScore = 0;
  const details = [];
  for (const a of answers) {
    const q = qMap.get(a.questionId);
    const score = scoreQuestion(q.type, a.userAnswer, q.author_answer);
    rawScore += score;
    const detail = {
      questionId: a.questionId,
      text: q.text,
      userAnswer: a.userAnswer, // 如 'A' 或 'ABC'
      score,
    };
    if (EXPOSE_AUTHOR_IN_BREAKDOWN) {
      detail.authorAnswer = q.author_answer;
    }
    details.push(detail);
  }

  // 每题满分 100，matchPercent = 各题均值
  const matchPercent = Math.round(rawScore / total);

  // 6) 等级判定
  let level, levelKey;
  if (matchPercent >= 85) { level = "灵魂同频，你们很像"; levelKey = "soulmate"; }
  else if (matchPercent >= 70) { level = "高度匹配，默契不错"; levelKey = "high"; }
  else if (matchPercent >= 50) { level = "中等匹配，有同有异"; levelKey = "medium"; }
  else if (matchPercent >= 30) { level = "差异较大，但可能互补"; levelKey = "low"; }
  else { level = "完全不同频，两个世界"; levelKey = "none"; }

  // 7) 最一致 3 题（得分降序）与差异最大 3 题（得分升序）
  const byScoreDesc = [...details].sort((x, y) => y.score - x.score);
  const byScoreAsc = [...details].sort((x, y) => x.score - y.score);
  const topMatches = byScoreDesc.slice(0, 3);
  const topDifferences = byScoreAsc.slice(0, 3);

  return json({
    rawScore, // 各题得分之和（满分 total*100）
    matchPercent, // 0-100
    total,
    level,
    levelKey,
    topMatches,
    topDifferences,
  });
}
