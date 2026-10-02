// script.js —— 前端逻辑（纯原生 JS，不含任何作者标准答案）
// 关键安全约束：本文件不得出现 author_answer 或类似变量；答案只由后端计算。
// 题型：单选（single，单字母）/ 多选（multiple，字母组合，如 'ABC'）。
//       其中选项固定为「完全符合～完全不符合」的五级题，界面上单独标记为「符合度」。
// 特性：单选选中后自动跳题；结果页含多维雷达、维度剖析、深度报告、
//       反作弊惩罚模式与结果长图导出。

// —— 等级/称号文案（与后端 levelKey 对应）；90+ 即为“可以跟作者配了” ——
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
};

// DOM 引用
const $ = (id) => document.getElementById(id);
const startScreen = $("start-screen");
const quizScreen = $("quiz-screen");
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

// 数字滚动（rAF + 三次缓出）
function countUp(el, target, duration = 950) {
  if (!el) return;
  const to = Number(target) || 0;
  if (reduceMotion() || to <= 0) {
    el.textContent = to;
    return;
  }
  const start = performance.now();
  el.textContent = "0";
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * eased);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
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
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        avgYouFill.style.width = youW;
        avgMeanFill.style.width = meanW;
      })
    );
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
  if (mine >= 90) note = "90 分以上，你已超越绝大多数人，作者在线等你私信。";
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
      sampleIntoState();
      renderStartChips(); // 依据当前档位刷新用时估算
    }
  } catch {
    /* 忽略：开始测试时会再次尝试拉取 */
  }
}

// 从已载题库中为本轮抽取题目（每次开始/重开、切换档位都会重新随机抽）
function sampleIntoState() {
  state.questions = sampleByDimension(state.bank, resolveTargetCount(state.targetPreset));
}

// —— 抽题量档位选择器 ——
// 依据 COUNT_PRESETS 渲染按钮（含「全部」），点击即切换档位并重新抽样。
function applyTargetPreset(preset) {
  state.targetPreset = preset;
  if (modeSelect) {
    modeSelect.querySelectorAll("[data-count]").forEach((b) => {
      b.classList.toggle("is-active", Number(b.dataset.count) === preset);
    });
  }
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

// —— 开始测试 ——
async function startQuiz() {
  clearError();
  startBtn.disabled = true;
  startBtn.textContent = "加载中…";
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
    state.current = 0;
    state.result = null;
    state.startTime = Date.now(); // 计时开始（用于反作弊）
    startScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");
    renderQuestion();
  } catch (err) {
    showError("加载题目失败：" + err.message);
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = "开始测试";
  }
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
  q.options.forEach((label, idx) => {
    const letter = letterOf(idx);
    const el = document.createElement("div");
    el.className = "option" + (chosenSet.has(letter) ? " selected" : "");
    el.dataset.letter = letter;
    el.style.setProperty("--i", idx); // 选项错峰入场
    el.innerHTML =
      `<span class="dot">${letter}</span>` +
      `<span class="opt-label">${escapeHtml(cleanLabel(label))}</span>`;
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
    state.current -= 1;
    renderQuestion();
  }
}
function goNext() {
  cancelAdvance();
  const total = state.questions.length;
  const q = state.questions[state.current];
  if (state.answers[q.id] === undefined) return;
  if (state.current < total - 1) {
    state.current += 1;
    renderQuestion();
  } else {
    submitAnswers();
  }
}

// —— 提交答案，获取结果 ——
async function submitAnswers() {
  clearError();
  cancelAdvance();
  if (state.submitting) return;
  state.submitting = true;
  nextBtn.disabled = true;
  nextBtn.textContent = "计算中…";

  const answers = state.questions.map((q) => ({
    questionId: q.id,
    userAnswer: state.answers[q.id] || "",
  }));

  const durationMs = state.startTime ? Date.now() - state.startTime : 0;

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, durationMs }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "提交失败");
    renderResult(data);
  } catch (err) {
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
function dimTag(p) {
  if (p >= 85) return "完全一致";
  if (p >= 70) return "高度同频";
  if (p >= 40) return "半斤八两";
  if (p >= 20) return "有点代沟";
  return "隔着一个次元";
}
function dimComment(dim, p) {
  if (p >= 70) return dim.hi;
  if (p >= 40) return dim.mid;
  return dim.lo;
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
  requestAnimationFrame(() => {
    ringFg.style.strokeDashoffset = (circ * (1 - pct / 100)).toFixed(1);
  });
}

// —— 渲染结果 ——
function renderResult(data) {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

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
  const dur = 950;
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    g.style.transform = `scale(${e})`;
    const ao = Math.max(0, (e - 0.6) / 0.4).toFixed(2);
    axes.forEach((t) => { t.style.opacity = ao; });
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
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
  requestAnimationFrame(() => {
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
  const q = state.questions.find((x) => x.id === detail.questionId);
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
  resultScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  sampleIntoState(); // 重新抽样，开始页题量保持稳定（实际题集每轮不同）
  state.answers = {};
  state.current = 0;
  state.result = null;
  loadGlobalStats(); // 刷新平均分（含刚才这一次提交）
}

// —— 事件绑定 ——
startBtn.addEventListener("click", startQuiz);
prevBtn.addEventListener("click", goPrev);
nextBtn.addEventListener("click", goNext);
restartBtn.addEventListener("click", restart);
copyBtn.addEventListener("click", copyResult);
downloadBtn.addEventListener("click", downloadResult);
unlockBtn.addEventListener("click", unlockReal);

// 页面加载 / 重新开始时拉取全网统计（开始页展示平均分）
loadGlobalStats();
// 初始化抽题量档位选择器（开始页可选 10 / 20 / 30 / 全部）
initModeSelector();
// 预载全量题库并抽好本轮题量（档位切换与开始页用时估算依赖它）
loadBank();
