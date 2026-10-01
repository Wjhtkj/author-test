// functions/api/_middleware.js
// 为 /api/* 下的所有请求统一添加 CORS 头，并处理 OPTIONS 预检。
// 同源部署（前端与 Functions 同一域名）时其实不需要 CORS，
// 这里保留以便本地联调或将来跨域调用。

const ALLOW_ORIGIN = "*";

export async function onRequest(context) {
  const { request, next } = context;

  // 处理预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const response = await next();

  // 给后续响应补上 CORS 头
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders())) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
