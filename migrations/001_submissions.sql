-- 迁移 001：新增 submissions 表，用于统计「全网平均分」
-- 说明：本文件为「增量迁移」，可在已有线上库上安全重复执行（IF NOT EXISTS）。
--       初始化全新数据库请直接用根目录的 schema.sql（已包含本表）。

CREATE TABLE IF NOT EXISTS submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  match_percent INTEGER NOT NULL,               -- 本次匹配度（0-100）
  raw_score     INTEGER NOT NULL,               -- 原始得分
  total         INTEGER NOT NULL,               -- 题目数量
  level_key     TEXT,                           -- 等级标识（soulmate/high/...）
  cheated       INTEGER NOT NULL DEFAULT 0,     -- 是否命中反作弊（1 不计入平均分）
  duration_ms   INTEGER,                        -- 作答总时长（毫秒）
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 统计查询主要按 cheated 过滤，建个索引
CREATE INDEX IF NOT EXISTS idx_submissions_cheated ON submissions (cheated);
