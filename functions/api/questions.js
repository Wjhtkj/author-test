// functions/api/questions.js
// GET /api/questions
// 从 D1 读取所有题目，返回 id / text / type / options，绝不返回 author_answer。

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

// 安全解析 options 字段（库里存的是 JSON 字符串）
function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB
      .prepare("SELECT id, text, type, options FROM questions ORDER BY sort_order")
      .all();

    // 把 options 的 JSON 字符串解析成数组再返回，前端可直接使用
    const questions = results.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type, // 'single' | 'multiple'
      options: safeParse(q.options, []),
    }));

    return json({ questions });
  } catch (err) {
    return json({ error: "读取题目失败，请稍后重试。" }, 500);
  }
}
