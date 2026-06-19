const storageKey = "nextset-ios-v1";

const starterSplit = [
  {
    id: "push",
    name: "Push",
    restDays: 1,
    exercises: [
      makeExercise("ベンチプレス", 4, "6-8"),
      makeExercise("インクラインDBプレス", 3, "8-10"),
      makeExercise("ショルダープレス", 3, "8-10"),
      makeExercise("サイドレイズ", 4, "12-15"),
      makeExercise("トライセプスプレスダウン", 3, "10-12"),
    ],
  },
  {
    id: "pull",
    name: "Pull",
    restDays: 1,
    exercises: [
      makeExercise("懸垂", 4, "6-10"),
      makeExercise("ベントオーバーロウ", 4, "8-10"),
      makeExercise("ラットプルダウン", 3, "10-12"),
      makeExercise("リアレイズ", 3, "12-15"),
      makeExercise("EZバーカール", 3, "10-12"),
    ],
  },
  {
    id: "legs",
    name: "Legs",
    restDays: 2,
    exercises: [
      makeExercise("スクワット", 4, "5-8"),
      makeExercise("レッグプレス", 3, "10-12"),
      makeExercise("ルーマニアンDL", 3, "8-10"),
      makeExercise("レッグカール", 3, "10-12"),
      makeExercise("カーフレイズ", 4, "12-15"),
    ],
  },
];

const els = {
  tabs: document.querySelectorAll(".tab"),
  screens: document.querySelectorAll(".screen"),
  todayName: document.querySelector("#todayName"),
  nextWorkout: document.querySelector("#nextWorkout"),
  nextTiming: document.querySelector("#nextTiming"),
  progressCount: document.querySelector("#progressCount"),
  progressStatus: document.querySelector("#progressStatus"),
  progressFill: document.querySelector("#progressFill"),
  exerciseList: document.querySelector("#exerciseList"),
  sessionComment: document.querySelector("#sessionComment"),
  finishButton: document.querySelector("#finishButton"),
  finishHint: document.querySelector("#finishHint"),
  resetButton: document.querySelector("#resetButton"),
  calendarTitle: document.querySelector("#calendarTitle"),
  calendarGrid: document.querySelector("#calendarGrid"),
  selectedLogs: document.querySelector("#selectedLogs"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  dayTabs: document.querySelector("#dayTabs"),
  menuExercises: document.querySelector("#menuExercises"),
  addDayButton: document.querySelector("#addDayButton"),
  addExerciseButton: document.querySelector("#addExerciseButton"),
  dialog: document.querySelector("#exerciseDialog"),
  exerciseForm: document.querySelector("#exerciseForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  editingExerciseId: document.querySelector("#editingExerciseId"),
  exerciseName: document.querySelector("#exerciseName"),
  exerciseSets: document.querySelector("#exerciseSets"),
  exerciseReps: document.querySelector("#exerciseReps"),
};

let state = loadState();

bindEvents();
render();

function makeExercise(name, sets, reps) {
  return {
    id: crypto.randomUUID(),
    name,
    sets,
    reps,
  };
}

function todayKey() {
  return toDateKey(new Date());
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultState() {
  const now = new Date();
  return {
    activeTab: "today",
    currentIndex: 0,
    editingDayIndex: 0,
    monthCursor: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    selectedDate: todayKey(),
    split: structuredClone(starterSplit),
    setProgress: buildProgress(starterSplit[0]),
    comment: "",
    logs: [],
  };
}

function migrateState(saved) {
  if (!saved || !Array.isArray(saved.split)) return defaultState();
  const day = saved.split[saved.currentIndex] || saved.split[0];
  return {
    ...defaultState(),
    ...saved,
    setProgress: normalizeProgress(saved.setProgress, day),
    selectedDate: saved.selectedDate || todayKey(),
    logs: Array.isArray(saved.logs) ? saved.logs : [],
  };
}

function loadState() {
  try {
    return migrateState(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function buildProgress(day) {
  return day.exercises.map(() => 0);
}

function normalizeProgress(progress, day) {
  const base = Array.isArray(progress) ? progress : [];
  return day.exercises.map((exercise, index) => Math.min(Number(base[index] || 0), exercise.sets));
}

function currentDay() {
  return state.split[state.currentIndex] || state.split[0];
}

function nextDay() {
  return state.split[(state.currentIndex + 1) % state.split.length];
}

function editingDay() {
  return state.split[state.editingDayIndex] || state.split[0];
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeTab = tab.dataset.tab;
      render();
    });
  });

  els.finishButton.addEventListener("click", finishWorkout);
  els.sessionComment.addEventListener("input", () => {
    state.comment = els.sessionComment.value;
    saveState();
  });

  els.resetButton.addEventListener("click", () => {
    if (!confirm("デモデータを初期状態に戻しますか？")) return;
    state = defaultState();
    saveState();
    render();
  });

  els.prevMonth.addEventListener("click", () => moveMonth(-1));
  els.nextMonth.addEventListener("click", () => moveMonth(1));

  els.addDayButton.addEventListener("click", () => {
    const name = prompt("追加する分割名", "Arms");
    if (!name?.trim()) return;
    state.split.push({ id: crypto.randomUUID(), name: name.trim(), restDays: 1, exercises: [] });
    state.editingDayIndex = state.split.length - 1;
    saveState();
    render();
  });

  els.addExerciseButton.addEventListener("click", () => openExerciseDialog());

  els.exerciseForm.addEventListener("submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    saveExerciseFromDialog();
  });
}

function render() {
  renderTabs();
  renderToday();
  renderCalendar();
  renderMenu();
  saveState();
}

function renderTabs() {
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === state.activeTab));
  els.screens.forEach((screen) => screen.classList.toggle("active", screen.id === `screen-${state.activeTab}`));
}

function renderToday() {
  const day = currentDay();
  const next = nextDay();
  state.setProgress = normalizeProgress(state.setProgress, day);

  const totalSets = day.exercises.reduce((sum, exercise) => sum + Number(exercise.sets || 0), 0);
  const doneSets = state.setProgress.reduce((sum, count) => sum + count, 0);
  const allDone = totalSets > 0 && doneSets === totalSets;
  const percent = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  els.todayName.textContent = day.name;
  els.nextWorkout.textContent = next.name;
  els.nextTiming.textContent = next.restDays === 1
    ? `今日の${day.name}が終わったら、次回は${next.name}。`
    : `今日の${day.name}が終わったら、${next.restDays}日後くらいに${next.name}。`;
  els.progressCount.textContent = `${doneSets} / ${totalSets} sets`;
  els.progressStatus.textContent = allDone ? "全部終わりました" : "1セットずつ終わらせよう";
  els.progressFill.style.width = `${percent}%`;
  els.sessionComment.value = state.comment || "";
  els.finishButton.disabled = !allDone;
  els.finishHint.textContent = allDone ? "コメントを書いて完了できます。" : "全セット終わると押せます。";

  els.exerciseList.innerHTML = "";
  if (!day.exercises.length) {
    els.exerciseList.innerHTML = `<div class="empty-card">この日の種目がありません。Menuから追加できます。</div>`;
    return;
  }

  day.exercises.forEach((exercise, exerciseIndex) => {
    const done = state.setProgress[exerciseIndex] || 0;
    const isDone = done >= exercise.sets;
    const card = document.createElement("article");
    card.className = `exercise-card ${isDone ? "done" : ""}`;
    card.innerHTML = `
      <div class="exercise-main">
        <div>
          <h3>${escapeHtml(exercise.name)}</h3>
          <p>${exercise.sets} sets / ${escapeHtml(exercise.reps)} reps</p>
        </div>
        <strong>${done}/${exercise.sets}</strong>
      </div>
      <div class="set-row"></div>
      <button class="set-button" type="button" ${isDone ? "disabled" : ""}>${isDone ? "Done" : `Set ${done + 1} 完了`}</button>
    `;

    const setRow = card.querySelector(".set-row");
    for (let setIndex = 0; setIndex < exercise.sets; setIndex += 1) {
      const dot = document.createElement("button");
      dot.className = `set-dot ${setIndex < done ? "checked" : ""}`;
      dot.type = "button";
      dot.textContent = String(setIndex + 1);
      dot.addEventListener("click", () => {
        state.setProgress[exerciseIndex] = setIndex < done ? setIndex : setIndex + 1;
        render();
      });
      setRow.appendChild(dot);
    }

    card.querySelector(".set-button").addEventListener("click", () => {
      state.setProgress[exerciseIndex] = Math.min(done + 1, exercise.sets);
      render();
    });
    els.exerciseList.appendChild(card);
  });
}

function finishWorkout() {
  const day = currentDay();
  const totalSets = day.exercises.reduce((sum, exercise) => sum + Number(exercise.sets || 0), 0);
  const doneSets = state.setProgress.reduce((sum, count) => sum + count, 0);
  const date = todayKey();

  state.logs.unshift({
    id: crypto.randomUUID(),
    date,
    completedAt: new Date().toISOString(),
    dayName: day.name,
    sets: doneSets,
    totalSets,
    comment: state.comment.trim(),
    exercises: day.exercises.map((exercise, index) => ({
      name: exercise.name,
      sets: state.setProgress[index] || 0,
      targetSets: exercise.sets,
      reps: exercise.reps,
    })),
  });

  state.currentIndex = (state.currentIndex + 1) % state.split.length;
  state.setProgress = buildProgress(currentDay());
  state.comment = "";
  state.selectedDate = date;
  state.monthCursor = date.slice(0, 7);
  saveState();
  render();
  els.finishHint.textContent = `${day.name}完了。次は${currentDay().name}です。`;
}

function renderCalendar() {
  const [year, month] = state.monthCursor.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const startOffset = first.getDay();
  const totalCells = Math.ceil((startOffset + last.getDate()) / 7) * 7;
  const logsByDate = groupLogsByDate();

  els.calendarTitle.textContent = `${year}年${month}月`;
  els.calendarGrid.innerHTML = "";

  for (let cell = 0; cell < totalCells; cell += 1) {
    const dayNumber = cell - startOffset + 1;
    const date = new Date(year, month - 1, dayNumber);
    const dateKey = toDateKey(date);
    const inMonth = dayNumber >= 1 && dayNumber <= last.getDate();
    const logs = logsByDate[dateKey] || [];
    const button = document.createElement("button");
    button.className = `calendar-day ${inMonth ? "" : "muted"} ${dateKey === state.selectedDate ? "selected" : ""} ${logs.length ? "trained" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span>${date.getDate()}</span>
      ${logs.length ? `<strong>${escapeHtml(logs[0].dayName)}</strong>` : ""}
    `;
    button.addEventListener("click", () => {
      state.selectedDate = dateKey;
      render();
    });
    els.calendarGrid.appendChild(button);
  }

  renderSelectedLogs(logsByDate[state.selectedDate] || []);
}

function renderSelectedLogs(logs) {
  const displayDate = state.selectedDate.replaceAll("-", "/");
  if (!logs.length) {
    els.selectedLogs.innerHTML = `<div class="empty-card">${displayDate}<br>記録はまだありません。</div>`;
    return;
  }

  els.selectedLogs.innerHTML = logs.map((log) => `
    <div class="log-item">
      <div>
        <h3>${escapeHtml(log.dayName)}</h3>
        <p>${log.sets}/${log.totalSets} sets</p>
      </div>
      <p>${escapeHtml(log.comment || "コメントなし")}</p>
    </div>
  `).join("");
}

function groupLogsByDate() {
  return state.logs.reduce((grouped, log) => {
    grouped[log.date] ||= [];
    grouped[log.date].push(log);
    return grouped;
  }, {});
}

function moveMonth(delta) {
  const [year, month] = state.monthCursor.split("-").map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  state.monthCursor = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  render();
}

function renderMenu() {
  state.editingDayIndex = Math.min(state.editingDayIndex, state.split.length - 1);
  const day = editingDay();

  els.dayTabs.innerHTML = "";
  state.split.forEach((splitDay, index) => {
    const button = document.createElement("button");
    button.className = `day-tab ${index === state.editingDayIndex ? "active" : ""}`;
    button.type = "button";
    button.textContent = splitDay.name;
    button.addEventListener("click", () => {
      state.editingDayIndex = index;
      render();
    });
    els.dayTabs.appendChild(button);
  });

  els.menuExercises.innerHTML = `
    <article class="menu-day-card">
      <label>分割名</label>
      <input id="dayNameInput" value="${escapeAttribute(day.name)}" />
      <label>次までの日数</label>
      <input id="restDaysInput" type="number" min="1" max="7" value="${day.restDays}" />
    </article>
  `;

  els.menuExercises.querySelector("#dayNameInput").addEventListener("input", (event) => {
    day.name = event.target.value || "Untitled";
    renderToday();
    renderMenuTabsOnly();
    saveState();
  });

  els.menuExercises.querySelector("#restDaysInput").addEventListener("input", (event) => {
    day.restDays = Number(event.target.value || 1);
    renderToday();
    saveState();
  });

  if (!day.exercises.length) {
    els.menuExercises.insertAdjacentHTML("beforeend", `<div class="empty-card">種目がありません。</div>`);
    return;
  }

  day.exercises.forEach((exercise) => {
    const item = document.createElement("article");
    item.className = "menu-item";
    item.innerHTML = `
      <div>
        <h3>${escapeHtml(exercise.name)}</h3>
        <p>${exercise.sets} sets / ${escapeHtml(exercise.reps)} reps</p>
      </div>
      <div class="menu-actions">
        <button type="button" data-action="edit">編集</button>
        <button type="button" data-action="delete">削除</button>
      </div>
    `;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => openExerciseDialog(exercise.id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => {
      day.exercises = day.exercises.filter((candidate) => candidate.id !== exercise.id);
      if (state.editingDayIndex === state.currentIndex) state.setProgress = normalizeProgress(state.setProgress, day);
      render();
    });
    els.menuExercises.appendChild(item);
  });
}

function renderMenuTabsOnly() {
  els.dayTabs.querySelectorAll(".day-tab").forEach((tab, index) => {
    tab.textContent = state.split[index].name;
  });
}

function openExerciseDialog(exerciseId = "") {
  const day = editingDay();
  const exercise = day.exercises.find((candidate) => candidate.id === exerciseId);
  els.dialogTitle.textContent = exercise ? "種目を編集" : "種目を追加";
  els.editingExerciseId.value = exercise?.id || "";
  els.exerciseName.value = exercise?.name || "";
  els.exerciseSets.value = exercise?.sets || 3;
  els.exerciseReps.value = exercise?.reps || "8-10";
  els.dialog.showModal();
  els.exerciseName.focus();
}

function saveExerciseFromDialog() {
  const day = editingDay();
  const id = els.editingExerciseId.value;
  const existing = day.exercises.find((exercise) => exercise.id === id);
  const payload = {
    id: id || crypto.randomUUID(),
    name: els.exerciseName.value.trim(),
    sets: Number(els.exerciseSets.value || 3),
    reps: els.exerciseReps.value.trim() || "8-10",
  };

  if (!payload.name) return;
  if (existing) Object.assign(existing, payload);
  else day.exercises.push(payload);

  if (state.editingDayIndex === state.currentIndex) {
    state.setProgress = normalizeProgress(state.setProgress, day);
  }

  els.dialog.close();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
