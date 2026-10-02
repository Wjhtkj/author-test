-- 你与作者的匹配度测试 - D1 数据库初始化脚本
-- 共 58 题，两种题型：
--   1) single   —— 单选。其中「符合度题」的选项固定为
--                  ["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]，
--                  题干为陈述句（第一人称描述一种习惯/偏好），作者答案恒为 'A'（完全符合）。
--   2) multiple —— 多选。选项为具体偏好，作者答案为字母组合（如 'ABCD'）。
--
-- 计分（后端 functions/api/submit.js 实现）：按「选项距离衰减」给非标准选项赋分
--   距离 0（作者选项）= 100，此后依次 70 / 45 / 25 / 10，更远按 5 计。
--   单选：直接取距离对应分值。
--   多选：软 Jaccard —— 用户所选项按各自亲和度加权求和 ÷ 并集大小 × 100。
--
-- 说明：选项 options 以 JSON 数组字符串存储；author_answer 为「大写字母组合」字符串。
--       全库已无「其他________」填空项，作者答案只在后端参与计算，绝不返回前端。

DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS submissions;

CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'multiple')),
  options TEXT NOT NULL,
  author_answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 答题记录表：用于统计「全网平均分」（cheated=1 的记录不计入平均分）
CREATE TABLE submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  match_percent INTEGER NOT NULL,
  raw_score     INTEGER NOT NULL,
  total         INTEGER NOT NULL,
  level_key     TEXT,
  cheated       INTEGER NOT NULL DEFAULT 0,
  duration_ms   INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_submissions_cheated ON submissions (cheated);

-- ============================================================
-- 一、偏好题（1-37）
-- ============================================================

-- 1（保留原选项；「其他可乐」是具体选项，不是填空项）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你喜欢喝什么可乐？', 'single', '["A. 可口可乐","B. 百事可乐","C. 其他可乐","D. 不喝可乐"]', 'A', 1);

-- 2（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你会玩什么游戏？', 'multiple', '["A. 蔚蓝档案","B. MC（Java）","C. 红警","D. 元气骑士","E. 瓦","F. 王者","G. 地平线","H. 生化危机"]', 'ABCD', 2);

-- 3（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更喜欢小米，而不是华为或 OPPO。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 3);

-- 4（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更喜欢白开水，而不是奶茶或咖啡。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 4);

-- 5（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更喜欢用 QQ，而不是微信。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 5);

-- 6（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更常看哪种视频内容？', 'multiple', '["A. 动漫","B. 电影","C. 电视剧","D. 纪录片","E. 综艺","F. 游戏直播","G. 短视频"]', 'G', 6);

-- 7（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你最喜欢的音乐类型？', 'multiple', '["A. 流行","B. 摇滚","C. 民谣","D. 说唱","E. 电子","F. 古典","G. 爵士"]', 'ABE', 7);

-- 8（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('出门时我更愿意骑车，而不是坐公交地铁。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 8);

-- 9（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更倾向于不养宠物，而不是养猫养狗。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 9);

-- 10（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的运动？', 'multiple', '["A. 跑步","B. 篮球","C. 足球","D. 羽毛球","E. 乒乓球","F. 游泳","G. 健身","H. 不运动"]', 'F', 10);

-- 11（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更喜欢辣条，而不是薯片或巧克力。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 11);

-- 12（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的编程语言？', 'multiple', '["A. JavaScript","B. Python","C. Java","D. C++","E. Rust","F. Go"]', 'B', 12);

-- 13（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更喜欢用 Android，而不是 iOS。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 13);

-- 14（保留原选项）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的游戏平台？', 'single', '["A. PC","B. 手机","C. 主机","D. 掌机","E. 不玩游戏"]', 'B', 14);

-- 15（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的动漫类型？', 'multiple', '["A. 热血","B. 日常","C. 恋爱","D. 科幻","E. 奇幻","F. 悬疑"]', 'B', 15);

-- 16（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的电影类型？', 'multiple', '["A. 科幻","B. 喜剧","C. 动作","D. 爱情","E. 恐怖","F. 动画"]', 'ABC', 16);

-- 17（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('旅行时我更喜欢冒险，而不是城市观光。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 17);

-- 18（保留原选项）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的天气？', 'single', '["A. 晴天","B. 阴天","C. 雨天","D. 雪天","E. 大风"]', 'A', 18);

-- 19（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更喜欢黑色，而不是白色。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 19);

-- 20（保留原选项）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的茶？', 'single', '["A. 绿茶","B. 红茶","C. 乌龙茶","D. 普洱茶","E. 花茶","F. 不喝茶"]', 'F', 20);

-- 21（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更喜欢美式，而不是拿铁。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 21);

-- 22（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的奶茶品牌？', 'multiple', '["A. 蜜雪冰城","B. 喜茶","C. 奈雪的茶","D. 茶百道","E. 古茗","F. 沪上阿姨","G. 书亦烧仙草","H. CoCo","I. 一点点"]', 'AE', 22);

-- 23（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更喜欢火鸡面，而不是红烧牛肉面。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 23);

-- 24（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的火锅蘸料？', 'multiple', '["A. 麻酱","B. 香油蒜泥","C. 干碟","D. 海鲜酱","E. 沙茶酱","F. 醋","G. 酱油"]', 'BDG', 24);

-- 25（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更喜欢黄瓜味薯片，而不是原味薯片。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 25);

-- 26（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更喜欢用 Edge，而不是 Chrome。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 26);

-- 27（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更倾向于用系统自带输入法，而不是搜狗。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 27);

-- 28（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('充电时我更偏好有线快充，而不是无线充电。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 28);

-- 29（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更偏好入耳式耳机，而不是头戴式。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 29);

-- 30（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我的电脑更常用 Windows，而不是 macOS。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 30);

-- 31（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的编程编辑器？', 'multiple', '["A. VS Code","B. JetBrains 系列","C. Vim","D. Emacs","E. Sublime"]', 'A', 31);

-- 32（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的云服务商？', 'multiple', '["A. AWS","B. Azure","C. Google Cloud","D. 阿里云","E. 腾讯云","F. Cloudflare"]', 'F', 32);

-- 33（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的 B 站分区？', 'multiple', '["A. 动画","B. 番剧","C. 游戏","D. 知识","E. 科技","F. 生活","G. 鬼畜","H. 音乐","I. 舞蹈"]', 'CDEFG', 33);

-- 34（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更常拿包子豆浆当早餐，而不是面包牛奶。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 34);

-- 35（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的夜宵类型？', 'multiple', '["A. 烧烤","B. 小龙虾","C. 炸鸡","D. 泡面","E. 关东煮","F. 螺蛳粉"]', 'D', 35);

-- 36（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('我更习惯侧卧睡觉，而不是仰卧。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 36);

-- 37（保留原选项）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的起床时间？', 'single', '["A. 6点前","B. 6-7点","C. 7-8点","D. 8-9点","E. 9点后","F. 不固定"]', 'F', 37);

-- ============================================================
-- 二、情景题（38-58）：题干改为第一人称陈述句，按符合程度作答
-- ============================================================

-- 38（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('朋友临时约我出门，我更喜欢直接答应，而不是在家休息。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 38);

-- 39（多选，已移除「其他」）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('朋友聚会中你通常会做什么？', 'multiple', '["A. 主动聊天","B. 吃东西","C. 玩手机","D. 听别人说","E. 帮忙组织","F. 早退"]', 'ABC', 39);

-- 40（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('朋友迟到 20 分钟，我更喜欢直接抱怨，而不是憋着不说。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 40);

-- 41（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('群里发消息没人回，我更倾向于等别人主动，而不是追着问。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 41);

-- 42（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('朋友做了我不认同的决定，我更倾向于尊重对方、不插嘴，而不是直接说教。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 42);

-- 43（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('团队里有人一直不干活，我更倾向于直接指出，而不是自己默默多做。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 43);

-- 44（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('一个人旅行迷路了，我更倾向于打开地图自己找，而不是马上问人。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 44);

-- 45（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('买了又贵又不实用的东西，我更倾向于去退货，而不是留着吃灰。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 45);

-- 46（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('赶 deadline 时朋友找我倾诉，我更倾向于说明情况、约晚点再聊，而不是放下手头的事。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 46);

-- 47（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('看到和我完全相反的评论，我更倾向于点踩但不评论，而不是上去争。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 47);

-- 48（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('刚认识的人突然沉默，我更倾向于玩手机缓解尴尬，而不是硬找话题。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 48);

-- 49（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('收到不太喜欢的礼物，我更倾向于收下后放着，而不是当场说实话。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 49);

-- 50（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('在餐厅吃到很难吃的菜，我更倾向于和朋友吐槽，而不是叫服务员来反馈。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 50);

-- 51（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('自己的观点在小组里是少数时，我更倾向于先听别人说，而不是立刻坚持己见。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 51);

-- 52（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('路上看到有人摔倒，我更倾向于打 120 或报警，而不是直接上前去扶。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 52);

-- 53（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('手机只剩 5% 电又要很久才到家，我更倾向于关掉后台省电，而不是拿最后电量叫车。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 53);

-- 54（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('计划好的旅行突然下雨，我更倾向于待在酒店休息，而不是改成室内行程。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 54);

-- 55（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('朋友发明显是炫耀的朋友圈，我更倾向于直接点赞，而不是心里吐槽。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 55);

-- 56（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('被分配到不擅长的任务，我更倾向于跟负责人说明换人，而不是硬着头皮做。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 56);

-- 57（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('公共场合有人外放很大声，我更倾向于忍一会儿，而不是上前提醒。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 57);

-- 58（符合度题）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('半夜突然想吃东西，我更倾向于点外卖，而不是自己煮泡面。', 'single', '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', 'A', 58);
