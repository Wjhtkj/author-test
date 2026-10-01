// script.js —— 前端逻辑（纯原生 JS，不含任何作者标准答案）
// 关键安全约束：本文件不得出现 author_answer 或类似变量；答案只由后端计算。
// 题型：单选（single，单字母）/ 多选（multiple，字母组合，如 'ABC'）。

// 等级文案映射（与后端 levelKey 对应，作为兜底）
const LEVELS = {
  soulmate: "灵魂同频，你们很像",
  high: "高度匹配，默契不错",
  medium: "中等匹配，有同有异",
  low: "差异较大，但可能互补",
  none: "完全不同频，两个世界",
};

// 应用状态
const state = {
  questions: [], // [{ id, text, type, options: [...] }]
  answers: {},   // { [questionId]: 'A' | 'ABC' }（字母组合字符串）
  current: 0,
  submitting: false,
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
const questionText = $("question-text");
const qTypeBadge = $("q-type");
const optionsBox = $("options");
const progressFill = $("progress-fill");
const progressText = $("progress-text");
const errorToast = $("error-toast");

// —— 提示工具 ——
function showError(msg) {
  errorToast.textContent = msg;
  errorToast.classList.remove("hidden");
}
function clearError() {
  errorToast.classList.add("hidden");
  errorToast.textContent = "";
}

// —— 开始测试：拉取题目（不含答案）——
async function startQuiz() {
  clearError();
  startBtn.disabled = true;
  startBtn.textContent = "加载中…";
  try {
    const res = await fetch("/api/questions");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!data.questions || data.questions.length === 0) {
      throw new Error("题库为空，请先在 D1 中初始化数据。");
    }
    state.questions = data.questions;
    state.answers = {};
    state.current = 0;
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

// 由选项下标推导字母：0->A, 1->B ...
function letterOf(index) {
  return String.fromCharCode(65 + index);
}

// —— 渲染当前题目 ——
function renderQuestion() {
  const q = state.questions[state.current];
  const total = state.questions.length;

  questionText.textContent = q.text;
  qTypeBadge.textContent = q.type === "single" ? "单选" : "多选（可多选）";
  qTypeBadge.className = "q-type " + (q.type === "single" ? "single" : "multiple");

  // 进度
  const pct = ((state.current + 1) / total) * 100;
  progressFill.style.width = pct + "%";
  progressText.textContent = `${state.current + 1} / ${total}`;

  // 已选集合
  const chosenStr = state.answers[q.id];
  const chosenSet = new Set(chosenStr ? chosenStr.split("") : []);

  // 选项
  optionsBox.innerHTML = "";
  q.options.forEach((label, idx) => {
    const letter = letterOf(idx);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option" + (chosenSet.has(letter) ? " selected" : "");
    btn.innerHTML = `<span class="dot">${letter}</span><span>${escapeHtml(label)}</span>`;
    btn.addEventListener("click", () => toggleOption(letter, q.type));
    optionsBox.appendChild(btn);
  });

  prevBtn.disabled = state.current === 0;

  const isLast = state.current === total - 1;
  nextBtn.textContent = isLast ? "查看结果" : "下一题";
  nextBtn.disabled = !chosenStr; // 未作答则禁用
}

// —— 选择 / 取消某选项 ——
function toggleOption(letter, type) {
  clearError();
  const q = state.questions[state.current];
  const id = q.id;

  if (type === "single") {
    // 单选：直接替换为该选项（再次点击同一项则取消）
    if (state.answers[id] === letter) {
      delete state.answers[id];
    } else {
      state.answers[id] = letter;
    }
  } else {
    // 多选：切换成员
    const set = new Set(state.answers[id] ? state.answers[id].split("") : []);
    if (set.has(letter)) set.delete(letter);
    else set.add(letter);
    if (set.size === 0) delete state.answers[id];
    else state.answers[id] = [...set].sort().join("");
  }

  renderQuestion(); // 重渲染以更新选中态与按钮可用性
}

// —— 上一题 / 下一题 ——
function goPrev() {
  if (state.current > 0) {
    state.current -= 1;
    renderQuestion();
  }
}
function goNext() {
  const total = state.questions.length;
  const q = state.questions[state.current];
  if (state.answers[q.id] === undefined) return; // 未作答不可前进
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
  if (state.submitting) return;
  state.submitting = true;
  nextBtn.disabled = true;
  nextBtn.textContent = "计算中…";

  // 组装答案数组（顺序与题目一致）：userAnswer 为字母组合字符串
  const answers = state.questions.map((q) => ({
    questionId: q.id,
    userAnswer: state.answers[q.id],
  }));

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "提交失败");
    }
    renderResult(data);
  } catch (err) {
    showError("提交失败：" + err.message);
    nextBtn.disabled = false;
    nextBtn.textContent = "查看结果";
  } finally {
    state.submitting = false;
  }
}

// —— 渲染结果 ——
function renderResult(data) {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const circle = document.querySelector(".score-circle");
  circle.style.setProperty("--p", data.matchPercent + "%");
  $("match-percent").textContent = data.matchPercent;
  $("level-text").textContent = data.level || LEVELS[data.levelKey] || "";
  $("raw-score").textContent = `原始分 ${data.rawScore} / ${data.total * 100}`;

  renderBreakdown($("top-matches"), data.topMatches);
  renderBreakdown($("top-differences"), data.topDifferences);
}

function renderBreakdown(ul, items) {
  ul.innerHTML = "";
  if (!items || items.length === 0) {
    ul.innerHTML = '<li class="q">暂无数据</li>';
    return;
  }
  items.forEach((it) => {
    const li = document.createElement("li");
    // 把字母组合拆成带斜杠的展示，如 'ABC' -> 'A / B / C'
    const fmt = (s) =>
      s
        ? s
            .split("")
            .map((c) => c + ".")
            .join(" ")
        : "—";
    const authorPart =
      it.authorAnswer !== undefined
        ? ` 你的选择 <b>${fmt(it.userAnswer)}</b> · 作者 <b>${fmt(it.authorAnswer)}</b> · 得分 <b>${it.score}</b>`
        : ` 你的选择 <b>${fmt(it.userAnswer)}</b> · 得分 <b>${it.score}</b>`;
    li.innerHTML =
      `<div class="q">${escapeHtml(it.text)}</div>` +
      `<span class="meta">${authorPart}</span>`;
    ul.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// —— 重新测试 ——
function restart() {
  clearError();
  resultScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  state.questions = [];
  state.answers = {};
  state.current = 0;
}

// —— 事件绑定 ——
startBtn.addEventListener("click", startQuiz);
prevBtn.addEventListener("click", goPrev);
nextBtn.addEventListener("click", goNext);
restartBtn.addEventListener("click", restart);
