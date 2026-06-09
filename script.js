const STORAGE_KEY = "odaLogRecords";
const STAFF_KEY = "odaLogStaff";

const moodIcons = {
  "元気": "☀️",
  "普通": "🌿",
  "そわそわ": "🌪️",
  "落ち込み": "🌧️",
  "眠い": "🌙",
  "イライラ": "⚡",
  "しんどい": "🫠"
};

const defaultStaff = [
  { name: "佐藤さん", visible: true },
  { name: "田中さん", visible: true },
  { name: "鈴木さん", visible: true },
  { name: "山本さん", visible: false },
  { name: "職員A", visible: false },
  { name: "職員B", visible: false },
  { name: "職員C", visible: false }
];

const dateInput = document.getElementById("dateInput");

const morningMood = document.getElementById("morningMood");
const morningTodo = document.getElementById("morningTodo");
const morningNote = document.getElementById("morningNote");

const afternoonMood = document.getElementById("afternoonMood");
const afternoonDone = document.getElementById("afternoonDone");
const afternoonImpression = document.getElementById("afternoonImpression");

const saveMorningButton = document.getElementById("saveMorningButton");
const saveAfternoonButton = document.getElementById("saveAfternoonButton");
const deleteButton = document.getElementById("deleteButton");

const morningStaffSelect = document.getElementById("morningStaffSelect");
const afternoonStaffSelect = document.getElementById("afternoonStaffSelect");

const morningStaffComment = document.getElementById("morningStaffComment");
const afternoonStaffComment = document.getElementById("afternoonStaffComment");

const morningStampButton = document.getElementById("morningStampButton");
const afternoonStampButton = document.getElementById("afternoonStampButton");

const morningStampDisplay = document.getElementById("morningStampDisplay");
const afternoonStampDisplay = document.getElementById("afternoonStampDisplay");

const calendar = document.getElementById("calendar");
const monthLabel = document.getElementById("monthLabel");
const prevMonthButton = document.getElementById("prevMonthButton");
const nextMonthButton = document.getElementById("nextMonthButton");

const staffSettingsList = document.getElementById("staffSettingsList");
const recordDetail = document.getElementById("recordDetail");

let currentCalendarDate = new Date();

function getTodayString() {
  return formatDate(new Date());
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadRecords() {
  const rawData = localStorage.getItem(STORAGE_KEY);

  if (!rawData) {
    return {};
  }

  try {
    return JSON.parse(rawData);
  } catch (error) {
    console.error("記録データの読み込みに失敗しました", error);
    return {};
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function loadStaff() {
  const rawData = localStorage.getItem(STAFF_KEY);

  if (!rawData) {
    return defaultStaff;
  }

  try {
    const savedStaff = JSON.parse(rawData);

    return defaultStaff.map((defaultMember) => {
      const savedMember = savedStaff.find((member) => member.name === defaultMember.name);

      if (!savedMember) {
        return defaultMember;
      }

      return {
        name: defaultMember.name,
        visible: savedMember.visible
      };
    });
  } catch (error) {
    console.error("職員データの読み込みに失敗しました", error);
    return defaultStaff;
  }
}

function saveStaff(staff) {
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
}

function createEmptyRecord() {
  return {
    morning: {
      mood: "",
      todo: "",
      note: "",
      stamp: null
    },
    afternoon: {
      mood: "",
      done: "",
      impression: "",
      stamp: null
    }
  };
}

function normalizeRecord(record) {
  const emptyRecord = createEmptyRecord();

  return {
    morning: {
      mood: record?.morning?.mood || emptyRecord.morning.mood,
      todo: record?.morning?.todo || emptyRecord.morning.todo,
      note: record?.morning?.note || emptyRecord.morning.note,
      stamp: record?.morning?.stamp || null
    },
    afternoon: {
      mood: record?.afternoon?.mood || emptyRecord.afternoon.mood,
      done: record?.afternoon?.done || emptyRecord.afternoon.done,
      impression: record?.afternoon?.impression || emptyRecord.afternoon.impression,
      stamp: record?.afternoon?.stamp || null
    }
  };
}

function getSelectedDateRecord() {
  const records = loadRecords();
  const selectedDate = dateInput.value;

  return normalizeRecord(records[selectedDate]);
}

function loadFormByDate() {
  const record = getSelectedDateRecord();

  morningMood.value = record.morning.mood;
  morningTodo.value = record.morning.todo;
  morningNote.value = record.morning.note;

  afternoonMood.value = record.afternoon.mood;
  afternoonDone.value = record.afternoon.done;
  afternoonImpression.value = record.afternoon.impression;

  renderAllStaffSelects();
  renderAllStamps();
}

function saveMorningRecord() {
  const records = loadRecords();
  const selectedDate = dateInput.value;
  const record = normalizeRecord(records[selectedDate]);

  record.morning.mood = morningMood.value;
  record.morning.todo = morningTodo.value.trim();
  record.morning.note = morningNote.value.trim();

  records[selectedDate] = record;
  saveRecords(records);

  renderCalendar();
renderRecordDetail(selectedDate);
alert("午前の記録を保存したぞ。");
}

function saveAfternoonRecord() {
  const records = loadRecords();
  const selectedDate = dateInput.value;
  const record = normalizeRecord(records[selectedDate]);

  record.afternoon.mood = afternoonMood.value;
  record.afternoon.done = afternoonDone.value.trim();
  record.afternoon.impression = afternoonImpression.value.trim();

  records[selectedDate] = record;
  saveRecords(records);

  renderCalendar();
renderRecordDetail(selectedDate);
alert("午後の記録を保存したぞ。");
}

function saveCurrentPeriodSilently(period) {
  const records = loadRecords();
  const selectedDate = dateInput.value;
  const record = normalizeRecord(records[selectedDate]);

  if (period === "morning") {
    record.morning.mood = morningMood.value;
    record.morning.todo = morningTodo.value.trim();
    record.morning.note = morningNote.value.trim();
  }

  if (period === "afternoon") {
    record.afternoon.mood = afternoonMood.value;
    record.afternoon.done = afternoonDone.value.trim();
    record.afternoon.impression = afternoonImpression.value.trim();
  }

  records[selectedDate] = record;
  saveRecords(records);
}

function deleteCurrentRecord() {
  const selectedDate = dateInput.value;
  const records = loadRecords();

  if (!records[selectedDate]) {
    alert("この日の記録はまだないよ。");
    return;
  }

  const confirmed = confirm("この日の午前・午後の記録を全部削除する？");

  if (!confirmed) {
    return;
  }

  delete records[selectedDate];
  saveRecords(records);

  loadFormByDate();
  renderCalendar();
}

function setStamp(period) {
  saveCurrentPeriodSilently(period);

  const targetSelect = period === "morning"
    ? morningStaffSelect
    : afternoonStaffSelect;

  const staffName = targetSelect.value;

  if (!staffName) {
    alert("職員を選択してね。");
    return;
  }

  const records = loadRecords();
  const selectedDate = dateInput.value;
  const record = normalizeRecord(records[selectedDate]);

  const targetComment = period === "morning"
  ? morningStaffComment
  : afternoonStaffComment;

record[period].stamp = {
  staffName: staffName,
  stampedAt: new Date().toISOString(),
  comment: targetComment.value.trim()
};

  records[selectedDate] = record;
  saveRecords(records);

  renderStaffSelect(period);
  renderStamp(period);
  renderCalendar();
  renderRecordDetail(selectedDate);
}

function renderAllStaffSelects() {
  renderStaffSelect("morning");
  renderStaffSelect("afternoon");
}

function renderStaffSelect(period) {
  const staff = loadStaff();
  const visibleStaff = staff.filter((member) => member.visible);
  const record = getSelectedDateRecord();

  const targetSelect = period === "morning"
    ? morningStaffSelect
    : afternoonStaffSelect;

  const targetComment = period === "morning"
    ? morningStaffComment
    : afternoonStaffComment;

  targetSelect.innerHTML = `<option value="">職員を選択</option>`;

  visibleStaff.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.name;
    option.textContent = member.name;

    if (record[period].stamp && record[period].stamp.staffName === member.name) {
      option.selected = true;
    }

    targetSelect.appendChild(option);
  });

  targetComment.value = record[period].stamp?.comment || "";
}

function renderAllStamps() {
  renderStamp("morning");
  renderStamp("afternoon");
}

function renderStamp(period) {
  const record = getSelectedDateRecord();

  const targetElement = period === "morning"
    ? morningStampDisplay
    : afternoonStampDisplay;

  const periodLabel = period === "morning" ? "午前" : "午後";
  const stamp = record[period].stamp;

  targetElement.innerHTML = "";

  if (!stamp) {
    targetElement.innerHTML = `<p class="hint">${periodLabel}の確認スタンプはまだ押されてない。</p>`;
    return;
  }

  const stampedDate = new Date(stamp.stampedAt);
  const timeText = Number.isNaN(stampedDate.getTime())
    ? ""
    : `${String(stampedDate.getHours()).padStart(2, "0")}:${String(stampedDate.getMinutes()).padStart(2, "0")}`;

  const wrapper = document.createElement("div");
  wrapper.className = "stamp-wrap";

  wrapper.innerHTML = `
  <div class="stamp">
    <div>
      <div class="stamp-name">${escapeHtml(stamp.staffName)}</div>
      <div class="stamp-text">${periodLabel}確認</div>
    </div>
  </div>
  <div class="stamp-time">${timeText}</div>
  ${stamp.comment ? `<div class="stamp-comment">${escapeHtml(stamp.comment)}</div>` : ""}
`;
  targetElement.appendChild(wrapper);
}

function renderCalendar() {
  const records = loadRecords();

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  monthLabel.textContent = `${year}年 ${month + 1}月`;
  calendar.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  for (let i = 0; i < startWeekday; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day-cell empty";
    calendar.appendChild(emptyCell);
  }

  for (let day = 1; day <= lastDate; day++) {
    const date = new Date(year, month, day);
    const dateKey = formatDate(date);
    const record = records[dateKey] ? normalizeRecord(records[dateKey]) : null;

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day-cell";

    if (dateKey === getTodayString()) {
      cell.classList.add("today");
    }

    const morningIcon = record?.morning?.mood ? moodIcons[record.morning.mood] || "▫️" : "";
    const afternoonIcon = record?.afternoon?.mood ? moodIcons[record.afternoon.mood] || "▫️" : "";

    const hasMorningStamp = Boolean(record?.morning?.stamp);
    const hasAfternoonStamp = Boolean(record?.afternoon?.stamp);

    cell.innerHTML = `
      <div class="day-number">${day}</div>

      <div class="day-moods">
        ${morningIcon ? `<span>${morningIcon}</span>` : `<span class="empty-mark">-</span>`}
        <span class="slash">/</span>
        ${afternoonIcon ? `<span>${afternoonIcon}</span>` : `<span class="empty-mark">-</span>`}
      </div>

      <div class="day-stamps">
        <span class="${hasMorningStamp ? "stamp-ok" : "stamp-none"}">朝${hasMorningStamp ? "◎" : "×"}</span>
        <span class="${hasAfternoonStamp ? "stamp-ok" : "stamp-none"}">昼${hasAfternoonStamp ? "◎" : "×"}</span>
      </div>
    `;

    cell.addEventListener("click", () => {
  dateInput.value = dateKey;
  loadFormByDate();
  renderRecordDetail(dateKey);
});

    calendar.appendChild(cell);
  }
}

function renderStaffSettings() {
  const staff = loadStaff();

  staffSettingsList.innerHTML = "";

  staff.forEach((member, index) => {
    const item = document.createElement("div");
    item.className = "staff-setting-item";

    const name = document.createElement("span");
    name.className = "staff-setting-name";
    name.textContent = member.name;

    const toggleButton = document.createElement("button");
    toggleButton.className = member.visible
      ? "staff-toggle-button visible"
      : "staff-toggle-button";

    toggleButton.textContent = member.visible ? "ON" : "OFF";

    toggleButton.addEventListener("click", () => {
      toggleStaffVisibility(index);
    });

    item.appendChild(name);
    item.appendChild(toggleButton);

    staffSettingsList.appendChild(item);
  });
}

function toggleStaffVisibility(index) {
  const staff = loadStaff();

  if (!staff[index]) {
    return;
  }

  staff[index].visible = !staff[index].visible;

  saveStaff(staff);
  renderStaffSettings();
  renderAllStaffSelects();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function init() {
  dateInput.value = getTodayString();

  saveStaff(loadStaff());

  loadFormByDate();
  renderCalendar();
  renderStaffSettings();

  saveMorningButton.addEventListener("click", saveMorningRecord);
  saveAfternoonButton.addEventListener("click", saveAfternoonRecord);
  deleteButton.addEventListener("click", deleteCurrentRecord);

  morningStampButton.addEventListener("click", () => {
    setStamp("morning");
  });

  afternoonStampButton.addEventListener("click", () => {
    setStamp("afternoon");
  });

  dateInput.addEventListener("change", loadFormByDate);

  prevMonthButton.addEventListener("click", () => {
    currentCalendarDate = new Date(
      currentCalendarDate.getFullYear(),
      currentCalendarDate.getMonth() - 1,
      1
    );

    renderCalendar();
  });

  nextMonthButton.addEventListener("click", () => {
    currentCalendarDate = new Date(
      currentCalendarDate.getFullYear(),
      currentCalendarDate.getMonth() + 1,
      1
    );

    renderCalendar();
  });
}


function renderRecordDetail(dateKey) {
  const records = loadRecords();
  const record = records[dateKey] ? normalizeRecord(records[dateKey]) : null;

  if (!record) {
    recordDetail.innerHTML = `
      <p class="detail-date">${dateKey}</p>
      <p class="hint">この日の記録はまだないよ。</p>
    `;
    return;
  }

  const morningMoodText = record.morning.mood
    ? `${moodIcons[record.morning.mood] || ""} ${record.morning.mood}`
    : "未記録";

  const afternoonMoodText = record.afternoon.mood
    ? `${moodIcons[record.afternoon.mood] || ""} ${record.afternoon.mood}`
    : "未記録";

  const morningStampText = formatStampText(record.morning.stamp);
  const afternoonStampText = formatStampText(record.afternoon.stamp);

  recordDetail.innerHTML = `
    <p class="detail-date">${dateKey}</p>

    <div class="detail-grid">
      <section class="detail-card">
        <h3>午前</h3>

        <p class="detail-row">
          <span class="detail-label">気分：</span>
          ${escapeHtml(morningMoodText)}
        </p>

        <p class="detail-row">
          <span class="detail-label">今日やりたいこと：</span><br>
          ${escapeHtml(record.morning.todo || "未記入")}
        </p>

        <p class="detail-row">
          <span class="detail-label">ひとこと：</span><br>
          ${escapeHtml(record.morning.note || "未記入")}
        </p>

        <p class="detail-stamp">
  確認：${escapeHtml(morningStampText)}
</p>

${record.morning.stamp?.comment ? `
  <p class="detail-comment">
    <span class="detail-label">職員コメント：</span><br>
    ${escapeHtml(record.morning.stamp.comment)}
  </p>
` : ""}

      <section class="detail-card">
        <h3>午後</h3>

        <p class="detail-row">
          <span class="detail-label">気分：</span>
          ${escapeHtml(afternoonMoodText)}
        </p>

        <p class="detail-row">
          <span class="detail-label">なにをやったか：</span><br>
          ${escapeHtml(record.afternoon.done || "未記入")}
        </p>

        <p class="detail-row">
          <span class="detail-label">感想：</span><br>
          ${escapeHtml(record.afternoon.impression || "未記入")}
        </p>

        <p class="detail-stamp">
  確認：${escapeHtml(afternoonStampText)}
</p>

${record.afternoon.stamp?.comment ? `
  <p class="detail-comment">
    <span class="detail-label">職員コメント：</span><br>
    ${escapeHtml(record.afternoon.stamp.comment)}
  </p>
` : ""}
      </section>
    </div>
  `;
}

function formatStampText(stamp) {
  if (!stamp) {
    return "未確認";
  }

  const stampedDate = new Date(stamp.stampedAt);

  if (Number.isNaN(stampedDate.getTime())) {
    return stamp.staffName;
  }

  const timeText = `${String(stampedDate.getHours()).padStart(2, "0")}:${String(stampedDate.getMinutes()).padStart(2, "0")}`;

  return `${stamp.staffName} ${timeText}`;
}


init();
