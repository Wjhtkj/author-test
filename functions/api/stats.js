// functions/api/stats.js
// GET /api/stats
// 返回全网统计：参与人次、平均匹配度、最高匹配度。仅聚合数据，不含任何个人答案。
// 命中反作弊（cheated=1）的记录不计入。

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequestGet({ env }) {
  try {
    const row = await env.DB
      .prepare(
        "SELECT COUNT(*) AS count, AVG(match_percent) AS avg, MAX(match_percent) AS max " +
          "FROM submissions WHERE cheated = 0"
      )
      .first();

    const count = row && row.count ? Number(row.count) : 0;
    return json({
      count,
      average: count > 0 ? Math.round(Number(row.avg)) : null,
      best: count > 0 ? Number(row.max) : null,
    });
  } catch {
    // submissions 表尚未创建等情况：静默返回空统计，前端据此隐藏该模块
    return json({ count: 0, average: null, best: null });
  }
}
