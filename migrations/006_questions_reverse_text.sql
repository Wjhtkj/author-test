-- migrations/006 —— 把 12 道反向题的「题干」也反过来
--
-- 背景（这是个真 bug，别再犯）：
--   migrations/005 只把 author_answer 由 'A' 改成 'E'，题干却还是正向的
--   （例如「我更喜欢用 QQ，而不是微信。」配 author_answer='E'）。
--   这等于宣称「作者完全不符合他自己写的这句话」—— 而用户看不到作者答案，
--   于是这 12 题对认真按自己真实情况作答的人变成白扣 12 题分，纯属无端惩罚。
--   反向题的正确做法是**题干与答案键同时反转**：题干写成否定句，
--   作者答案 'E'（完全不符合）才在语义上说得通。
--
-- 改法：把题干反转成「我更不喜欢 X，反而更习惯 Y」这类否定句，话题对象不变。
--   12 道题的作者答案本来就是 'E'，所以「作者不符合这句否定陈述」= 作者其实更喜欢 X，
--   语义自洽；而「一路选完全符合」的策略在这 12 道上必然拿 0 分。
--
-- 幂等：每条 UPDATE 都带上 `text = '<旧题干>'` 的精确匹配 ——
--   已经改过的行匹配不到，重复执行 0 行写入；也不会误伤别的题。
--   sort_order + author_answer='E' + type='single' 三重定位，任何一条对不上就静默跳过。
--
-- 应用：wrangler d1 execute matching-quiz-db --remote --file=./migrations/006_questions_reverse_text.sql --yes

UPDATE questions SET text = '我更不喜欢用 QQ，反而更习惯微信。'
 WHERE sort_order = 5   AND author_answer = 'E' AND type = 'single' AND text = '我更喜欢用 QQ，而不是微信。';

UPDATE questions SET text = '我其实不喜欢辣条，反而更偏爱薯片或巧克力。'
 WHERE sort_order = 11  AND author_answer = 'E' AND type = 'single' AND text = '我更喜欢辣条，而不是薯片或巧克力。';

UPDATE questions SET text = '我更不喜欢用 Android，反而更习惯 iOS。'
 WHERE sort_order = 13  AND author_answer = 'E' AND type = 'single' AND text = '我更喜欢用 Android，而不是 iOS。';

UPDATE questions SET text = '旅行时我更不向往冒险，反而更想去城市里慢慢逛。'
 WHERE sort_order = 17  AND author_answer = 'E' AND type = 'single' AND text = '旅行时我更喜欢冒险，而不是城市观光。';

UPDATE questions SET text = '我其实不喜欢黑色，反而更偏爱白色。'
 WHERE sort_order = 19  AND author_answer = 'E' AND type = 'single' AND text = '我更喜欢黑色，而不是白色。';

UPDATE questions SET text = '我其实不喜欢黄瓜味薯片，反而更爱原味薯片。'
 WHERE sort_order = 25  AND author_answer = 'E' AND type = 'single' AND text = '我更喜欢黄瓜味薯片，而不是原味薯片。';

UPDATE questions SET text = '充电时我并不偏好有线快充，反而更习惯无线充电。'
 WHERE sort_order = 28  AND author_answer = 'E' AND type = 'single' AND text = '充电时我更偏好有线快充，而不是无线充电。';

UPDATE questions SET text = '我其实很少拿包子豆浆当早餐，反而更常吃面包牛奶。'
 WHERE sort_order = 34  AND author_answer = 'E' AND type = 'single' AND text = '我更常拿包子豆浆当早餐，而不是面包牛奶。';

UPDATE questions SET text = '朋友迟到 20 分钟，我不喜欢当面抱怨，而是会先憋着不说。'
 WHERE sort_order = 40  AND author_answer = 'E' AND type = 'single' AND text = '朋友迟到 20 分钟，我更喜欢直接抱怨，而不是憋着不说。';

UPDATE questions SET text = '一个人旅行迷路了，我不喜欢自己闷头找地图，而是会马上问人。'
 WHERE sort_order = 44  AND author_answer = 'E' AND type = 'single' AND text = '一个人旅行迷路了，我更倾向于打开地图自己找，而不是马上问人。';

UPDATE questions SET text = '看到和我完全相反的评论，我不喜欢只点踩不评论，而是会上去争。'
 WHERE sort_order = 47  AND author_answer = 'E' AND type = 'single' AND text = '看到和我完全相反的评论，我更倾向于点踩但不评论，而不是上去争。';

UPDATE questions SET text = '自己的观点在小组里是少数时，我不喜欢先听别人说，而是会立刻坚持己见。'
 WHERE sort_order = 51  AND author_answer = 'E' AND type = 'single' AND text = '自己的观点在小组里是少数时，我更倾向于先听别人说，而不是立刻坚持己见。';
