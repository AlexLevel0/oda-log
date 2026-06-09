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

const saveButton = document.getElementById("saveButton");
const deleteButton = document.getElementById("deleteButton");

const staffButtons = document.getElementById("staffButtons");
const stampList = document.getElementById("stampList");

const calendar = document.getElementById("calendar");
const monthLabel = document.getElementById("monthLabel");
const prevMonthButton = document.getElementById("prevMonthButton");
const nextMonthButton = document.getElementById("nextMonthButton");

const staffSettingsList = document.getElementById("staffSettingsList");

let currentCalendarDate = new Date();

function getTodayString() {
  const today = new Date();
  return formatDate(today);
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
      note: ""
    },
    afternoon: {
      mood: "",
      done: "",
      impression: ""
    },
    stamp: null
  };
}

function normalizeRecord(record) {
  const emptyRecord = createEmptyRecord();

  return {
    morning: {
      mood: record?.morning?.mood || emptyRecord.morning.mood,
      todo: record?.morning?.todo || emptyRecord.morning.todo,
      note: record?.morning?.note || emptyRecord.morning.note
    },
    afternoon: {
      mood: record?.afternoon?.mood || emptyRecord.afternoon.mood,
      done: record?.afternoon?.done || emptyRecord.afternoon.done,
      impression: record?.afternoon?.impression || emptyRecord.afternoon.impression
    },
    stamp: record?.stamp || null
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

  renderStaffButtons();
  renderStamp();
}

function buildCurrentRecord(oldRecord) {
  return {
    morning: {
      mood: morningMood.value,
      todo: morningTodo.value.trim(),
      note: morningNote.value.trim()
    },
    afternoon: {
      mood: afternoonMood.value,
      done: afternoonDone.value.trim(),
      impression: afternoonImpression.value.trim()
    },
    stamp: oldRecord?.stamp || null
  };
}

function saveCurrentRecord() {
  const records = loadRecords();
  const selectedDate = dateInput.value;
  const oldRecord = normalizeRecord(records[selectedDate]);

  records[selectedDate] = buildCurrentRecord(oldRecord);

  saveRecords(records);
  renderCalendar();

  alert("保存したぞ。えらい。");
}

function saveCurrentRecordSilently() {
  const records = loadRecords();
  const selectedDate = dateInput.value;
  const oldRecord = normalizeRecord(records[selectedDate]);

  records[selectedDate] = buildCurrentRecord(oldRecord);

  saveRecords(records);
}

function deleteCurrentRecord() {
  const selectedDate = dateInput.value;
  const records = loadRecords();

  if (!records[selectedDate]) {
    alert("この日の記録はまだないよ。");
    return;
  }

  const confirmed = confirm("この日の記録を削除する？");

  if (!confirmed) {
    return;
  }

  delete records[selectedDate];
  saveRecords(records);

  loadFormByDate();
  renderCalendar();
}

function setStamp(staffName) {
  saveCurrentRecordSilently();

  const records = loadRecords();
  const selectedDate = dateInput.value;
  const record = normalizeRecord(records[selectedDate]);

  if (record.stamp && record.stamp.staffName === staffName) {
    record.stamp = null;
  } else {
    record.stamp = {
      staffName: staffName,
      stampedAt: new Date().toISOString()
    };
  }

  records[selectedDate] = record;
  saveRecords(records);

  renderStaffButtons();
  renderStamp();
  renderCalendar();
}

function renderStaffButtons() {
  const staff = loadStaff();
  const visibleStaff = staff.filter((member) => member.visible);
  const record = getSelectedDateRecord();

  staffButtons.innerHTML = "";

  if (visibleStaff.length === 0) {
    staffButtons.innerHTML = `<p class="hint">表示中の職員がいないよ。職員設定でONにしてね。</p>`;
    return;
  }

  visibleStaff.forEach((member) => {
    const button = document.createElement("button");
    const isStamped = record.stamp && record.stamp.staffName === member.name;

    button.className = isStamped ? "staff-button active" : "staff-button";
    button.textContent = isStamped ? `${member.name} の確認印` : `${member.name} のハンコ`;

    button.addEventListener("click", () => {
      setStamp(member.name);
    });

    staffButtons.appendChild(button);
  });
}

function renderStamp() {
  const record = getSelectedDateRecord();

  stampList.innerHTML = "";

  if (!record.stamp) {
    stampList.innerHTML = `<p class="hint">まだ確認スタンプは押されてない。</p>`;
    return;
  }

  const stampedDate = new Date(record.stamp.stampedAt);
  const timeText = Number.isNaN(stampedDate.getTime())
    ? ""
    : `${String(stampedDate.getHours()).padStart(2, "0")}:${String(stampedDate.getMinutes()).padStart(2, "0")}`;

  const wrapper = document.createElement("div");

  wrapper.innerHTML = `
    <div class="stamp">
      <div>
        <div class="stamp-name">${escapeHtml(record.stamp.staffName)}</div>
        <div class="stamp-text">確認済</div>
      </div>
    </div>
    <div class="stamp-time">${timeText}</div>
  `;

  stampList.appendChild(wrapper);
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
    const stampName = record?.stamp?.staffName || "";

    cell.innerHTML = `
      <div class="day-number">${day}</div>
      ${morningIcon ? `<div class="mood-line"><span>午前</span><strong>${morningIcon}</strong></div>` : ""}
      ${afternoonIcon ? `<div class="mood-line"><span>午後</span><strong>${afternoonIcon}</strong></div>` : ""}
      ${stampName ? `<div class="calendar-stamp">確認：${escapeHtml(stampName)}</div>` : ""}
    `;

    cell.addEventListener("click", () => {
      dateInput.value = dateKey;
      loadFormByDate();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
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
  renderStaffButtons();
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

  saveButton.addEventListener("click", saveCurrentRecord);
  deleteButton.addEventListener("click", deleteCurrentRecord);

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

init();