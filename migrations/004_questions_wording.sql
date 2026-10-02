-- 004_questions_wording.sql
-- 题干改写：把 39 道符合度题的陈述句改成「我更……而不是……」式对照写法，
--           让每题测的是哪个偏好点更具体、更好判断。
-- 幂等：只改 text，按 sort_order 定位；选项、type、author_answer 一律不动。
-- 应用：wrangler d1 execute matching-quiz-db --remote --file=migrations/004_questions_wording.sql

UPDATE questions SET text='我更喜欢小米，而不是华为或 OPPO。' WHERE sort_order=3;
UPDATE questions SET text='我更喜欢白开水，而不是奶茶或咖啡。' WHERE sort_order=4;
UPDATE questions SET text='我更喜欢用 QQ，而不是微信。' WHERE sort_order=5;
UPDATE questions SET text='出门时我更愿意骑车，而不是坐公交地铁。' WHERE sort_order=8;
UPDATE questions SET text='我更倾向于不养宠物，而不是养猫养狗。' WHERE sort_order=9;
UPDATE questions SET text='我更喜欢辣条，而不是薯片或巧克力。' WHERE sort_order=11;
UPDATE questions SET text='我更喜欢用 Android，而不是 iOS。' WHERE sort_order=13;
UPDATE questions SET text='旅行时我更喜欢冒险，而不是城市观光。' WHERE sort_order=17;
UPDATE questions SET text='我更喜欢黑色，而不是白色。' WHERE sort_order=19;
UPDATE questions SET text='我更喜欢美式，而不是拿铁。' WHERE sort_order=21;
UPDATE questions SET text='我更喜欢火鸡面，而不是红烧牛肉面。' WHERE sort_order=23;
UPDATE questions SET text='我更喜欢黄瓜味薯片，而不是原味薯片。' WHERE sort_order=25;
UPDATE questions SET text='我更喜欢用 Edge，而不是 Chrome。' WHERE sort_order=26;
UPDATE questions SET text='我更倾向于用系统自带输入法，而不是搜狗。' WHERE sort_order=27;
UPDATE questions SET text='充电时我更偏好有线快充，而不是无线充电。' WHERE sort_order=28;
UPDATE questions SET text='我更偏好入耳式耳机，而不是头戴式。' WHERE sort_order=29;
UPDATE questions SET text='我的电脑更常用 Windows，而不是 macOS。' WHERE sort_order=30;
UPDATE questions SET text='我更常拿包子豆浆当早餐，而不是面包牛奶。' WHERE sort_order=34;
UPDATE questions SET text='我更习惯侧卧睡觉，而不是仰卧。' WHERE sort_order=36;
UPDATE questions SET text='朋友临时约我出门，我更喜欢直接答应，而不是在家休息。' WHERE sort_order=38;
UPDATE questions SET text='朋友迟到 20 分钟，我更喜欢直接抱怨，而不是憋着不说。' WHERE sort_order=40;
UPDATE questions SET text='群里发消息没人回，我更倾向于等别人主动，而不是追着问。' WHERE sort_order=41;
UPDATE questions SET text='朋友做了我不认同的决定，我更倾向于尊重对方、不插嘴，而不是直接说教。' WHERE sort_order=42;
UPDATE questions SET text='团队里有人一直不干活，我更倾向于直接指出，而不是自己默默多做。' WHERE sort_order=43;
UPDATE questions SET text='一个人旅行迷路了，我更倾向于打开地图自己找，而不是马上问人。' WHERE sort_order=44;
UPDATE questions SET text='买了又贵又不实用的东西，我更倾向于去退货，而不是留着吃灰。' WHERE sort_order=45;
UPDATE questions SET text='赶 deadline 时朋友找我倾诉，我更倾向于说明情况、约晚点再聊，而不是放下手头的事。' WHERE sort_order=46;
UPDATE questions SET text='看到和我完全相反的评论，我更倾向于点踩但不评论，而不是上去争。' WHERE sort_order=47;
UPDATE questions SET text='刚认识的人突然沉默，我更倾向于玩手机缓解尴尬，而不是硬找话题。' WHERE sort_order=48;
UPDATE questions SET text='收到不太喜欢的礼物，我更倾向于收下后放着，而不是当场说实话。' WHERE sort_order=49;
UPDATE questions SET text='在餐厅吃到很难吃的菜，我更倾向于和朋友吐槽，而不是叫服务员来反馈。' WHERE sort_order=50;
UPDATE questions SET text='自己的观点在小组里是少数时，我更倾向于先听别人说，而不是立刻坚持己见。' WHERE sort_order=51;
UPDATE questions SET text='路上看到有人摔倒，我更倾向于打 120 或报警，而不是直接上前去扶。' WHERE sort_order=52;
UPDATE questions SET text='手机只剩 5% 电又要很久才到家，我更倾向于关掉后台省电，而不是拿最后电量叫车。' WHERE sort_order=53;
UPDATE questions SET text='计划好的旅行突然下雨，我更倾向于待在酒店休息，而不是改成室内行程。' WHERE sort_order=54;
UPDATE questions SET text='朋友发明显是炫耀的朋友圈，我更倾向于直接点赞，而不是心里吐槽。' WHERE sort_order=55;
UPDATE questions SET text='被分配到不擅长的任务，我更倾向于跟负责人说明换人，而不是硬着头皮做。' WHERE sort_order=56;
UPDATE questions SET text='公共场合有人外放很大声，我更倾向于忍一会儿，而不是上前提醒。' WHERE sort_order=57;
UPDATE questions SET text='半夜突然想吃东西，我更倾向于点外卖，而不是自己煮泡面。' WHERE sort_order=58;

-- 自检：应输出 39（改写题数）
SELECT SUM(CASE WHEN instr(text, '而不是') > 0 THEN 1 ELSE 0 END) AS reworded FROM questions;
