-- 追加情景题 38-58（一次性迁移）
-- 前提：已执行过 schema.sql（包含 1-37 题），并已执行 001_submissions.sql
-- 本文件幂等：若对应 sort_order 已存在则跳过，可重复执行。

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '周末朋友临时约你出门，你原本打算在家休息，你会？', 'single', '["A. 立刻答应，出门玩更重要","B. 犹豫一下，但最后还是去","C. 婉拒，按原计划休息","D. 看是谁约，重要的人就去","E. 其他________"]', 'A', 38
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 38);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '朋友聚会中你通常会做什么？', 'multiple', '["A. 主动聊天","B. 吃东西","C. 玩手机","D. 听别人说","E. 帮忙组织","F. 早退","G. 其他________"]', 'ABC', 39
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 39);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你和朋友约好吃饭，对方迟到 20 分钟，你会？', 'single', '["A. 完全不在意，继续等","B. 有点不爽但不说","C. 直接抱怨","D. 下次不再约","E. 其他________"]', 'C', 40
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 40);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你在群里发消息没人回，你会？', 'single', '["A. 无所谓，继续发","B. 有点尴尬，撤回","C. 私聊问某个人","D. 等别人主动","E. 其他________"]', 'D', 41
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 41);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你发现朋友做了你不太认同的决定，你会？', 'single', '["A. 直接说出自己的看法","B. 委婉提醒","C. 尊重对方，不插嘴","D. 先观察再说","E. 其他________"]', 'C', 42
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 42);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '团队合作时有人一直不干活，你会？', 'single', '["A. 直接指出","B. 私下提醒","C. 自己多做一点","D. 告诉负责人","E. 其他________"]', 'A', 43
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 43);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你一个人去旅行，途中迷路了，你会？', 'single', '["A. 打开地图自己找","B. 问路人","C. 打车直接去目的地","D. 先找地方坐下冷静","E. 其他________"]', 'A', 44
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 44);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你买了一件很贵但不太实用的东西，回家后后悔了，你会？', 'single', '["A. 退货","B. 挂二手平台卖掉","C. 留着，说不定以后用得上","D. 送人","E. 其他________"]', 'A', 45
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 45);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你正在赶一个重要 deadline，朋友突然找你倾诉，你会？', 'single', '["A. 放下工作先听他说","B. 边工作边敷衍回应","C. 说明情况，约晚点再聊","D. 直接不回","E. 其他________"]', 'C', 46
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 46);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你在网上看到一条和你观点完全相反的评论，你会？', 'single', '["A. 直接回复反驳","B. 点踩但不评论","C. 划走不看","D. 截图发给朋友吐槽","E. 其他________"]', 'B', 47
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 47);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你和一个刚认识的人聊天，对方突然沉默了，你会？', 'single', '["A. 主动找话题","B. 也沉默，等对方开口","C. 找借口离开","D. 玩手机缓解尴尬","E. 其他________"]', 'D', 48
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 48);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你收到一份不太喜欢的礼物，你会？', 'single', '["A. 假装很喜欢","B. 诚实说不太适合","C. 收下后放着","D. 转送给别人","E. 其他________"]', 'C', 49
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 49);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你在餐厅吃到一道很难吃的菜，你会？', 'single', '["A. 叫服务员反馈","B. 默默吃完","C. 和朋友吐槽","D. 下次不来","E. 其他________"]', 'C', 50
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 50);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你发现自己的观点在小组里是少数，你会？', 'single', '["A. 坚持表达","B. 先听别人说","C. 随大流","D. 保持沉默","E. 其他________"]', 'B', 51
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 51);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你在路上看到有人摔倒，你会？', 'single', '["A. 立刻上前帮忙","B. 先观察有没有人帮","C. 打 120 / 报警","D. 假装没看见","E. 其他________"]', 'C', 52
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 52);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你的手机只剩 5% 电，但还要很久才能到家，你会？', 'single', '["A. 关掉所有后台省电","B. 赶紧用最后电量叫车","C. 找附近充电宝","D. 不管，没电就没电","E. 其他________"]', 'A', 53
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 53);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你计划好的旅行突然下雨，你会？', 'single', '["A. 按原计划出门","B. 改成室内活动","C. 待在酒店休息","D. 提前回家","E. 其他________"]', 'C', 54
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 54);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你看到朋友发了一条明显是炫耀的朋友圈，你会？', 'single', '["A. 点赞","B. 评论夸一句","C. 划走","D. 截图吐槽","E. 其他________"]', 'A', 55
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 55);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你被分配到一个不擅长的任务，你会？', 'single', '["A. 硬着头皮做","B. 找人帮忙","C. 跟负责人说明换人","D. 先学再做","E. 其他________"]', 'C', 56
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 56);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你在公共场合听到别人外放很大声，你会？', 'single', '["A. 直接提醒","B. 找工作人员","C. 忍一会儿","D. 换位置","E. 其他________"]', 'C', 57
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 57);

INSERT INTO questions (text, type, options, author_answer, sort_order)
SELECT '你半夜突然想吃东西，你会？', 'single', '["A. 点外卖","B. 自己煮 / 泡面","C. 忍到早上","D. 喝水继续睡","E. 其他________"]', 'A', 58
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE sort_order = 58);
