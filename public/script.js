// script.js —— 前端逻辑（纯原生 JS，不含任何作者标准答案）
// 关键安全约束：本文件不得出现 author_answer 或类似变量；答案只由后端计算。
// 题型：单选（single，单字母）/ 多选（multiple，字母组合，如 'ABC'）。
//       其中选项固定为「完全符合～完全不符合」的五级题，界面上单独标记为「符合度」。
// 特性：单选选中后自动跳题；答完最后一题先过一屏「计算中」动画再出结果；
//       结果页含多维雷达、维度剖析、回答稳定度、深度报告、反作弊惩罚模式与结果长图导出；
//       液态玻璃的镜面高光跟随指针（只改 CSS 变量，见 initLiquidSheen）。

// —— 等级/称号文案（与后端 levelKey 对应）；92+ 即为“可以跟作者配了” ——
//   注意：各档分界线定义在 functions/api/submit.js 的 tierOf()，这里只放文案；改了那边记得同步注释。
const TIERS = {
  soulmate: {
    title: "可以跟作者配了 💍",
    short: "锁死",
    desc: "你们俩怕不是一个模子里刻出来的？建议直接锁死，别让作者跑了。",
    final: "结论：你和作者大概率是同一个人。建议作者把你写进致谢名单。",
    color: "#e11d48",
  },
  high: {
    title: "灵魂同频 🌟",
    short: "同频",
    desc: "默契值在线，做个网友绰绰有余，努努力还真能处。",
    final: "结论：默契在线，建议互相关注，有缘再测一局。",
    color: "#7c3aed",
  },
  medium: {
    title: "半同频选手 🤝",
    short: "半同频",
    desc: "有重叠也有分叉，能一起下馆子，不一定能一起组队。",
    final: "结论：一半缘分一半路人，剩下的交给天意。",
    color: "#2563eb",
  },
  low: {
    title: "熟悉的陌生人 👀",
    short: "眼熟",
    desc: "差异不小，但俗话说互补型才长久（其实并不）。",
    final: "结论：差异是有的，但口味这种事，谁也别笑话谁。",
    color: "#0891b2",
  },
  stranger: {
    title: "平行宇宙来客 🛸",
    short: "异次元",
    desc: "你俩的共同点大概是——都点开了这个网站。",
    final: "结论：你俩的相遇，全靠这套题。",
    color: "#64748b",
  },
  none: {
    title: "作者看了陷入沉默 🤐",
    short: "沉默",
    desc: "建议重开一局，或者换个作者试试。",
    final: "结论：作者建议你重开一局，或者……换个作者。",
    color: "#475569",
  },
  // 反作弊命中时的“惩罚”称号（非真实等级）
  punish: {
    title: "检测到异常作答 😈",
    short: "异常",
    desc: "手速快成这样，作者严重怀疑你根本没看题。",
    final: "结论：本报告已被判定为“乱点”，不接受申诉。",
    color: "#ef4444",
  },
};

// 反作弊原因的中文说明
const CHEAT_REASON_TEXT = {
  "straight-line": "所有题都选了同一个答案",
  "too-fast": "作答速度快得不像人类",
};

// —— 七个主题维度：把 1-58 题按主题归类，用于结果页的多维度剖析 ——
const DIMENSIONS = [
  {
    key: "food", name: "吃喝日常", short: "吃喝", icon: "🍜",
    ids: [1, 4, 11, 20, 21, 22, 23, 24, 25, 34, 35],
    hi: "连吃都吃到一个锅里，这婚其实可以结了（bushi）。",
    mid: "大方向吃得到一块儿，细节上各有各的执念。",
    lo: "你俩对“好吃”的理解，大概隔了一个菜系。",
  },
  {
    key: "tech", name: "数码科技", short: "数码", icon: "💻",
    ids: [3, 5, 12, 13, 26, 27, 28, 29, 30, 31, 32],
    hi: "数码品味几乎同步，怀疑你俩共用同一个购物车。",
    mid: "设备观有交集，但各有各的心头好。",
    lo: "一个折腾生产力，一个只想要能用就行。",
  },
  {
    key: "game", name: "游戏娱乐", short: "游戏", icon: "🎮",
    ids: [2, 14],
    hi: "游戏口味对上了，随时能开黑。",
    mid: "能一起玩，但未必玩得到一块儿去。",
    lo: "你俩的游戏库，大概是互相看不懂的程度。",
  },
  {
    key: "content", name: "内容口味", short: "内容", icon: "🎬",
    ids: [6, 7, 15, 16, 33],
    hi: "追番看电影的品味高度重合，弹幕都能同频。",
    mid: "内容口味有交集，各有各的心头好。",
    lo: "一个看纪录片解压，一个看鬼畜续命。",
  },
  {
    key: "life", name: "生活节奏", short: "生活", icon: "🛌",
    ids: [8, 10, 17, 36, 37],
    hi: "作息和节奏几乎一致，连起床时间都对得上。",
    mid: "生活节奏大体合拍，偶尔错峰。",
    lo: "一个早睡早起，一个凌晨三点说“这才刚开始”。",
  },
  {
    key: "taste", name: "审美性情", short: "审美", icon: "🎨",
    ids: [9, 18, 19],
    hi: "审美和性情都挺像，难怪聊得来。",
    mid: "审美有重叠，性情各有各的棱角。",
    lo: "连对颜色和天气的看法都能吵起来。",
  },
  {
    key: "scenario", name: "处世之道", short: "处世", icon: "🧭",
    ids: [38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
    hi: "遇到事的反应和作者出奇一致，连纠结都纠结到一块儿。",
    mid: "处事方式大体合拍，个别选择各有各的脾气。",
    lo: "你俩碰到同一件事，大概会做出完全相反的决定。",
  },
];

// —— 抽题量档位（开始页可选）：从题库按主题维度均衡抽出 N 道 ——
//   10 / 20 / 30 为固定档；「全部」= 题库总量（0 表示全部）。
const COUNT_PRESETS = [10, 20, 30, 0];
const DEFAULT_COUNT = 20;

// Fisher–Yates 洗牌（原地，返回同一数组）
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 按主题维度均衡抽取 target 道题：
//   轮转分配——每轮给「已取最少且仍有余额」的维度 +1，直到凑满 target 或全部取完。
//   各维度题量因此尽量相近，同时自动尊重题少的维度（游戏 2 / 审美 3）的上限。
//   未归入任何维度的题目作为兜底池补足；最后整体打乱顺序返回。
function sampleByDimension(bank, target) {
  if (!bank || bank.length === 0) return [];
  const qById = new Map(bank.map((q) => [q.id, q]));
  const pools = DIMENSIONS.map((dim) => {
    const pool = dim.ids.map((id) => qById.get(id)).filter(Boolean);
    shuffle(pool);
    return { pool, take: 0 };
  });
  const assigned = new Set(DIMENSIONS.flatMap((d) => d.ids));
  const extras = shuffle(bank.filter((q) => !assigned.has(q.id)));

  const totalAvail = pools.reduce((s, p) => s + p.pool.length, 0) + extras.length;
  const n = Math.max(1, Math.min(Number(target) || totalAvail, totalAvail));

  let remaining = n;
  while (remaining > 0) {
    let progressed = false;
    for (const p of pools) {
      if (remaining <= 0) break;
      if (p.take < p.pool.length) { p.take += 1; remaining -= 1; progressed = true; }
    }
    if (!progressed) break;
  }

  const picked = [];
  pools.forEach((p) => picked.push(...p.pool.slice(0, p.take)));
  if (remaining > 0) picked.push(...extras.slice(0, remaining));
  return shuffle(picked);
}

// 把档位值解析成实际题量：0 → 题库总量
function resolveTargetCount(preset) {
  const total = state.bank.length || 0;
  const v = Number(preset);
  if (!v || v <= 0) return total;      // 「全部」
  return Math.min(v, total || v);
}

// 应用状态
const state = {
  bank: [],         // 全量题库（来自 /api/questions），抽题用
  questions: [],    // 本轮抽取出的题目 [{ id, text, type, options: [...] }]
  targetPreset: DEFAULT_COUNT, // 开始页选择的「抽题量」档位（0 = 全部）
  answers: {},      // { [questionId]: 'A' | 'ABC' }
  current: 0,
  submitting: false,
  startTime: 0,     // 开始答题的时间戳（用于反作弊的时长判定）
  result: null,     // 最近一次结果，供复制/导出使用
  // —— 以下两项服务于「回答稳定度」——
  timings: {},      // { [questionId]: 累计停留毫秒 }（同一题来回修改会累加）
  qEnteredAt: 0,    // 当前这道题「进入」的时刻，离开时结算进 timings
  // —— 以下两项服务于「本机存档」——
  quizActive: false,     // 是否正处于一局真实作答中（开始页预抽题时为 false，避免误存进度）
  resultQuestions: [],   // 当前展示的结果对应的题集，用于把选项字母还原成文案（回看上次结果时也要能还原）
};

// DOM 引用
const $ = (id) => document.getElementById(id);
const startScreen = $("start-screen");
const quizScreen = $("quiz-screen");
const calcScreen = $("calc-screen");
const resultScreen = $("result-screen");
const startBtn = $("start-btn");
const prevBtn = $("prev-btn");
const nextBtn = $("next-btn");
const restartBtn = $("restart-btn");
const copyBtn = $("copy-btn");
const downloadBtn = $("download-btn");
const unlockBtn = $("unlock-btn");
const punishNotice = $("punish-notice");
const analysisBox = $("analysis");
const questionText = $("question-text");
const qTypeBadge = $("q-type");
const optionsBox = $("options");
const progressFill = $("progress-fill");
const progressText = $("progress-text");
const errorToast = $("error-toast");
const ringFg = $("ring-fg");
// 平均分相关
const startStats = $("start-stats");
const modeSelect = $("mode-select");
const avgBox = $("avg-box");
const avgCount = $("avg-count");
const avgYouFill = $("avg-you-fill");
const avgMeanFill = $("avg-mean-fill");
const avgYouVal = $("avg-you-val");
const avgMeanVal = $("avg-mean-val");
const avgDelta = $("avg-delta");
const avgBeat = $("avg-beat");
const avgNote = $("avg-note");
// 断点续答 / 上次结果
const resumeSlot = $("resume-slot");
const startBtnLabel = $("start-btn-label");

// —— 小工具 ——
const reduceMotion = () =>
  !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

// 重放一次 CSS 入场动画（移除类 → 强制回流 → 重新添加）
function replay(el, cls) {
  if (!el || reduceMotion()) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// —— 统一的动画驱动 ——
// rAF 是主时钟，但它在「标签页切到后台」「省电模式」「无头/降帧环境」下会被节流甚至完全停摆。
// 只用 rAF 的话，动画会卡在起点不完成（数字停在 0、进度条停在 0 宽），
// 更糟的是依赖它 resolve 的 Promise 会永远挂着 —— 用户就卡在计算页看不到结果。
// 所以另挂一条 setTimeout 看门狗：只有连续 250ms 收不到帧时才由它接管推进。
// 真实浏览器里帧间隔约 16ms，看门狗几乎不会触发；帧停摆时它保证动画照样跑完。
const FRAME_STALL_MS = 250;
// onTick(t) 收到 0→1 的进度；返回 false 表示「先别结束」（用于等网络返回）
function animate(duration, onTick, onDone) {
  const t0 = performance.now();
  let stopped = false;
  let lastFrame = t0;
  let dog = null;

  const finish = () => {
    if (stopped) return;
    stopped = true;
    if (dog) clearTimeout(dog);
    if (onDone) onDone();
  };
  const paint = () => {
    if (stopped) return;
    const t = Math.min(1, (performance.now() - t0) / duration);
    if (t >= 1 && onTick(t) !== false) finish();
    else if (t < 1) onTick(t);
  };
  const frame = () => {
    if (stopped) return;
    lastFrame = performance.now();
    paint();
    if (!stopped) requestAnimationFrame(frame);
  };
  const watchdog = () => {
    if (stopped) return;
    if (performance.now() - lastFrame > FRAME_STALL_MS) paint(); // 帧停了才兜底
    dog = setTimeout(watchdog, 90);
  };

  requestAnimationFrame(frame);
  dog = setTimeout(watchdog, 90);
  return { cancel: () => { stopped = true; if (dog) clearTimeout(dog); } };
}

// 「下一帧再做」——同样不能只靠 rAF：这些调用都是「先设 0、下一帧再设目标值」来触发过渡动画的，
// 一旦帧不来，元素就会永久停在 0 宽/0 透明度。rAF 为主，setTimeout 兜底。
function nextFrame(fn) {
  let called = false;
  const once = () => { if (called) return; called = true; fn(); };
  requestAnimationFrame(() => requestAnimationFrame(once));
  setTimeout(once, 120);
}

// 数字滚动（三次缓出）
function countUp(el, target, duration = 950) {
  if (!el) return;
  const to = Number(target) || 0;
  if (reduceMotion() || to <= 0) {
    el.textContent = to;
    return;
  }
  el.textContent = "0";
  animate(duration, (t) => {
    el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
  });
}

function showError(msg) {
  errorToast.textContent = msg;
  errorToast.classList.remove("hidden");
}
function clearError() {
  errorToast.classList.add("hidden");
  errorToast.textContent = "";
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function letterOf(index) {
  return String.fromCharCode(65 + index);
}
function stripPrefix(label) {
  return String(label).replace(/^[A-Za-z][.、．)]\s*/, "");
}
function cleanLabel(label) {
  return stripPrefix(label).replace(/[_＿]+/g, "").trim();
}

// —— 五级符合度题识别 ——
// 数据层仍存为 single（后端按「选项距离衰减」计分），前端依据选项内容识别，
// 以便把题型标签显示成「符合度」而不是「单选」，并给出对应的作答提示。
const SCALE_LABELS = ["完全符合", "比较符合", "一般", "比较不符合", "完全不符合"];
function isScaleQuestion(q) {
  if (!q || q.type !== "single") return false;
  const opts = q.options || [];
  return (
    opts.length === SCALE_LABELS.length &&
    opts.every((o, i) => cleanLabel(o) === SCALE_LABELS[i])
  );
}

// —— 开始页玻璃芯片（用时 / 全网平均）——
// 题量由开始页的档位选择器呈现，这里只展示派生的用时估算与全网平均。
// 优先「原位更新文本」而不是重建 DOM：避免重放入场动画、避免无谓重排。
let lastStats = null;
function renderStartChips(stats) {
  if (stats !== undefined) lastStats = stats;
  const s = lastStats;
  const avgText =
    s && s.count > 0 && s.average != null ? `${s.average}%` : "等你第一个";
  const n = state.questions.length || state.bank.length || DEFAULT_COUNT;
  const mins = Math.max(2, Math.round(n / 8)); // 约 8 题/分钟
  const values = [`约 ${mins} 分钟`, avgText];

  const cells = startStats.querySelectorAll(".chip");
  if (cells.length === values.length) {
    cells.forEach((cell, i) => {
      const b = cell.querySelector("b");
      if (b) b.textContent = values[i];
    });
    return;
  }

  const keys = ["用时", "全网平均"];
  startStats.innerHTML = values
    .map(
      (v, i) =>
        `<span class="chip"><i>${keys[i]}</i><b>${escapeHtml(v)}</b></span>`
    )
    .join("");
}

// —— 全网统计（平均分）：开始页显示 ——
// 拉取 /api/stats；失败或尚无数据时仍渲染静态芯片，不影响主流程。
async function loadGlobalStats() {
  let stats = null;
  try {
    const res = await fetch("/api/stats");
    if (res.ok) stats = await res.json();
  } catch {
    /* 忽略：统计接口不可用时不影响测试 */
  }
  renderStartChips(stats);
}

// —— 结果页：与全网平均分对比 ——
// 数据来自后端提交响应里的 stats（含本次），不再额外请求。
function renderAvg(data) {
  const s = data.stats;
  const mine = data.matchPercent;

  // 无统计（表未迁移 / 无数据）时隐藏模块
  if (!s || s.count === 0 || s.average == null) {
    avgBox.classList.add("hidden");
    return;
  }
  avgBox.classList.remove("hidden");

  const mean = s.average;
  const delta = mine - mean;

  avgCount.textContent = `${s.count} 人次参与`;
  avgYouVal.textContent = mine + "%";
  avgMeanVal.textContent = mean + "%";

  // 下一帧再赋宽度，触发对比条生长动画
  const youW = Math.max(2, mine) + "%";
  const meanW = Math.max(2, mean) + "%";
  if (reduceMotion()) {
    avgYouFill.style.width = youW;
    avgMeanFill.style.width = meanW;
  } else {
    avgYouFill.style.width = "0%";
    avgMeanFill.style.width = "0%";
    nextFrame(() => {
      avgYouFill.style.width = youW;
      avgMeanFill.style.width = meanW;
    });
  }

  // 差值徽标
  const sign = delta > 0 ? "+" : "";
  avgDelta.textContent = `较平均 ${sign}${delta}`;
  avgDelta.className = "avg-delta " + (delta > 0 ? "up" : delta < 0 ? "down" : "eq");

  // 击败百分比（beatPercent 为 null 时不显示）
  if (s.beatPercent == null) {
    avgBeat.textContent = "";
  } else {
    avgBeat.textContent = `击败了 ${s.beatPercent}% 的参与者`;
  }

  // 备注文案（带点梗）
  let note;
  if (delta >= 15) note = "你比平均分高出一大截，作者看了都想认亲。";
  else if (delta >= 5) note = "稳稳高于平均线，属于人群里的“同频优等生”。";
  else if (delta > -5) note = "和平均分咬得很紧，你就是那个“最标准的路人”。";
  else if (delta > -15) note = "略低于平均水平——不要紧，平均分也很平庸。";
  else note = "低于平均线，说明你很有自己的主见（也可能是没认真答）。";
  if (mine >= 92) note = "92 分以上，你已超越绝大多数人，作者在线等你私信。";
  avgNote.textContent = note;
}

// —— 预载题库（页面初始化时调用）：拉取全量题目存入 state.bank，并先抽好本轮题量用于开始页展示 ——
async function loadBank() {
  try {
    const res = await fetch("/api/questions");
    if (!res.ok) return;
    const data = await res.json();
    if (data.questions && data.questions.length) {
      state.bank = data.questions;
      // 用户在题库返回前就点了「继续答题」的话，此刻正在作答 ——
      // 不能重新抽样去覆盖他手上的题集，否则题会当场换掉
      if (!state.quizActive && !state.result) {
        sampleIntoState();
        renderStartChips(); // 依据当前档位刷新用时估算
      }
    }
  } catch {
    /* 忽略：开始测试时会再次尝试拉取 */
  }
}

// —— 选项显示顺序：非量表题每次抽样都随机换位 ——
//   为什么不全打乱：
//     · 五级符合度题本身就是一套「完全符合 → 完全不符合」的刻度，乱序只会让人每题重新找一遍位置；
//       而且想偷懒的人是「按文案找完全符合」，换位拦不住他 —— 拦住他的是那几道反向题（见 migrations/005）。
//     · 其他题目换位后，「每次都点第一个」不再等于每次都选同一个东西，也顺带废掉
//       「照着某份答案键的字母位置去点」这类玩法。
//   关键：order 是「显示位 → 原序下标」的映射，state.answers 里存的**始终是原序字母**，
//   所以提交、计分、结果页回显（fmtUserAnswer 用 options[idx]）全都不需要改口径。
function shuffledOrder(q) {
  return shuffle((q.options || []).map((_, i) => i));
}
// 取某题的显示顺序：非量表题带 order；量表题与老存档没有 order，按原序（恒等映射）
function orderOf(q) {
  const opts = (q && q.options) || [];
  return Array.isArray(q.order) && q.order.length === opts.length
    ? q.order
    : opts.map((_, i) => i);
}

// 把「原序字母」换算成「显示位字母」（也就是用户实际点在了第几个位置）。
// 只服务于反作弊：后端 detectCheat 的「所有题都选了同一个答案」原本看的是字母是否恒定，
// 换位之后「一路点第一个」会产生一串各不相同的原序字母 —— 不换算的话这条判定就废了。
function pickOf(q, userAnswer) {
  const order = orderOf(q);
  if (order.every((v, i) => v === i)) return userAnswer; // 没换位，位置即原序
  return (userAnswer || "")
    .split("")
    .map((ch) => {
      const pos = order.indexOf(ch.charCodeAt(0) - 65);
      return pos >= 0 ? letterOf(pos) : ch;
    })
    .sort()
    .join("");
}

// 从已载题库中为本轮抽取题目（每次开始/重开、切换档位都会重新随机抽 + 重新换位）
// 注意要 {...q} 复制：order 是「这一轮」的显示顺序，不能写回 state.bank（否则题库被污染、续答也会串位）
function sampleIntoState() {
  state.questions = sampleByDimension(state.bank, resolveTargetCount(state.targetPreset)).map((q) =>
    isScaleQuestion(q) ? { ...q } : { ...q, order: shuffledOrder(q) }
  );
}

// —— 抽题量档位选择器 ——
// 依据 COUNT_PRESETS 渲染按钮（含「全部」），点击即切换档位并重新抽样。
function syncPresetButtons() {
  if (!modeSelect) return;
  modeSelect.querySelectorAll("[data-count]").forEach((b) => {
    b.classList.toggle("is-active", Number(b.dataset.count) === state.targetPreset);
  });
}

function applyTargetPreset(preset) {
  state.targetPreset = preset;
  syncPresetButtons();
  sampleIntoState();
  renderStartChips(); // 刷新用时估算（题量越少越快）
}

function initModeSelector() {
  if (!modeSelect) return;
  const total = state.bank.length || 0;
  modeSelect.innerHTML = COUNT_PRESETS.map((c) => {
    const label = c === 0 ? "全部" : `${c} 题`;
    const active = c === state.targetPreset ? " is-active" : "";
    return `<button type="button" class="seg${active}" data-count="${c}">${label}</button>`;
  }).join("");
  modeSelect.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-count]");
    if (!btn) return;
    applyTargetPreset(Number(btn.dataset.count));
  });
}

// ============================================================
// 本机存档：断点续答 + 回看上次结果
// 只写 localStorage，不上传。存的全是「你自己的」数据——题目文案、你的选择、得分，
// 以及 /api/questions 与 /api/submit 本来就返回给你的字段，其中不含 author_answer，
// 所以即便被本机用户翻出来，也拿不到作者答案。
// ============================================================
const SAVE_VERSION = 2; // 存档结构版本：字段有变动时 +1，旧存档会被自动丢弃（不迁移）
                        // v2：进度档新增 timings（每题停留时长），结果档新增 stability（回答稳定度）
const KEY_PROGRESS = "mq.progress.v1";
const KEY_RESULT = "mq.lastResult.v1";
const PROGRESS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 未完成的进度保留 7 天

// localStorage 在隐私模式或禁用存储时会直接抛异常，统一降级为「不存档」而不是让页面崩掉
function lsRead(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function lsWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // 配额满 / 不可用：静默放弃存档，绝不影响正常作答
  }
}
function lsRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* 忽略 */
  }
}

function readProgress() {
  const s = lsRead(KEY_PROGRESS);
  if (!s || s.v !== SAVE_VERSION) return null;
  if (!Array.isArray(s.questions) || s.questions.length === 0) return null;
  // 一题都没答的不算「中断的进度」，否则开始页会出现毫无意义的 0/20
  if (!s.answers || Object.keys(s.answers).length === 0) return null;
  if (!s.savedAt || Date.now() - s.savedAt > PROGRESS_TTL_MS) return null; // 过期即失效
  return s;
}
function readLastResult() {
  const s = lsRead(KEY_RESULT);
  if (!s || s.v !== SAVE_VERSION) return null;
  if (!s.data || typeof s.data.matchPercent !== "number") return null;
  return s;
}
function clearProgress() {
  lsRemove(KEY_PROGRESS);
}
function clearLastResult() {
  lsRemove(KEY_RESULT);
}

// 进度落盘（每次换题、每次改答案都会调用）
function persistProgress() {
  if (!state.quizActive) return;
  if (!state.questions.length || Object.keys(state.answers).length === 0) {
    clearProgress();
    return;
  }
  lsWrite(KEY_PROGRESS, {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    preset: state.targetPreset,
    current: state.current,
    answers: state.answers,
    // 每题累计停留时长：续答时带上，结果页的「回答稳定度」才不会只有后半程的数据
    timings: state.timings,
    // 已用掉的作答时长：续答时用它复原计时，避免把中途离开的几小时算进 durationMs
    elapsedMs: state.startTime ? Date.now() - state.startTime : 0,
    questions: state.questions,
  });
}

function saveLastResult(data) {
  lsWrite(KEY_RESULT, {
    v: SAVE_VERSION,
    at: Date.now(),
    data,                            // details 里只有题目文案、你的选择、得分
    questions: state.resultQuestions, // 回看时要把选项字母还原成文案，得留一份当时的题集
  });
}

// 「刚刚 / 3 分钟前 / 昨天 / 10 月 1 日」
function fmtWhen(ts) {
  if (!ts) return "刚刚";
  const diff = Date.now() - ts;
  if (diff < 60e3) return "刚刚";
  if (diff < 3600e3) return `${Math.floor(diff / 60e3)} 分钟前`;
  if (diff < 86400e3) return `${Math.floor(diff / 3600e3)} 小时前`;
  if (diff < 172800e3) return "昨天";
  const d = new Date(ts);
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

// 有未完成进度时，主按钮改叫「开始新的一局」，让「继续答题」更像默认选项
function syncStartBtnLabel() {
  if (!startBtnLabel) return;
  startBtnLabel.textContent = readProgress() ? "开始新的一局" : "开始测试";
}

// —— 开始页：渲染「继续答题 / 查看上次结果」两张卡片 ——
function renderResume() {
  if (!resumeSlot) return;
  const prog = readProgress();
  const last = readLastResult();
  const cards = [];

  if (prog) {
    const total = prog.questions.length;
    const done = Object.keys(prog.answers).length;
    const pct = Math.round((done / total) * 100);
    cards.push(`
      <div class="resume-card" data-kind="progress">
        <div class="rc-main">
          <span class="rc-k">未完成的测试 · ${escapeHtml(fmtWhen(prog.savedAt))}</span>
          <p class="rc-t">已答 <b>${done}</b> / ${total} 题，还差 ${total - done} 题</p>
          <div class="rc-bar"><i data-w="${pct}"></i></div>
        </div>
        <div class="rc-acts">
          <button type="button" class="btn btn-primary rc-go" data-act="resume">继续答题</button>
          <button type="button" class="rc-x" data-act="drop-progress" title="放弃这次进度" aria-label="放弃这次进度">✕</button>
        </div>
      </div>`);
  }

  if (last) {
    const d = last.data;
    const tier = TIERS[d.levelKey] || TIERS.medium;
    // 命中反作弊的那次，结果页本来就是「??」，这里保持一致，不要把真实分泄露在开始页
    const score = d.cheated
      ? `<span class="rc-sc">??</span>`
      : `<span class="rc-sc">${d.matchPercent}%</span>`;
    cards.push(`
      <div class="resume-card" data-kind="result">
        <div class="rc-main">
          <span class="rc-k">上次的结果 · ${escapeHtml(fmtWhen(last.at))}</span>
          <p class="rc-t">${score} <b>${escapeHtml(tier.title)}</b> · 共 ${d.total} 题</p>
        </div>
        <div class="rc-acts">
          <button type="button" class="btn rc-go" data-act="view-result">查看上次结果</button>
          <button type="button" class="rc-x" data-act="drop-result" title="清除这条记录" aria-label="清除这条记录">✕</button>
        </div>
      </div>`);
  }

  resumeSlot.hidden = cards.length === 0;
  resumeSlot.innerHTML = cards.join("");
  if (cards.length === 0) return;

  // 下一帧再赋宽度，触发进度条生长动画
  nextFrame(() => {
    resumeSlot.querySelectorAll(".rc-bar i").forEach((el) => {
      el.style.width = el.dataset.w + "%";
    });
  });
  syncStartBtnLabel();
}

// —— 继续未完成的答题 ——
function resumeQuiz(prog) {
  clearError();
  cancelAdvance();
  state.questions = prog.questions;
  state.answers = { ...prog.answers };
  // 续答时把上次的每题停留时长带回来（缺失就当作没有记录，稳定度会按覆盖度降权说明）
  state.timings = { ...(prog.timings || {}) };
  state.qEnteredAt = 0;
  state.current = Math.min(Math.max(0, Number(prog.current) || 0), prog.questions.length - 1);
  // 只复原「真正用于作答的时间」，中途离开的时长不计入 —— 否则 durationMs 会被撑大，
  // 反作弊的 too-fast 判定就永远不可能命中
  state.startTime = Date.now() - (Number(prog.elapsedMs) || 0);
  state.result = null;
  state.resultQuestions = [];
  state.quizActive = true;
  if (typeof prog.preset === "number") {
    state.targetPreset = prog.preset;
    syncPresetButtons();
  }
  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  calcScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  renderQuestion();
}

// —— 回看上一次结果：直接本地渲染，不重新提交，不污染全网统计 ——
function viewSavedResult(last) {
  clearError();
  cancelAdvance();
  state.quizActive = false;
  renderResult(last.data, last.questions || []);
}

// —— 开始测试 ——
async function startQuiz() {
  clearError();
  startBtn.disabled = true;
  if (startBtnLabel) startBtnLabel.textContent = "加载中…";
  try {
    // 题库未预载时兜底拉取；已载则复用，避免重复请求
    if (state.bank.length === 0) {
      const res = await fetch("/api/questions");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("题库为空，请先在 D1 中初始化数据。");
      }
      state.bank = data.questions;
    }
    sampleIntoState(); // 每轮重新随机抽（题量相近、顺序打乱）
    state.answers = {};
    state.timings = {};
    state.qEnteredAt = 0;
    state.current = 0;
    state.result = null;
    state.resultQuestions = [];
    clearProgress(); // 点「开始新的一局」= 明确放弃上一次未完成的进度
    state.quizActive = true; // 从此刻起，每次改答案 / 换题都会落盘
    state.startTime = Date.now(); // 计时开始（用于反作弊）
    startScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    calcScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");
    renderQuestion();
  } catch (err) {
    state.quizActive = false;
    showError("加载题目失败：" + err.message);
  } finally {
    startBtn.disabled = false;
    syncStartBtnLabel(); // 而不是写死回「开始测试」——否则会连带抹掉按钮里的箭头图标
  }
}

// —— 作答计时（回答稳定度的数据源）——
// 语义是「这道题在屏幕上停留了多久」：进入某题时打点，离开时结算并累加。
// 用累加而不是覆盖，是为了让「回头改答案」也算进去——那同样是花在这道题上的时间。
// 越界值直接丢弃：中途切走标签页几小时、或系统时钟跳变，都不该污染稳定度。
const MAX_DWELL_MS = 30 * 60 * 1000;
function recordTiming(qid) {
  if (!qid || !state.qEnteredAt) return;
  const dt = Date.now() - state.qEnteredAt;
  state.qEnteredAt = Date.now(); // 先重置起点，这样重复调用不会把同一段时间算两遍
  if (dt <= 0 || dt > MAX_DWELL_MS) return;
  state.timings[qid] = (state.timings[qid] || 0) + dt;
}

// —— 渲染当前题目 ——
function renderQuestion() {
  const q = state.questions[state.current];
  const total = state.questions.length;

  questionText.textContent = q.text;
  replay(questionText, "q-in"); // 每次换题重放一次轻微的入场动效
  const scale = isScaleQuestion(q);
  qTypeBadge.textContent = scale
    ? "符合度"
    : q.type === "single"
    ? "单选"
    : "多选（可多选）";
  qTypeBadge.className = "q-type " + (scale ? "scale" : q.type);

  const ratio = (state.current + 1) / total;
  progressFill.style.transform = `scaleX(${ratio})`; // 进度条用 scaleX 平滑拉伸
  progressText.textContent = `${state.current + 1} / ${total}`;

  const chosenStr = state.answers[q.id];
  const chosenSet = new Set(chosenStr ? chosenStr.split("") : []);

  optionsBox.innerHTML = "";
  const order = orderOf(q); // 显示位 → 原序下标（非量表题已随机换位）
  order.forEach((origIdx, pos) => {
    const letter = letterOf(origIdx); // 记账、提交用的都是「原序字母」
    const shown = letterOf(pos);      // 界面上印的是「当前显示位置」的字母
    const el = document.createElement("div");
    el.className = "option" + (chosenSet.has(letter) ? " selected" : "");
    el.dataset.letter = letter;
    el.style.setProperty("--i", pos); // 选项错峰入场（按显示顺序，而不是原序）
    el.innerHTML =
      `<span class="dot">${shown}</span>` +
      `<span class="opt-label">${escapeHtml(cleanLabel(q.options[origIdx]))}</span>`;
    el.addEventListener("click", () => chooseOption(letter, q.type));
    optionsBox.appendChild(el);
  });

  prevBtn.disabled = state.current === 0;

  const isSingle = q.type === "single";
  const isLast = state.current === total - 1;
  // 单选未作答：用自动翻页，不要“下一题”按钮（避免与选中动画/翻页动画叠在一起）；
  // 已作答的单选（如回看）仍给出按钮，避免卡死无法前进。
  if (isSingle && !chosenStr) {
    nextBtn.style.display = "none";
  } else {
    nextBtn.style.display = "";
    nextBtn.textContent = isLast ? "查看结果" : "下一题";
    nextBtn.disabled = !chosenStr;
  }

  persistProgress(); // 每次换题都落盘，供中断后回来续答
  state.qEnteredAt = Date.now(); // 计时起点：从这一刻起，停留时长归这道题
}

// 轻量刷新选中态与按钮可用性（不重建 DOM，避免每次点选都重放入场动画）
function refreshSelectionUI() {
  const q = state.questions[state.current];
  const chosenStr = state.answers[q.id];
  const chosenSet = new Set(chosenStr ? chosenStr.split("") : []);
  optionsBox.querySelectorAll(".option").forEach((el) => {
    el.classList.toggle("selected", chosenSet.has(el.dataset.letter));
  });
  nextBtn.disabled = !chosenStr;

  persistProgress(); // 每次改答案都落盘（含「全部取消」→ 会清掉存档）
}

// —— 点击某个选项 ——
// 单选：选中后自动跳下一题（符合“单选不用按确定”的要求）
function chooseOption(letter, type) {
  clearError();
  const q = state.questions[state.current];
  const id = q.id;

  if (type === "single") {
    const wasSame = state.answers[id] === letter;
    if (wasSame) {
      delete state.answers[id]; // 再点一次取消
    } else {
      state.answers[id] = letter;
    }
  } else {
    const set = new Set(state.answers[id] ? state.answers[id].split("") : []);
    if (set.has(letter)) set.delete(letter);
    else set.add(letter);
    if (set.size === 0) delete state.answers[id];
    else state.answers[id] = [...set].sort().join("");
  }

  // 只就地更新选中态与按钮，不再重建整列选项 → 避免每次点选都重放入场动画
  // （此前每点一次都 renderQuestion()，导致多选每次整页重播动画、单选选中动画与翻页动画糊在一起）
  refreshSelectionUI();

  const nowHas = (state.answers[id] || "").includes(letter);
  if (type === "single" && nowHas) {
    scheduleAdvance(); // 单选选中即自动前进（当前题仅做选中反馈，翻页动画留给下一题）
  }
}

// 自动前进（带一点点延迟，让用户看到选中反馈）
let advanceTimer = null;
function scheduleAdvance(delay = 260) {
  clearTimeout(advanceTimer);
  const fromIndex = state.current;
  advanceTimer = setTimeout(() => {
    if (state.current !== fromIndex) return; // 用户已手动翻页
    const total = state.questions.length;
    const q = state.questions[state.current];
    if (state.answers[q.id] === undefined) return; // 兜底：未作答不前进
    recordTiming(q.id); // 结算停留时长（含这 260ms 的选中反馈延迟，量级可忽略）
    if (state.current < total - 1) {
      state.current += 1;
      renderQuestion();
    } else {
      submitAnswers();
    }
  }, delay);
}
function cancelAdvance() {
  clearTimeout(advanceTimer);
  advanceTimer = null;
}

// —— 上一题 / 下一题 ——
function goPrev() {
  cancelAdvance();
  if (state.current > 0) {
    recordTiming(state.questions[state.current].id); // 回头也算这道题的停留时长
    state.current -= 1;
    renderQuestion();
  }
}
function goNext() {
  cancelAdvance();
  const total = state.questions.length;
  const q = state.questions[state.current];
  if (state.answers[q.id] === undefined) return;
  recordTiming(q.id);
  if (state.current < total - 1) {
    state.current += 1;
    renderQuestion();
  } else {
    submitAnswers();
  }
}

// ============================================================
// 计算动画：答完最后一题 → 结果页 之间的过场
// 动画与 /api/submit 请求「并行」跑：动画一开就发请求，两边都完成才切结果页。
// 这样服务器快时不会一闪而过，服务器慢时也不至于干等一片空白。
// ============================================================
const calcNum = $("calc-num");
const calcArc = $("calc-arc");
const calcStep = $("calc-step");
const calcSteps = $("calc-steps");

const CALC_CIRC = 2 * Math.PI * 52;      // 与 .calc-arc 的 r="52" 对应
const CALC_DUR = 2500;                   // 正常时长；减少动态效果时压到 700ms
// 环上百分比与左侧步骤共用同一套节点，避免两处文案各自演化
const CALC_STEPS = [
  "读取作答记录",
  "逐题比对作者偏好",
  "聚合七个维度",
  "评估作答稳定度",
  "生成专属报告",
];
const CALC_FLAVOR = [
  "正在读取你的作答记录…",
  "把你的答案和作者的口味逐题叠在一起…",
  "七个维度正在逐个对表…",
  "顺便看看这份答案稳不稳…",
  "报告快好了，再等一秒…",
];

// epoch 是「这轮动画还生效吗」的暗号：中止（如提交失败）时 +1，
// 旧动画的 rAF 循环下一帧就会发现暗号对不上，自行退出 —— 不用手动 cancelAnimationFrame。
let calcEpoch = 0;
let calcPending = false; // 结果数据还没到 → 卡在 99% 慢慢等，避免出现「100% 了却不出结果」

function prepareCalcSteps() {
  if (!calcSteps || calcSteps.children.length === CALC_STEPS.length) return;
  calcSteps.innerHTML = CALC_STEPS.map(
    (s) => `<li><span class="cs-dot" aria-hidden="true"></span>${escapeHtml(s)}</li>`
  ).join("");
}

// 开始动画；返回的 Promise 在「动画放完 且 数据已到」后 resolve
let calcAbort = null; // 中止用：停掉动画循环并让上面那个 Promise 落地，避免它永远挂着
function runCalculating() {
  prepareCalcSteps();
  const my = ++calcEpoch;
  calcPending = true;
  const dur = reduceMotion() ? 700 : CALC_DUR;
  const li = calcSteps ? [...calcSteps.children] : [];

  if (calcArc) calcArc.style.strokeDashoffset = String(CALC_CIRC);
  if (calcNum) calcNum.textContent = "0";
  if (calcStep) calcStep.textContent = CALC_FLAVOR[0];
  li.forEach((el) => el.classList.remove("done", "now"));
  calcScreen.classList.remove("hidden");

  let lastStep = -1;
  return new Promise((resolve) => {
    const anim = animate(
      dur,
      (t) => {
        if (my !== calcEpoch) { resolve(); return true; } // 已被中止 → 不再画，直接收工
        // 缓出：开场涨得快、结尾慢慢爬到 100，视觉上更像「真的在算」
        const pct = t >= 1 && calcPending ? 99 : Math.round((1 - Math.pow(1 - t, 2.2)) * 100);
        if (calcNum) calcNum.textContent = pct;
        if (calcArc) calcArc.style.strokeDashoffset = String(CALC_CIRC * (1 - pct / 100));

        const idx = Math.min(CALC_STEPS.length - 1, Math.floor(t * CALC_STEPS.length));
        if (idx !== lastStep) {
          lastStep = idx;
          if (calcStep) calcStep.textContent = CALC_FLAVOR[idx];
          li.forEach((el, i) => {
            el.classList.toggle("done", i < idx);
            el.classList.toggle("now", i === idx);
          });
        }
        return !calcPending; // 数据没到 → 返回 false，停在 99% 继续等
      },
      () => {
        li.forEach((el) => { el.classList.remove("now"); el.classList.add("done"); });
        if (calcNum) calcNum.textContent = "100";
        if (calcArc) calcArc.style.strokeDashoffset = "0";
        setTimeout(resolve, 200); // 让 100% 停一下再切页，否则会显得突兀
      }
    );
    calcAbort = () => { anim.cancel(); resolve(); };
  });
}

// 数据到手 —— 解除「卡在 99%」的门闩
function calcDataReady() {
  calcPending = false;
}

// 中止动画并收起计算页（提交失败时用）
function abortCalculating() {
  calcEpoch += 1;
  calcPending = false;
  calcScreen.classList.add("hidden");
  if (calcAbort) { const f = calcAbort; calcAbort = null; f(); }
}

// —— 提交答案，获取结果 ——
async function submitAnswers() {
  clearError();
  cancelAdvance();
  if (state.submitting) return;
  state.submitting = true;
  nextBtn.disabled = true;
  nextBtn.textContent = "计算中…";

  // 结算最后一题的停留时长（前面每题都在「离开」时结算过了）
  recordTiming(state.questions[state.current].id);

  const answers = state.questions.map((q) => {
    const ua = state.answers[q.id] || "";
    return {
      questionId: q.id,
      userAnswer: ua,        // 原序字母：后端按它与 author_answer 算分
      pick: pickOf(q, ua),   // 显示位字母：仅后端反作弊用（判断有没有「一路点同一个位置」）
    };
  });

  const durationMs = state.startTime ? Date.now() - state.startTime : 0;

  // 计算动画与网络请求并行：先起动画（用户立刻看到反馈），再发请求
  quizScreen.classList.add("hidden");
  const anim = runCalculating();

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, durationMs }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "提交失败");

    // 回答稳定度完全在本机算 —— 不新增任何上传字段，只把结果挂进响应对象，
    // 这样它会被 saveLastResult 一并存档，「查看上次结果」时也能原样看到。
    data.stability = computeStability(state.questions, state.answers, state.timings);

    // 本局结束：撤掉进度存档、改存这次结果。
    // 顺序不能反 —— saveLastResult 要读 renderResult 里刚设好的 state.resultQuestions。
    state.quizActive = false;
    clearProgress();

    calcDataReady();  // 门闩一开，动画自己会补完最后一段并 resolve
    await anim;
    renderResult(data);
    saveLastResult(data);
  } catch (err) {
    abortCalculating(); // 收起计算页，把用户放回答题页，别让他卡在过场里
    quizScreen.classList.remove("hidden");
    showError("提交失败：" + err.message);
    nextBtn.disabled = false;
    nextBtn.textContent = "查看结果";
  } finally {
    state.submitting = false;
  }
}

// —— 维度聚合 ——
function computeDimensions(details) {
  const byId = new Map(details.map((d) => [d.questionId, d]));
  return DIMENSIONS.map((dim) => {
    const items = dim.ids.map((id) => byId.get(id)).filter(Boolean);
    const sum = items.reduce((a, d) => a + d.score, 0);
    const percent = items.length ? Math.round(sum / items.length) : 0;
    return { ...dim, percent, count: items.length };
  });
}
// 维度分档：与整体 tierOf() 一样随 DECAY 上调（随机乱选单题期望 37.6 分，
// 故「半斤八两」下沿从 40 提到 45，避免乱点也被判成“半斤八两”）。
function dimTag(p) {
  if (p >= 85) return "完全一致";
  if (p >= 70) return "高度同频";
  if (p >= 45) return "半斤八两";
  if (p >= 25) return "有点代沟";
  return "隔着一个次元";
}
function dimComment(dim, p) {
  if (p >= 70) return dim.hi;
  if (p >= 45) return dim.mid;
  return dim.lo;
}

// ============================================================
// 回答稳定度：用「作答行为」判断这份答案可不可信
// 三个互不重叠的轴：
//   节奏平稳 —— 每题用时的离散程度（忽快忽慢 = 没在读）
//   作答投入 —— 平均每题耗时（连点一定落在这条上）
//   选择变化 —— 选项使用广度 + 超长连击（一路同一个选项）
// 只看行为，不评价答案对错；全部在本机算，不上传任何新字段。
// 注意 39 道符合度题里，「跟作者像」的人本来就该多选「完全符合」，
// 所以对「选项集中」的判定放得很宽（≥10 连击才扣分），避免把高分用户误伤成敷衍。
// ============================================================
function computeStability(questions, answers, timings) {
  const qs = (questions || []).filter((q) => answers[q.id] !== undefined);
  const total = qs.length;
  const times = qs
    .map((q) => timings[q.id])
    .filter((t) => typeof t === "number" && t > 0);
  const n = times.length;
  const mean = n ? times.reduce((a, b) => a + b, 0) / n : 0;
  const meanSec = mean / 1000;
  const coverage = total ? n / total : 0;

  // —— 1) 节奏平稳：变异系数 ——
  //  掐掉最快/最慢各一道再算（n≥8 时）：偶尔一道题走神不该把整组判死。
  let cv = 0;
  if (n >= 3) {
    const sorted = [...times].sort((a, b) => a - b);
    const core = n >= 8 ? sorted.slice(1, -1) : sorted;
    const cm = core.reduce((a, b) => a + b, 0) / core.length;
    const sd = Math.sqrt(core.reduce((a, t) => a + (t - cm) ** 2, 0) / core.length);
    cv = cm > 0 ? sd / cm : 0;
  }
  let rhythm = n < 3 ? 60 : Math.round(100 * Math.exp(-Math.max(0, cv - 0.3) * 1.6));
  // 「匀速狂点」的离散度天然很低，不能因此拿满分 —— 速度太快的组直接压低上限
  if (n >= 3 && meanSec < 1.2) rhythm = Math.min(rhythm, 55);

  // —— 2) 作答投入：平均每题耗时（分段线性）——
  const PACE_PTS = [[0.4, 0], [1.0, 30], [1.6, 60], [2.4, 82], [3.5, 94], [5, 100]];
  const lerp = (x) => {
    if (x <= PACE_PTS[0][0]) return PACE_PTS[0][1];
    for (let i = 1; i < PACE_PTS.length; i++) {
      const [x1, y1] = PACE_PTS[i];
      if (x <= x1) {
        const [x0, y0] = PACE_PTS[i - 1];
        return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
      }
    }
    return PACE_PTS[PACE_PTS.length - 1][1];
  };
  const rushCount = times.filter((t) => t < 1000).length;
  const rushRate = n ? rushCount / n : 0;
  // 「秒过」的题按比例再打一次折 —— 平均 2 秒但有 14 题是 0.3 秒，同样是没读
  let pace = n < 3 ? 60 : Math.round(lerp(meanSec) * (1 - rushRate * 0.6));

  // —— 3) 选择变化：选项使用广度 + 最长连击 ——
  const seq = qs.map((q) => answers[q.id]);
  let maxRun = 0, run = 0, prev = null;
  seq.forEach((a) => {
    run = a === prev ? run + 1 : 1;
    prev = a;
    if (run > maxRun) maxRun = run;
  });
  const distinct = new Set(seq).size;
  const distinctRate = total ? distinct / total : 1;
  // 全程同一个答案：题量多寡都一样，只可能是没在看题（与后端 straight-line 判定口径一致）
  const mono = total >= 5 && distinct === 1;
  // 「答案用得很单调」不能单独当作敷衍的证据：39 道符合度题里，跟作者像的人本来就该
  // 一路选「完全符合」。所以低分散度必须配上「快」才算可疑，否则会误伤真正的高分用户。
  const monoTone = total >= 12 && distinctRate < 0.25 && meanSec < 2;
  let variety = 100;
  if (mono) {
    variety = 15;
  } else {
    if (maxRun >= 8) variety -= Math.min(60, (maxRun - 7) * 8);           // 连击太长
    if (monoTone) variety -= Math.min(45, (0.25 - distinctRate) * 180);   // 又快又单调
  }
  variety = total < 5 ? 60 : Math.max(15, Math.round(variety));

  let score = Math.round(rhythm * 0.3 + pace * 0.4 + variety * 0.3);
  // 硬顶一：平均每题不到 1 秒，就是没在读 —— 单项分再好看，总分也不该好看。
  // 这两条阈值取得很保守（读一句中文陈述总得花上一秒），不会误伤正常快答的人。
  if (n >= 3) {
    if (meanSec < 0.6) score = Math.min(score, 20);
    else if (meanSec < 0.9) score = Math.min(score, 38);
  }
  // 硬顶二：全程一个答案，或八成以上都选同一项 —— 每个都答对是不可能的，多半是连点到底。
  // 节奏和用时都可能「看起来很认真」（慢慢点同一个选项也是慢慢点），所以必须单独设顶，
  // 否则「节奏 100 + 投入 90」会把这种最典型的敷衍托到 70 分以上。
  if (mono) score = Math.min(score, 30);
  else if (total >= 10 && maxRun >= Math.ceil(total * 0.8)) score = Math.min(score, 48);

  // —— 可疑信号（只列真正命中的，最多三条）——
  // 「秒过」要够多才列出来：只快了一道题很正常（比如第一题已知套路），
  // 把它当信号会和「稳如老狗」的评级自相矛盾。
  const signals = [];
  if (rushCount >= 2 && rushRate >= 0.1) signals.push({ w: 1, t: `有 ${rushCount} 题在 1 秒内过掉` });
  if (maxRun >= 8) signals.push({ w: 0.95, t: `最长连续 ${maxRun} 题选了同一个选项` });
  if (distinct === 1) signals.push({ w: 0.98, t: "所有题都选了同一个答案" });
  else if (monoTone) signals.push({ w: 0.75, t: `又答得快、又只用了 ${distinct} 种答案` });
  if (n >= 3 && cv >= 1.2) signals.push({ w: 0.7, t: `作答节奏忽快忽慢（离散度 ${cv.toFixed(1)}）` });
  signals.sort((a, b) => b.w - a.w);

  // 数据完整性说明 —— 这不是「可疑」，而是「仅供参考」：
  // 每道题在离开时都会结算用时，所以正常一整局下来覆盖率必然是 100%；
  // 只有「中途在某题上停留超过 30 分钟」（视为走神，用时被丢弃）才会缺。
  // 缺得越多，节奏与投入两项的参考价值越低，所以单独说明，而不是混进可疑信号里。
  const caveat = total >= 5 && n < total
    ? `另有 ${total - n} 题没有用时记录（中途离开过），不计入节奏与投入，这两项仅供参考。`
    : "";

  const GRADES = [
    [85, "稳如老狗", "#4ade80", "节奏、用时、选择分布都很自然，这份答案没什么可挑的。"],
    [70, "踏实作答", "#86efac", "整体是认真在答的，个别题的节奏有点跳，不影响可信度。"],
    [55, "略有起伏", "#fbbf24", "能看出在作答，但节奏偏快、或者选择有点单调。"],
    [40, "有点敷衍", "#fb923c", "速度和节奏已经贴近「随手点」的区间了。"],
    [25, "相当可疑", "#fb7185", "多项指标都指向「没怎么看题」，作者有权怀疑你。"],
    [-1, "基本是乱点", "#ef4444", "这个节奏配上这个选择分布，很像是一路点到底。"],
  ];
  const g = GRADES.find(([min]) => score >= min);

  return {
    score, rhythm, pace, variety,
    cv, meanSec, coverage, rushCount, maxRun, distinct, total, timed: n,
    tag: g[1], color: g[2], text: g[3],
    signals: signals.slice(0, 3).map((s) => s.t),
    caveat,
    perQuestion: qs.map((q) => ({
      id: q.id,
      ms: typeof timings[q.id] === "number" ? timings[q.id] : null,
    })),
  };
}

// —— 渲染「回答稳定度」模块 ——
function renderStability(data) {
  const box = $("stable-box");
  if (!box) return;
  const st = data.stability;
  // 缺少数据（例如站龄很老的存档）就整块隐藏，不要留一个 "--" 的壳
  if (!st) { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");

  const num = $("stable-num");
  num.textContent = st.score;
  num.style.color = st.color;

  const tag = $("stable-tag");
  tag.textContent = st.tag;
  tag.style.color = st.color;
  tag.style.borderColor = st.color;

  $("stable-text").textContent = st.text;

  const rows = [
    ["节奏平稳", st.rhythm, "每题用时的离散程度"],
    ["作答投入", st.pace, "平均每题耗时"],
    ["选择变化", st.variety, "选项使用广度与连击长度"],
  ];
  const mBox = $("stable-metrics");
  mBox.innerHTML = rows
    .map(
      ([k, v, hint]) =>
        `<div class="sm-row" title="${escapeHtml(hint)}">
           <span class="sm-k">${k}</span>
           <div class="sm-bar"><i data-w="${v}"></i></div>
           <span class="sm-v">${v}</span>
         </div>`
    )
    .join("");
  nextFrame(() => {
    mBox.querySelectorAll(".sm-bar i").forEach((el) => { el.style.width = el.dataset.w + "%"; });
  });
  // 每题用时柱：高度按时长归一到最高一条；不足 1 秒的标红，让「没读的题」一眼可见
  const bars = $("stable-bars");
  const all = st.perQuestion.map((x) => x.ms).filter((x) => typeof x === "number");
  const maxMs = Math.max(1, ...(all.length ? all : [1]));
  bars.innerHTML = st.perQuestion
    .map((x, i) => {
      if (typeof x.ms !== "number") {
        return `<i class="missing" title="第 ${i + 1} 题：没有用时记录"></i>`;
      }
      const h = Math.max(8, Math.round((x.ms / maxMs) * 100));
      const fast = x.ms < 1000;
      return `<i class="${fast ? "fast" : ""}" style="height:${h}%"
                 title="第 ${i + 1} 题：${(x.ms / 1000).toFixed(1)} 秒"></i>`;
    })
    .join("");

  $("stable-pace-hint").textContent =
    `平均 ${st.meanSec.toFixed(1)} 秒/题` + (st.rushCount ? ` · ${st.rushCount} 题偏快` : "");

  const note = st.signals.length
    ? "可疑信号：" + st.signals.join("；") + "。"
    : "没有发现明显的敷衍迹象——作答节奏和选择分布都挺自然。";
  $("stable-note").textContent = st.caveat ? note + " " + st.caveat : note;
}

// —— 更新分数圆环（SVG stroke-dashoffset，带绘制动画）——
function setRing(percent, color) {
  const R = 52;
  const circ = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, percent || 0));
  ringFg.style.stroke = color;
  ringFg.style.strokeDasharray = circ.toFixed(1);

  if (reduceMotion()) {
    ringFg.style.strokeDashoffset = (circ * (1 - pct / 100)).toFixed(1);
    return;
  }
  // 先瞬移回起点，强制回流后再设目标值 —— 触发一次“从 0 画到 N”的动画
  ringFg.style.transition = "none";
  ringFg.style.strokeDashoffset = circ.toFixed(1);
  void ringFg.getBoundingClientRect();
  ringFg.style.transition = "";
  nextFrame(() => {
    ringFg.style.strokeDashoffset = (circ * (1 - pct / 100)).toFixed(1);
  });
}

// —— 渲染结果 ——
// questions 可选：回看「上次结果」时传入当时那套题；不传则用本轮题集。
function renderResult(data, questions) {
  startScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  calcScreen.classList.add("hidden"); // 从计算页切过来时把它收起，避免两屏同时可见
  resultScreen.classList.remove("hidden");

  // 结果页要把「选项字母」还原成选项文案，所以必须知道当时用的是哪套题。
  // 回看历史结果时若沿用开始页预抽的题集，fmtUserAnswer 会找不到题目、整列显示「—」。
  state.resultQuestions =
    Array.isArray(questions) && questions.length ? questions : state.questions;

  const realTier = TIERS[data.levelKey] || TIERS.medium;
  const dims = computeDimensions(data.details);
  const best = dims.reduce((a, b) => (b.percent > a.percent ? b : a), dims[0]);
  const worst = dims.reduce((a, b) => (b.percent < a.percent ? b : a), dims[0]);

  state.result = { data, tier: realTier, dims, best, worst };

  if (data.cheated) {
    renderPunished(data);
  } else {
    renderReal(data, realTier, dims, best, worst);
  }
}

// 惩罚模式：隐藏分析区，显示提示与“解锁”按钮
function renderPunished(data) {
  const p = TIERS.punish;
  punishNotice.classList.remove("hidden");
  const reasons = (data.cheatReasons || [])
    .map((r) => CHEAT_REASON_TEXT[r] || r)
    .join("、");
  punishNotice.innerHTML =
    `⚠️ 检测到异常作答（${escapeHtml(reasons || "模式异常")}），本次报告已切换为<b>惩罚模式</b>。`;
  unlockBtn.classList.remove("hidden");
  analysisBox.classList.add("hidden");

  $("tier-title").textContent = p.title;
  $("tier-title").style.color = p.color;
  $("tier-desc").textContent = p.desc;
  $("raw-score").textContent = "本次得分已封印";
  $("match-percent").textContent = "??";
  $("match-percent").style.color = p.color;
  setRing(0, p.color);
}

// 正常显示：填充全部字段
function renderReal(data, tier, dims, best, worst) {
  punishNotice.classList.add("hidden");
  unlockBtn.classList.add("hidden");
  analysisBox.classList.remove("hidden");

  $("match-percent").style.color = tier.color;
  countUp($("match-percent"), data.matchPercent); // 数字滚动
  setRing(data.matchPercent, tier.color);         // 圆环绘制

  const tierTitle = $("tier-title");
  tierTitle.textContent = tier.title;
  tierTitle.style.color = tier.color;
  $("tier-desc").textContent = tier.desc;
  $("raw-score").textContent = `原始得分 ${data.rawScore} / ${data.total * 100}`;

  $("sum-percent").textContent = data.matchPercent + "%";
  $("sum-tier").textContent = tier.short;
  $("sum-tier").style.color = tier.color;
  $("sum-best").textContent = `${best.name} ${best.percent}%`;
  $("sum-worst").textContent = `${worst.name} ${worst.percent}%`;

  renderAvg(data);
  renderStability(data);

  renderRadar(dims);
  $("radar-summary").textContent =
    `最高维度是「${best.name}」${best.percent}%，最低维度是「${worst.name}」${worst.percent}%。` +
    `整体画像主要由「${best.name}」驱动。`;

  renderDimensionList(dims);

  $("rep-common").textContent =
    `你们在「${best.name}」上最合拍，同频度 ${best.percent}%。${dimComment(best, best.percent)}`;
  $("rep-diff").textContent =
    `而「${worst.name}」只对上了 ${worst.percent}%，${dimComment(worst, worst.percent)}`;
  $("rep-final").textContent = tier.final;

  const byDesc = [...data.details].sort((a, b) => b.score - a.score);
  const byAsc = [...data.details].sort((a, b) => a.score - b.score);
  renderBreakdown($("top-matches"), byDesc.slice(0, 3));
  renderBreakdown($("top-differences"), byAsc.slice(0, 3));
}

// 解锁真实结果
function unlockReal() {
  if (!state.result) return;
  const { data, tier, dims, best, worst } = state.result;
  renderReal(data, tier, dims, best, worst);
}

// —— 多维 SVG 雷达图（零依赖，带生长动画，轴数随 DIMENSIONS 动态）——
function renderRadar(dims) {
  const svg = $("radar");
  const cx = 160, cy = 150, R = 104;
  const n = dims.length;
  const ang = (i) => (-90 + (i * 360) / n) * (Math.PI / 180);
  const P = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  const pt = (i, r) => P(i, r).map((v) => v.toFixed(1)).join(",");

  // 底图：同心多边形 + 辐射线（深色主题用低透明度白）
  let s = "";
  [0.25, 0.5, 0.75, 1].forEach((k) => {
    s += `<polygon points="${dims.map((_, i) => pt(i, R * k)).join(" ")}"
      fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>`;
  });
  for (let i = 0; i < n; i++) {
    const [x, y] = P(i, R);
    s += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"
      stroke="rgba(255,255,255,0.07)" stroke-width="1"/>`;
  }

  // 数据层（整组缩放入场）
  const pts = dims.map((d, i) => pt(i, (R * Math.max(d.percent, 2)) / 100)).join(" ");
  let inner =
    `<polygon points="${pts}" fill="rgba(129,140,248,0.24)" stroke="#818cf8"
      stroke-width="2" stroke-linejoin="round"/>`;
  dims.forEach((d, i) => {
    const [x, y] = P(i, (R * d.percent) / 100);
    inner +=
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="rgba(129,140,248,0.22)"/>` +
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="#c7d2fe"/>` +
      `<text x="${x.toFixed(1)}" y="${(y - 10).toFixed(1)}" text-anchor="middle"
        font-size="10" font-weight="700" fill="#c7d2fe">${d.percent}</text>`;
  });
  s += `<g id="radar-data" style="transform-box:view-box;transform-origin:${cx}px ${cy}px">${inner}</g>`;

  // 轴标签（随生长过程淡入）
  dims.forEach((d, i) => {
    const [lx, ly] = P(i, R + 30);
    s += `<text class="radar-axis" x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}"
      text-anchor="middle" font-size="12" fill="rgba(214,222,246,0.92)">${d.icon} ${d.short}</text>`;
  });

  svg.innerHTML = s;

  const g = svg.querySelector("#radar-data");
  const axes = svg.querySelectorAll(".radar-axis");
  if (reduceMotion()) return;

  axes.forEach((t) => { t.style.opacity = "0"; });
  g.style.transform = "scale(0)";
  animate(
    950,
    (p) => {
      const e = 1 - Math.pow(1 - p, 3);
      g.style.transform = `scale(${e})`;
      const ao = Math.max(0, (e - 0.6) / 0.4).toFixed(2);
      axes.forEach((t) => { t.style.opacity = ao; });
    },
    // 收尾兜底：万一动画被中途掐断（切后台/降帧），也必须落到终态，
    // 否则雷达多边形会永远停在 scale(0) —— 内容在 DOM 里却看不见
    () => {
      g.style.transform = "scale(1)";
      axes.forEach((t) => { t.style.opacity = "1"; });
    }
  );
}

// —— 维度进度条列表（错峰入场 + 生长动画）——
function renderDimensionList(dims) {
  const box = $("dim-list");
  box.innerHTML = "";
  const fills = [];
  dims.forEach((d, i) => {
    const row = document.createElement("div");
    row.className = "dim-row";
    row.style.setProperty("--i", i); // 错峰
    row.innerHTML =
      `<div class="dim-top">
         <span class="dim-name">${d.icon} ${escapeHtml(d.name)}</span>
         <span class="dim-tag">${dimTag(d.percent)}</span>
         <span class="dim-pct">${d.percent}%</span>
       </div>
       <div class="dim-bar"><div class="dim-fill"></div></div>
       <div class="dim-comment">${escapeHtml(dimComment(d, d.percent))}</div>`;
    box.appendChild(row);
    fills.push([row.querySelector(".dim-fill"), d.percent]);
  });
  // 下一帧再赋宽度，触发进度条生长
  nextFrame(() => {
    fills.forEach(([el, p]) => { el.style.width = p + "%"; });
  });
}

function renderBreakdown(ul, items) {
  ul.innerHTML = "";
  if (!items || items.length === 0) {
    ul.innerHTML = '<li class="q">暂无数据</li>';
    return;
  }
  items.forEach((it, i) => {
    const li = document.createElement("li");
    li.style.setProperty("--i", i); // 错峰
    const mine = fmtUserAnswer(it);
    li.innerHTML =
      `<div class="q">${escapeHtml(it.text)}</div>` +
      `<span class="meta">你的选择 <b>${escapeHtml(mine)}</b> · 得分 <b>${it.score}</b></span>`;
    ul.appendChild(li);
  });
}

function fmtUserAnswer(detail) {
  const pool = state.resultQuestions.length ? state.resultQuestions : state.questions;
  const q = pool.find((x) => x.id === detail.questionId);
  if (!q || !detail.userAnswer) return "—";
  return detail.userAnswer
    .split("")
    .map((ch) => {
      const idx = ch.charCodeAt(0) - 65;
      return q.options[idx] ? cleanLabel(q.options[idx]) : ch;
    })
    .join(" / ");
}

// —— 生成结果文案（复制用）——
function buildResultText() {
  if (!state.result) return "";
  const { data, tier, dims, best, worst } = state.result;
  const lines = [
    `【你与作者的匹配度测试】`,
    `匹配度：${data.matchPercent}% · ${tier.title}`,
    `${tier.desc}`,
    ``,
    `各维度同频度：`,
    ...dims.map((d) => `· ${d.name}：${d.percent}%（${dimTag(d.percent)}）`),
    ``,
    `最强同频：${best.name} ${best.percent}%`,
    `最离谱分歧：${worst.name} ${worst.percent}%`,
  ];
  // 回答稳定度（本地计算的，老存档可能没有）
  const st = data.stability;
  if (st) {
    lines.push(``, `回答稳定度：${st.score} 分（${st.tag}）· 平均 ${st.meanSec.toFixed(1)} 秒/题`);
  }
  // 平均分对比（有数据时才写入）
  const s = data.stats;
  if (s && s.count > 0 && s.average != null) {
    const delta = data.matchPercent - s.average;
    lines.push(
      `全网平均：${s.average}%（${s.count} 人次） · 你${delta >= 0 ? "高于" : "低于"}平均 ${Math.abs(delta)} 分`
    );
  }
  lines.push(`${tier.final}`);
  return lines.join("\n");
}

async function copyResult() {
  const text = buildResultText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "已复制 ✓";
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); copyBtn.textContent = "已复制 ✓"; }
    catch { copyBtn.textContent = "复制失败"; }
    document.body.removeChild(ta);
  }
  setTimeout(() => { copyBtn.textContent = "复制结果文案"; }, 1600);
}

// —— 保存结果长图（html2canvas，本地引入）——
async function downloadResult() {
  if (typeof html2canvas !== "function") {
    showError("制图组件未加载，请刷新页面后重试。");
    return;
  }
  const card = resultScreen;
  const original = downloadBtn.textContent;
  downloadBtn.disabled = true;
  downloadBtn.textContent = "正在生成…";
  card.classList.add("capturing"); // 隐藏按钮、改用纯色背景
  try {
    const canvas = await html2canvas(card, {
      scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
      backgroundColor: "#0a0c16", // 深色底：与整站玻璃拟态主题一致
      useCORS: true,
      logging: false,
    });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    const score = state.result && !state.result.data.cheated
      ? state.result.data.matchPercent
      : "X";
    a.href = url;
    a.download = `匹配度测试结果_${score}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    downloadBtn.textContent = "已保存 ✓";
  } catch (err) {
    showError("生成结果图失败：" + err.message);
    downloadBtn.textContent = original;
  } finally {
    card.classList.remove("capturing");
    setTimeout(() => {
      downloadBtn.textContent = "保存结果长图";
      downloadBtn.disabled = false;
    }, 1500);
  }
}

// —— 重新测试 ——
function restart() {
  clearError();
  cancelAdvance();
  abortCalculating();
  state.quizActive = false;
  state.result = null;
  state.resultQuestions = [];
  state.timings = {};
  state.qEnteredAt = 0;
  resultScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  sampleIntoState(); // 重新抽样，开始页题量保持稳定（实际题集每轮不同）
  state.answers = {};
  state.current = 0;
  renderResume();  // 此时「未完成的测试」应已消失，只剩「查看上次结果」
  loadGlobalStats(); // 刷新平均分（含刚才这一次提交）
}

// —— 液态玻璃：让玻璃表面的镜面高光跟着指针走 ——
// 只改 CSS 变量（--mx / --my），完全不碰动画时钟：高光本身是「背景渐变的位置」，
// 由样式引擎负责合成，没有逐帧插值，所以不需要 animate()；指针不动时开销为零。
// 只在「精确指针 + 未要求减少动态效果」时启用；触屏 / 键盘 / reduced-motion 下
// 高光固定停在顶部中央（CSS 里的初始值），不追指针也不报错。
(function initLiquidSheen() {
  const fine = window.matchMedia
    && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine || reduceMotion()) return;

  let lastKey = "";
  const move = (el, x, y) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100));
    const py = Math.min(100, Math.max(0, ((y - r.top) / r.height) * 100));
    const key = `${el.id}|${px.toFixed(1)}|${py.toFixed(1)}`;
    if (key === lastKey) return; // 同一格内的连续移动不重复写样式
    lastKey = key;
    el.style.setProperty("--mx", `${px.toFixed(1)}%`);
    el.style.setProperty("--my", `${py.toFixed(1)}%`);
  };
  const panelOf = (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return null;
    const el = t.closest(".glass");
    return el && !el.classList.contains("hidden") ? el : null;
  };

  document.addEventListener("pointermove", (e) => {
    const el = panelOf(e);
    if (el) move(el, e.clientX, e.clientY);
  }, { passive: true });

  // 指针离开这块玻璃后把内侧属性摘掉，让高光回到 CSS 里的默认位置（左上角）。
  // 刻意不在这里写死一组「复位值」：默认位置属于样式的事，改样式时不必同步改 JS。
  document.addEventListener("pointerout", (e) => {
    const el = panelOf(e);
    if (!el) return;
    const to = e.relatedTarget;
    if (to instanceof Element && el.contains(to)) return; // 只是移到玻璃内部的子元素，不算离开
    el.style.removeProperty("--mx");
    el.style.removeProperty("--my");
  }, { passive: true });
})();

// —— 事件绑定 ——
startBtn.addEventListener("click", startQuiz);
prevBtn.addEventListener("click", goPrev);
nextBtn.addEventListener("click", goNext);
restartBtn.addEventListener("click", restart);
copyBtn.addEventListener("click", copyResult);
downloadBtn.addEventListener("click", downloadResult);
unlockBtn.addEventListener("click", unlockReal);

// —— 开始页存档卡片：用事件委托（卡片是按存档动态重建的）——
if (resumeSlot) {
  resumeSlot.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "resume") {
      const prog = readProgress();
      if (prog) resumeQuiz(prog);
      else renderResume(); // 存档刚好没了（如另一个标签页清掉）：刷新一下卡片
    } else if (act === "drop-progress") {
      clearProgress();
      renderResume();
    } else if (act === "view-result") {
      const last = readLastResult();
      if (last) viewSavedResult(last);
      else renderResume();
    } else if (act === "drop-result") {
      clearLastResult();
      renderResume();
    }
  });
}

// 开始页先渲染本机存档（继续答题 / 查看上次结果）——不依赖题库，可立即出图
renderResume();
// 页面加载 / 重新开始时拉取全网统计（开始页展示平均分）
loadGlobalStats();
// 初始化抽题量档位选择器（开始页可选 10 / 20 / 30 / 全部）
initModeSelector();
// 预载全量题库并抽好本轮题量（档位切换与开始页用时估算依赖它）
loadBank();
