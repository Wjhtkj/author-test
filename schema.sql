-- 你与作者的匹配度测试 - D1 数据库初始化脚本
-- 共 37 题（已去除原第 38 题）
-- 说明：选项 options 以 JSON 数组字符串存储；author_answer 为「大写字母组合」字符串

DROP TABLE IF EXISTS questions;

CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'multiple')),
  options TEXT NOT NULL,
  author_answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 1
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你喜欢喝什么可乐？', 'single', '["A. 可口可乐","B. 百事可乐","C. 其他可乐","D. 不喝可乐"]', 'A', 1);

-- 2
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你会玩什么游戏？', 'multiple', '["A. 蔚蓝档案","B. MC（Java）","C. 红警","D. 元气骑士","E. 瓦","F. 王者","G. 地平线","H. 生化危机","I. 其他________"]', 'ABCD', 2);

-- 3
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你最想使用的手机品牌？', 'single', '["A. 小米","B. 华为","C. OPPO","D. VIVO","E. 其他________"]', 'A', 3);

-- 4
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你平时更常喝哪种饮料？', 'single', '["A. 白开水","B. 茶","C. 咖啡","D. 奶茶","E. 碳酸饮料","F. 果汁","G. 其他________"]', 'A', 4);

-- 5
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更常用哪个社交平台？', 'single', '["A. 微信","B. QQ","C. 微博","D. 小红书","E. 抖音","F. B站","G. 其他________"]', 'B', 5);

-- 6
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更常看哪种视频内容？', 'multiple', '["A. 动漫","B. 电影","C. 电视剧","D. 纪录片","E. 综艺","F. 游戏直播","G. 短视频","H. 其他________"]', 'G', 6);

-- 7
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你最喜欢的音乐类型？', 'multiple', '["A. 流行","B. 摇滚","C. 民谣","D. 说唱","E. 电子","F. 古典","G. 爵士","H. 其他________"]', 'ABE', 7);

-- 8
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更倾向于哪种出行方式？', 'single', '["A. 公交 / 地铁","B. 打车","C. 自驾","D. 骑行","E. 步行","F. 其他________"]', 'D', 8);

-- 9
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的宠物？', 'single', '["A. 猫","B. 狗","C. 鸟","D. 鱼","E. 爬宠","F. 不养宠物","G. 其他________"]', 'F', 9);

-- 10
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的运动？', 'multiple', '["A. 跑步","B. 篮球","C. 足球","D. 羽毛球","E. 乒乓球","F. 游泳","G. 健身","H. 不运动","I. 其他________"]', 'F', 10);

-- 11
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的零食？', 'single', '["A. 薯片","B. 巧克力","C. 辣条","D. 坚果","E. 饼干","F. 糖果","G. 其他________"]', 'C', 11);

-- 12
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的编程语言？', 'multiple', '["A. JavaScript","B. Python","C. Java","D. C++","E. Rust","F. Go","G. 其他________"]', 'B', 12);

-- 13
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更常用的操作系统？', 'single', '["A. Windows","B. macOS","C. Linux","D. Android","E. iOS","F. 其他________"]', 'D', 13);

-- 14
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的游戏平台？', 'single', '["A. PC","B. 手机","C. 主机","D. 掌机","E. 不玩游戏"]', 'B', 14);

-- 15
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的动漫类型？', 'multiple', '["A. 热血","B. 日常","C. 恋爱","D. 科幻","E. 奇幻","F. 悬疑","G. 其他________"]', 'B', 15);

-- 16（注意：原为单选，但作者答案为 ABC；此处改为 multiple 以保持数据合法）
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的电影类型？', 'multiple', '["A. 科幻","B. 喜剧","C. 动作","D. 爱情","E. 恐怖","F. 动画","G. 其他________"]', 'ABC', 16);

-- 17
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的旅行方式？', 'single', '["A. 自然风光","B. 城市观光","C. 历史人文","D. 美食之旅","E. 购物","F. 冒险","G. 其他________"]', 'F', 17);

-- 18
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的天气？', 'single', '["A. 晴天","B. 阴天","C. 雨天","D. 雪天","E. 大风"]', 'A', 18);

-- 19
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的颜色？', 'single', '["A. 红","B. 橙","C. 黄","D. 绿","E. 蓝","F. 紫","G. 黑","H. 白","I. 其他________"]', 'G', 19);

-- 20
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的茶？', 'single', '["A. 绿茶","B. 红茶","C. 乌龙茶","D. 普洱茶","E. 花茶","F. 不喝茶"]', 'F', 20);

-- 21
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更常喝哪种咖啡？', 'single', '["A. 美式","B. 拿铁","C. 卡布奇诺","D. 摩卡","E. 浓缩","F. 速溶","G. 不喝咖啡","H. 其他________"]', 'A', 21);

-- 22
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的奶茶品牌？', 'multiple', '["A. 蜜雪冰城","B. 喜茶","C. 奈雪的茶","D. 茶百道","E. 古茗","F. 沪上阿姨","G. 书亦烧仙草","H. CoCo","I. 一点点","J. 其他________"]', 'AE', 22);

-- 23
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的方便面口味？', 'single', '["A. 红烧牛肉","B. 老坛酸菜","C. 香辣牛肉","D. 海鲜","E. 番茄鸡蛋","F. 藤椒","G. 火鸡面","H. 其他________"]', 'G', 23);

-- 24
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的火锅蘸料？', 'multiple', '["A. 麻酱","B. 香油蒜泥","C. 干碟","D. 海鲜酱","E. 沙茶酱","F. 醋","G. 酱油","H. 其他________"]', 'BDG', 24);

-- 25
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的薯片口味？', 'single', '["A. 原味","B. 黄瓜味","C. 番茄味","D. 烧烤味","E. 麻辣味","F. 芝士味","G. 其他________"]', 'B', 25);

-- 26
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更常用的浏览器？', 'single', '["A. Chrome","B. Edge","C. Firefox","D. Safari","E. 360","F. QQ浏览器","G. 其他________"]', 'B', 26);

-- 27
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更常用的输入法？', 'single', '["A. 搜狗","B. 百度","C. 讯飞","D. 微信键盘","E. 系统自带","F. 其他________"]', 'E', 27);

-- 28
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的手机充电方式？', 'single', '["A. 有线快充","B. 无线充电","C. 磁吸无线","D. 其他________"]', 'A', 28);

-- 29
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的耳机类型？', 'single', '["A. 入耳式","B. 半入耳","C. 头戴式","D. 骨传导","E. 其他________"]', 'A', 29);

-- 30
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的电脑操作系统？', 'single', '["A. Windows","B. macOS","C. Linux","D. 其他________"]', 'A', 30);

-- 31
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的编程编辑器？', 'multiple', '["A. VS Code","B. JetBrains系列","C. Vim","D. Emacs","E. Sublime","F. 其他________"]', 'A', 31);

-- 32
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的云服务商？', 'multiple', '["A. AWS","B. Azure","C. Google Cloud","D. 阿里云","E. 腾讯云","F. Cloudflare","G. 其他________"]', 'F', 32);

-- 33
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的B站分区？', 'multiple', '["A. 动画","B. 番剧","C. 游戏","D. 知识","E. 科技","F. 生活","G. 鬼畜","H. 音乐","I. 舞蹈","J. 其他________"]', 'CDEFG', 33);

-- 34
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的早餐类型？', 'single', '["A. 包子豆浆","B. 油条豆腐脑","C. 面包牛奶","D. 粥+小菜","E. 煎饼果子","F. 不吃早餐","G. 其他________"]', 'A', 34);

-- 35
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的夜宵类型？', 'multiple', '["A. 烧烤","B. 小龙虾","C. 炸鸡","D. 泡面","E. 关东煮","F. 螺蛳粉","G. 其他________"]', 'D', 35);

-- 36
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的睡觉姿势？', 'single', '["A. 仰卧","B. 侧卧","C. 俯卧","D. 蜷缩","E. 其他________"]', 'B', 36);

-- 37
INSERT INTO questions (text, type, options, author_answer, sort_order) VALUES
('你更喜欢的起床时间？', 'single', '["A. 6点前","B. 6-7点","C. 7-8点","D. 8-9点","E. 9点后","F. 不固定"]', 'F', 37);
