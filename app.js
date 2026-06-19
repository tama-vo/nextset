const storageKey = "nextset-minimal-v1";

const split = [
  {
    name: "Push",
    restDays: 1,
    exercises: [
      { name: "ベンチプレス", sets: 4, reps: "6-8" },
      { name: "インクラインDBプレス", sets: 3, reps: "8-10" },
      { name: "ショルダープレス", sets: 3, reps: "8-10" },
      { name: "サイドレイズ", sets: 4, reps: "12-15" },
      { name: "トライセプスプレスダウン", sets: 3, reps: "10-12" },
    ],
  },
  {
    name: "Pull",
    restDays: 1,
    exercises: [
      { name: "懸垂", sets: 4, reps: "6-10" },
      { name: "ベントオーバーロウ", sets: 4, reps: "8-10" },
      { name: "ラットプルダウン", sets: 3, reps: "10-12" },
      { name: "リアレイズ", sets: 3, reps: "12-15" },
      { name: "EZバーカール", sets: 3, reps: "10-12" },
    ],
  },
  {
    name: "Legs",
    restDays: 2,
    exercises: [
      { name: "スクワット", sets: 4, reps: "5-8" },
      { name: "レッグプレス", sets: 3, reps: "10-12" },
      { name: "ルーマニアンDL", sets: 3, reps: "8-10" },
      { name: "レッグカール", sets: 3, reps: "10-12" },
      { name: "カーフレイズ", sets: 4, reps: "12-15" },
    ],
  },
];

const els = {
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
};

let state = loadState();

bindEvents();
render();

function defaultState() {
  return {
    currentIndex: 0,
    setProgress: buildProgress(split[0]),
    comment: "",
    lastCompletedAt: null,
  };
}

function buildProgress(day) {
  return day.exercises.map(() => 0);
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || !Number.isInteger(saved.currentIndex)) return defaultState();
    return saved;
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function currentDay() {
  return split[state.currentIndex] || split[0];
}

function nextDay() {
  return split[(state.currentIndex + 1) % split.length];
}

function bindEvents() {
  els.finishButton.addEventListener("click", finishWorkout);
  els.sessionComment.addEventListener("input", () => {
    state.comment = els.sessionComment.value;
    saveState();
  });
  els.resetButton.addEventListener("click", () => {
    state = defaultState();
    saveState();
    render();
  });
}

function render() {
  const day = currentDay();
  const next = nextDay();
  const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const doneSets = state.setProgress.reduce((sum, count) => sum + count, 0);
  const percent = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;
  const allDone = doneSets === totalSets;

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

  renderExercises(day);
  saveState();
}

function renderExercises(day) {
  els.exerciseList.innerHTML = "";
  day.exercises.forEach((exercise, exerciseIndex) => {
    const done = state.setProgress[exerciseIndex] || 0;
    const isDone = done >= exercise.sets;
    const article = document.createElement("article");
    article.className = `exercise ${isDone ? "done" : ""}`;
    article.innerHTML = `
      <div class="exercise-main">
        <div>
          <h3>${exercise.name}</h3>
          <p>${exercise.sets} sets / ${exercise.reps} reps</p>
        </div>
        <span>${done}/${exercise.sets}</span>
      </div>
      <div class="set-row" aria-label="${exercise.name}のセット"></div>
      <button class="set-button" type="button" ${isDone ? "disabled" : ""}>
        ${isDone ? "Done" : `Set ${done + 1} 完了`}
      </button>
    `;

    const setRow = article.querySelector(".set-row");
    for (let setIndex = 0; setIndex < exercise.sets; setIndex += 1) {
      const dot = document.createElement("button");
      dot.className = `set-dot ${setIndex < done ? "checked" : ""}`;
      dot.type = "button";
      dot.textContent = String(setIndex + 1);
      dot.ariaLabel = `${exercise.name} set ${setIndex + 1}`;
      dot.addEventListener("click", () => {
        state.setProgress[exerciseIndex] = setIndex < done ? setIndex : setIndex + 1;
        render();
      });
      setRow.appendChild(dot);
    }

    article.querySelector(".set-button").addEventListener("click", () => {
      state.setProgress[exerciseIndex] = Math.min(done + 1, exercise.sets);
      render();
    });

    els.exerciseList.appendChild(article);
  });
}

function finishWorkout() {
  const finishedDay = currentDay();
  state.currentIndex = (state.currentIndex + 1) % split.length;
  state.setProgress = buildProgress(currentDay());
  state.lastCompletedAt = new Date().toISOString();
  state.comment = "";
  saveState();
  render();
  els.finishHint.textContent = `${finishedDay.name}完了。次は${currentDay().name}です。`;
}
