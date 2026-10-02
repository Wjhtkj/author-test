-- 003_questions_likert.sql
-- 题库题型改造（幂等：按 sort_order 定位，不新增/不删除行，id 保持稳定）
--   1) 原含「其他________」填空项的单选 → 陈述句 + 五级符合度选项（作者答案恒为 'A'）
--   2) 原含「其他________」填空项的多选 → 移除「其他」选项，其余不变
--   3) 无「其他」的 5 道题（sort_order 1/14/18/20/37）保持原样，不改动
--
-- 应用方式：
--   wrangler d1 execute matching-quiz-db --remote --file=migrations/003_questions_likert.sql

-- ---------- 含「其他」的多选：删除「其他」选项 ----------
UPDATE questions SET options='["A. 蔚蓝档案","B. MC（Java）","C. 红警","D. 元气骑士","E. 瓦","F. 王者","G. 地平线","H. 生化危机"]' WHERE sort_order=2;
UPDATE questions SET options='["A. 动漫","B. 电影","C. 电视剧","D. 纪录片","E. 综艺","F. 游戏直播","G. 短视频"]' WHERE sort_order=6;
UPDATE questions SET options='["A. 流行","B. 摇滚","C. 民谣","D. 说唱","E. 电子","F. 古典","G. 爵士"]' WHERE sort_order=7;
UPDATE questions SET options='["A. 跑步","B. 篮球","C. 足球","D. 羽毛球","E. 乒乓球","F. 游泳","G. 健身","H. 不运动"]' WHERE sort_order=10;
UPDATE questions SET options='["A. JavaScript","B. Python","C. Java","D. C++","E. Rust","F. Go"]' WHERE sort_order=12;
UPDATE questions SET options='["A. 热血","B. 日常","C. 恋爱","D. 科幻","E. 奇幻","F. 悬疑"]' WHERE sort_order=15;
UPDATE questions SET options='["A. 科幻","B. 喜剧","C. 动作","D. 爱情","E. 恐怖","F. 动画"]' WHERE sort_order=16;
UPDATE questions SET options='["A. 蜜雪冰城","B. 喜茶","C. 奈雪的茶","D. 茶百道","E. 古茗","F. 沪上阿姨","G. 书亦烧仙草","H. CoCo","I. 一点点"]' WHERE sort_order=22;
UPDATE questions SET options='["A. 麻酱","B. 香油蒜泥","C. 干碟","D. 海鲜酱","E. 沙茶酱","F. 醋","G. 酱油"]' WHERE sort_order=24;
UPDATE questions SET options='["A. VS Code","B. JetBrains 系列","C. Vim","D. Emacs","E. Sublime"]' WHERE sort_order=31;
UPDATE questions SET options='["A. AWS","B. Azure","C. Google Cloud","D. 阿里云","E. 腾讯云","F. Cloudflare"]' WHERE sort_order=32;
UPDATE questions SET options='["A. 动画","B. 番剧","C. 游戏","D. 知识","E. 科技","F. 生活","G. 鬼畜","H. 音乐","I. 舞蹈"]' WHERE sort_order=33;
UPDATE questions SET options='["A. 烧烤","B. 小龙虾","C. 炸鸡","D. 泡面","E. 关东煮","F. 螺蛳粉"]' WHERE sort_order=35;
UPDATE questions SET options='["A. 主动聊天","B. 吃东西","C. 玩手机","D. 听别人说","E. 帮忙组织","F. 早退"]' WHERE sort_order=39;

-- ---------- 含「其他」的单选：改编为陈述句 + 五级符合度 ----------
UPDATE questions SET text='我最想用的手机品牌是小米。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=3;
UPDATE questions SET text='我平时最常喝的饮料是白开水。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=4;
UPDATE questions SET text='我最常用的社交平台是 QQ。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=5;
UPDATE questions SET text='出门时我更愿意选择骑行。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=8;
UPDATE questions SET text='比起养宠物，我更倾向于不养。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=9;
UPDATE questions SET text='我最喜欢的零食是辣条。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=11;
UPDATE questions SET text='我手机常用的系统是 Android。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=13;
UPDATE questions SET text='旅行时我更喜欢冒险型的玩法。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=17;
UPDATE questions SET text='我最喜欢的颜色是黑色。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=19;
UPDATE questions SET text='我常喝的咖啡是美式。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=21;
UPDATE questions SET text='我最喜欢的方便面口味是火鸡面。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=23;
UPDATE questions SET text='我最喜欢的薯片口味是黄瓜味。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=25;
UPDATE questions SET text='我最常用的浏览器是 Edge。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=26;
UPDATE questions SET text='我更常用系统自带的输入法。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=27;
UPDATE questions SET text='充电时我更偏好有线快充。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=28;
UPDATE questions SET text='我更偏好入耳式耳机。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=29;
UPDATE questions SET text='我的电脑常用 Windows。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=30;
UPDATE questions SET text='我最常吃的早餐是包子配豆浆。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=34;
UPDATE questions SET text='我习惯侧卧睡觉。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=36;

-- ---------- 情景题 38-58：改编为陈述句 + 五级符合度（39 为多选，仅移除「其他」）----------
UPDATE questions SET text='周末朋友临时约我出门，我会立刻答应——出门玩更重要。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=38;
UPDATE questions SET text='朋友迟到 20 分钟，我会直接抱怨。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=40;
UPDATE questions SET text='群里发消息没人回，我会等别人主动。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=41;
UPDATE questions SET text='朋友做了我不太认同的决定，我会尊重对方、不插嘴。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=42;
UPDATE questions SET text='团队合作时有人一直不干活，我会直接指出。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=43;
UPDATE questions SET text='一个人旅行迷路时，我会打开地图自己找。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=44;
UPDATE questions SET text='买了又贵又不实用的东西后，我会去退货。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=45;
UPDATE questions SET text='赶 deadline 时朋友找我倾诉，我会说明情况、约晚点再聊。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=46;
UPDATE questions SET text='看到和我观点完全相反的评论，我会点踩但不评论。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=47;
UPDATE questions SET text='刚认识的人突然沉默时，我会玩手机缓解尴尬。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=48;
UPDATE questions SET text='收到不太喜欢的礼物，我会收下后放着。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=49;
UPDATE questions SET text='在餐厅吃到很难吃的菜，我会和朋友吐槽。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=50;
UPDATE questions SET text='发现自己的观点在小组里是少数时，我会先听别人说。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=51;
UPDATE questions SET text='路上看到有人摔倒，我会打 120 或报警。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=52;
UPDATE questions SET text='手机只剩 5% 电时，我会关掉所有后台省电。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=53;
UPDATE questions SET text='计划好的旅行突然下雨，我会待在酒店休息。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=54;
UPDATE questions SET text='朋友发了一条明显是炫耀的朋友圈，我会点赞。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=55;
UPDATE questions SET text='被分配到不擅长的任务，我会跟负责人说明换人。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=56;
UPDATE questions SET text='公共场合有人外放很大声，我会忍一会儿。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=57;
UPDATE questions SET text='半夜突然想吃东西，我会点外卖。', type='single', options='["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]', author_answer='A' WHERE sort_order=58;

-- ---------- 自检：应输出 total_bank=58、still_has_blank_other=0、likert_count=39、multiples=14 ----------
-- 注意用 instr() 而不是 LIKE '%____%'：SQL 里 `_` 是单字符通配符，会误判全部行。
SELECT COUNT(*) AS total_bank,
       SUM(CASE WHEN instr(options, '____') > 0 THEN 1 ELSE 0 END) AS still_has_blank_other,
       SUM(CASE WHEN options = '["A. 完全符合","B. 比较符合","C. 一般","D. 比较不符合","E. 完全不符合"]' THEN 1 ELSE 0 END) AS likert_count,
       SUM(CASE WHEN type = 'multiple' THEN 1 ELSE 0 END) AS multiples
FROM questions;
