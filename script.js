import { db, auth } from "./firebase.js";

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const SETTINGS_DOC_PATH = ["settings", "main"];

const OWNER_EMAILS = [
  "mitsuhashipaintart@gmail.com"
];

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
  { name: "手塚さん", visible: true },
  { name: "伊藤さん", visible: true },
  { name: "島田さん", visible: true },
  { name: "久住さん", visible: true },
  { name: "古積さん", visible: true },
  { name: "駒谷さん", visible: true },
  { name: "山崎さん", visible: false },
  { name: "職員A", visible: false },
  { name: "職員B", visible: false },
  { name: "職員C", visible: false }
];

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");

const logoutButton = document.getElementById("logoutButton");
const loginUserText = document.getElementById("loginUserText");

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

let currentUser = null;
let currentRole = "staff";

let appData = {
  records: {},
  staff: []
};

function getTodayString() {
  return formatDate(new Date());
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getUserRole(user) {
  if (!user || !user.email) {
    return "staff";
  }

  return OWNER_EMAILS.includes(user.email) ? "owner" : "staff";
}

function applyRoleView() {
  const isOwner = currentRole === "owner";

  const staffSettingsCard = staffSettingsList.closest(".card");

  if (staffSettingsCard) {
    staffSettingsCard.classList.toggle("hidden", !isOwner);
  }

  deleteButton.classList.toggle("hidden", !isOwner);
  saveMorningButton.classList.toggle("hidden", !isOwner);
  saveAfternoonButton.classList.toggle("hidden", !isOwner);

  morningMood.disabled = !isOwner;
  morningTodo.disabled = !isOwner;
  morningNote.disabled = !isOwner;

  afternoonMood.disabled = !isOwner;
  afternoonDone.disabled = !isOwner;
  afternoonImpression.disabled = !isOwner;
}

async function login() {
  loginError.textContent = "";

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    loginError.textContent = "メールアドレスとパスワードを入力してね。";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("ログイン失敗", error);
    loginError.textContent = "ログインに失敗しました。メールアドレスかパスワードを確認してね。";
  }
}

async function logout() {
  await signOut(auth);
}

async function loadCloudData() {
  const settingsRef = doc(db, ...SETTINGS_DOC_PATH);
  const settingsSnap = await getDoc(settingsRef);

  if (!settingsSnap.exists()) {
    appData.staff = defaultStaff;

    await setDoc(settingsRef, {
      staff: defaultStaff,
      updatedAt: serverTimestamp()
    });
  } else {
    const settingsData = settingsSnap.data();
    appData.staff = mergeDefaultStaff(settingsData.staff || []);
  }

  const recordsSnap = await getDocs(collection(db, "records"));
  const records = {};

  recordsSnap.forEach((recordDoc) => {
    records[recordDoc.id] = normalizeRecord(recordDoc.data());
  });

  appData.records = records;
}

function mergeDefaultStaff(savedStaff) {
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
}

function loadRecords() {
  return appData.records || {};
}

function loadStaff() {
  return appData.staff && appData.staff.length > 0
    ? appData.staff
    : defaultStaff;
}

async function saveStaffToCloud(staff) {
  appData.staff = staff;

  const settingsRef = doc(db, ...SETTINGS_DOC_PATH);

  await setDoc(settingsRef, {
    staff: staff,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

function saveStaff(staff) {
  saveStaffToCloud(staff).catch((error) => {
    console.error("職員設定の保存に失敗しました", error);
    alert("職員設定の保存に失敗した。");
  });
}

async function saveRecordToCloud(dateKey, record) {
  const normalizedRecord = normalizeRecord(record);

  appData.records[dateKey] = normalizedRecord;

  const recordRef = doc(db, "records", dateKey);

  await setDoc(recordRef, {
    ...normalizedRecord,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function deleteRecordFromCloud(dateKey) {
  delete appData.records[dateKey];

  const recordRef = doc(db, "records", dateKey);

  await deleteDoc(recordRef);
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

  if (typeof renderRecordDetail === "function") {
    renderRecordDetail(dateInput.value);
  }
}

async function saveMorningRecord() {
  if (currentRole !== "owner") {
    alert("職員アカウントでは記録本文を編集できません。");
    return;
  }

  const selectedDate = dateInput.value;
  const records = loadRecords();
  const record = normalizeRecord(records[selectedDate]);

  record.morning.mood = morningMood.value;
  record.morning.todo = morningTodo.value.trim();
  record.morning.note = morningNote.value.trim();

  try {
    await saveRecordToCloud(selectedDate, record);

    renderCalendar();
    renderRecordDetail(selectedDate);

    alert("午前の記録を保存したぞ。");
  } catch (error) {
    console.error("午前の記録保存に失敗しました", error);
    alert("午前の記録保存に失敗した。");
  }
}

async function saveAfternoonRecord() {
  if (currentRole !== "owner") {
    alert("職員アカウントでは記録本文を編集できません。");
    return;
  }

  const selectedDate = dateInput.value;
  const records = loadRecords();
  const record = normalizeRecord(records[selectedDate]);

  record.afternoon.mood = afternoonMood.value;
  record.afternoon.done = afternoonDone.value.trim();
  record.afternoon.impression = afternoonImpression.value.trim();

  try {
    await saveRecordToCloud(selectedDate, record);

    renderCalendar();
    renderRecordDetail(selectedDate);

    alert("午後の記録を保存したぞ。");
  } catch (error) {
    console.error("午後の記録保存に失敗しました", error);
    alert("午後の記録保存に失敗した。");
  }
}

function saveCurrentPeriodSilently(period) {
  if (currentRole !== "owner") {
    return;
  }

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

  appData.records[selectedDate] = record;
}

async function deleteCurrentRecord() {
  if (currentRole !== "owner") {
    alert("職員アカウントでは記録を削除できません。");
    return;
  }

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

  try {
    await deleteRecordFromCloud(selectedDate);

    loadFormByDate();
    renderCalendar();
    renderRecordDetail(selectedDate);
  } catch (error) {
    console.error("記録削除に失敗しました", error);
    alert("記録の削除に失敗した。");
  }
}

async function setStamp(period) {
  saveCurrentPeriodSilently(period);

  const targetSelect = period === "morning"
    ? morningStaffSelect
    : afternoonStaffSelect;

  const targetComment = period === "morning"
    ? morningStaffComment
    : afternoonStaffComment;

  const staffName = targetSelect.value;

  if (!staffName) {
    alert("職員を選択してね。");
    return;
  }

  const selectedDate = dateInput.value;
  const records = loadRecords();
  const record = normalizeRecord(records[selectedDate]);

  const hasRecord =
    record.morning.mood ||
    record.morning.todo ||
    record.morning.note ||
    record.afternoon.mood ||
    record.afternoon.done ||
    record.afternoon.impression;

  if (!hasRecord && currentRole !== "owner") {
    alert("この日の記録がまだないため、職員アカウントでは確認を保存できません。");
    return;
  }

  record[period].stamp = {
    staffName: staffName,
    stampedAt: new Date().toISOString(),
    comment: targetComment.value.trim()
  };

  try {
    await saveRecordToCloud(selectedDate, record);

    renderStaffSelect(period);
    renderStamp(period);
    renderCalendar();
    renderRecordDetail(selectedDate);

    alert("確認を保存しました。");
  } catch (error) {
    console.error("確認保存に失敗しました", error);
    alert("確認の保存に失敗した。権限かルールを確認してね。");
  }
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

      recordDetail.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    calendar.appendChild(cell);
  }
}

function renderRecordDetail(dateKey) {
  const records = loadRecords();
  const record = records[dateKey] ? normalizeRecord(records[dateKey]) : null;

  if (!record) {
    recordDetail.innerHTML = `
      <p class="detail-date">${escapeHtml(dateKey)} の記録</p>
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
    <p class="detail-date">${escapeHtml(dateKey)} の記録</p>

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
      </section>

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
  if (currentRole !== "owner") {
    alert("職員設定は小田さん用です。");
    return;
  }

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

  loginButton.addEventListener("click", login);

  loginPassword.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      login();
    }
  });

  logoutButton.addEventListener("click", logout);

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

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (!user) {
      loginView.classList.remove("hidden");
      appView.classList.add("hidden");
      loginUserText.textContent = "";
      return;
    }

    currentRole = getUserRole(user);

    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
    loginUserText.textContent = `${user.email} でログイン中`;

    try {
      await loadCloudData();

      loadFormByDate();
      renderCalendar();
      renderStaffSettings();
      renderRecordDetail(dateInput.value);
      applyRoleView();
    } catch (error) {
      console.error("Firebase読み込みエラー", error);
      alert("Firebaseからデータを読み込めなかった。設定を確認してね。");
    }
  });
}

init();
