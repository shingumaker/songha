import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, ADMIN_PIN } from "./firebase-config.js";

// ---------- 설정 ----------
const STUDENTS = [
  { id: "s1", name: "장윤지" },
  { id: "s2", name: "이성아" },
  { id: "s3", name: "장주형" },
  { id: "s4", name: "장지호" },
  { id: "s5", name: "손창현" },
  { id: "s6", name: "김성현" },
  { id: "s7", name: "김지유" },
  { id: "s8", name: "김세린" },
  { id: "s9", name: "이다은" }
];
const TOTAL_DAYS = 33;
const START_YEAR = 2026, START_MONTH = 8, START_DATE = 1; // 2026-09-01
const STAR_COLORS = ["#EAF2FF", "#FFFFFF", "#FFE9C2", "#FFC9A6"];
const CELL_X = [20, 50, 80];
const CELL_Y = [24, 50, 76];

// ---------- Firebase ----------
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const checkinsCol = collection(db, "checkins");

// ---------- 상태 ----------
const state = {
  data: {},      // { [studentId]: { name, days:[33 bool], times:{ [dayIdx]: ms } } }
  loaded: false,
  route: "student"
};

// ---------- 날짜 유틸 ----------
function dateAt(i) {
  return new Date(START_YEAR, START_MONTH, START_DATE + i);
}
function dateShort(i) {
  return String(dateAt(i).getDate());
}
function dateLabel(i) {
  const d = dateAt(i);
  return (d.getMonth() + 1) + "/" + d.getDate();
}
function todayIndex() {
  const s = new Date(START_YEAR, START_MONTH, START_DATE);
  s.setHours(0, 0, 0, 0);
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return Math.round((n - s) / 86400000);
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function formatTime(ms) {
  return new Date(ms).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function trailingStreak(days, idx) {
  let i = idx;
  if (!days[i]) i -= 1;
  let streak = 0;
  while (i >= 0 && days[i]) { streak++; i--; }
  return streak;
}
function starSizeForRank(rank, big) {
  const s = big
    ? [{ box: 38, glow: 46, svg: 25, font: 12.5 }, { box: 32, glow: 38, svg: 20, font: 11 }, { box: 29, glow: 34, svg: 18, font: 10.5 }, { box: 26, glow: 32, svg: 17, font: 10 }]
    : [{ box: 20, glow: 24, svg: 13, font: 7 }, { box: 17, glow: 21, svg: 11, font: 6.5 }, { box: 15, glow: 18, svg: 10, font: 6 }, { box: 13, glow: 16, svg: 9, font: 5.5 }];
  if (rank === 1) return s[0];
  if (rank === 2) return s[1];
  if (rank === 3) return s[2];
  return s[3];
}
function hashJitter(id, salt) {
  let h = 0;
  const str = id + ":" + salt;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return ((h % 1000) / 1000) - 0.5; // -0.5..0.5
}

// ---------- Firestore 구독 ----------
async function ensureSeeded() {
  for (const st of STUDENTS) {
    const ref = doc(db, "checkins", st.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { name: st.name, days: Array(TOTAL_DAYS).fill(false), times: {} });
    }
  }
}

function subscribe() {
  onSnapshot(checkinsCol, (snap) => {
    snap.docs.forEach((d) => {
      const v = d.data();
      state.data[d.id] = {
        name: v.name,
        days: Array.isArray(v.days) && v.days.length === TOTAL_DAYS ? v.days : Array(TOTAL_DAYS).fill(false),
        times: v.times || {}
      };
    });
    state.loaded = true;
    render();
  }, (err) => {
    console.error("db error", err);
    state.loaded = "error";
    render();
  });
}

async function toggleDay(studentId, dayIdx) {
  const s = state.data[studentId];
  if (!s) return;
  const days = s.days.slice();
  const times = { ...s.times };
  const next = !days[dayIdx];
  days[dayIdx] = next;
  if (next) times[dayIdx] = Date.now();
  else delete times[dayIdx];
  // 낙관적 업데이트(즉시 화면 반영), 이후 서버 스냅샷이 확정값으로 덮어씀
  state.data[studentId] = { ...s, days, times };
  render();
  try {
    await updateDoc(doc(db, "checkins", studentId), { days, times });
  } catch (e) {
    console.error("write failed", e);
  }
}

// ---------- 파생 데이터 계산 ----------
function computeDerived() {
  const idx = todayIndex();
  const isActiveToday = idx >= 0 && idx < TOTAL_DAYS;
  const refIdx = clamp(idx, 0, TOTAL_DAYS - 1);
  const elapsed = clamp(idx + 1, 0, TOTAL_DAYS);

  const perStudent = STUDENTS.map((st) => {
    const rec = state.data[st.id] || { name: st.name, days: Array(TOTAL_DAYS).fill(false), times: {} };
    const count = rec.days.filter(Boolean).length;
    const streak = trailingStreak(rec.days, refIdx);
    const percent = elapsed > 0 ? Math.round((rec.days.slice(0, elapsed).filter(Boolean).length / elapsed) * 100) : 0;
    const doneToday = isActiveToday && !!rec.days[idx];
    return { id: st.id, name: st.name, rec, count, streak, percent, doneToday };
  });

  const todayArrivals = isActiveToday
    ? perStudent
        .filter((p) => p.doneToday)
        .map((p) => ({ id: p.id, name: p.name, time: p.rec.times[idx] || 0 }))
        .sort((a, b) => a.time - b.time)
    : [];
  const rankByName = {};
  todayArrivals.forEach((a, i) => { rankByName[a.name] = i + 1; });

  const cumulative = perStudent.slice().sort((a, b) => b.count - a.count);

  const avgPercent = perStudent.length ? Math.round(perStudent.reduce((s, p) => s + p.percent, 0) / perStudent.length) : 0;
  const maxStreak = perStudent.length ? Math.max(...perStudent.map((p) => p.streak)) : 0;
  const todayDoneCount = perStudent.filter((p) => p.doneToday).length;

  return { idx, isActiveToday, refIdx, elapsed, perStudent, todayArrivals, rankByName, cumulative, avgPercent, maxStreak, todayDoneCount };
}

// ---------- 렌더: 별자리 ----------
function renderConstellation(perStudent, rankByName, isActiveToday, big) {
  if (!isActiveToday) {
    return `<div class="constellation-bg" style="height:${big ? 220 : 150}px;"><div class="star-empty">챌린지 기간이 아니에요<br>(2026.09.01 – 2026.10.03)</div></div>`;
  }
  const stars = perStudent.map((p, idx) => {
    const row = Math.floor(idx / 3), col = idx % 3;
    const jx = hashJitter(p.id, "x") * 14;
    const jy = hashJitter(p.id, "y") * 10;
    const x = (CELL_X[col] + jx).toFixed(1);
    const y = (CELL_Y[row] + jy).toFixed(1);
    const color = STAR_COLORS[idx % STAR_COLORS.length];
    if (p.doneToday) {
      const size = starSizeForRank(rankByName[p.name] || null, big);
      return `<div class="star" style="left:${x}%;top:${y}%;">
        <div style="position:relative;width:${size.box}px;height:${size.box}px;display:flex;align-items:center;justify-content:center;">
          <div class="star-glow" style="width:${size.glow}px;height:${size.glow}px;background:radial-gradient(circle, ${color}66, transparent 70%);"></div>
          <svg width="${size.svg}" height="${size.svg}" viewBox="0 0 24 24" style="position:relative;">
            <path d="M12 0 C12.8 6 13.5 8.5 24 12 C13.5 15.5 12.8 18 12 24 C11.2 18 10.5 15.5 0 12 C10.5 8.5 11.2 6 12 0 Z" fill="${color}"></path>
          </svg>
        </div>
        <div class="star-name" style="font-size:${size.font}px;">${p.name}</div>
      </div>`;
    }
    return `<div class="star" style="left:${x}%;top:${y}%;"><div class="star-pending"></div></div>`;
  }).join("");
  return `<div class="constellation-bg" style="height:${big ? 220 : 150}px;">${stars}</div>`;
}

function ringGauge(percent, size, holeSize, fontSize) {
  return `<div class="ring-gauge" style="width:${size}px;height:${size}px;background:conic-gradient(var(--cyan) ${percent * 3.6}deg, var(--line) 0);">
    <div class="ring-gauge-hole" style="width:${holeSize}px;height:${holeSize}px;">
      <div class="ring-gauge-pct" style="font-size:${fontSize}px;">${percent}%</div>
    </div>
  </div>`;
}

// ---------- 렌더: 학생 화면 ----------
function renderStudentPicker() {
  const buttons = STUDENTS.map((st) => `<button class="pick-btn" data-action="pick" data-sid="${st.id}">${st.name}</button>`).join("");
  return `
    <div class="eyebrow">PROBE SELECT</div>
    <h1>나는 누구인가요?</h1>
    <div class="sub" style="margin-bottom:18px;">본인 이름을 선택하면 이 기기에 저장돼요. 다음부터는 자동으로 내 화면이 열려요.</div>
    <div class="pick-grid">${buttons}</div>
    <div class="link-row"><button class="link-btn" data-action="goto-admin">관리자이신가요? →</button></div>
  `;
}

function renderStudentScreen(myId) {
  const d = computeDerived();
  const me = d.perStudent.find((p) => p.id === myId);
  if (!me) { localStorage.removeItem("myStudentId"); render(); return ""; }

  const daysLeft = d.isActiveToday ? (TOTAL_DAYS - 1 - d.idx) : (d.idx < 0 ? -d.idx : 0);
  const periodDone = d.idx >= TOTAL_DAYS;

  let arrivalMsg, arrivalDot;
  if (!d.isActiveToday) {
    arrivalMsg = periodDone ? "챌린지가 종료됐어요. 수고 많으셨어요!" : `챌린지 시작까지 D-${-d.idx}`;
    arrivalDot = "var(--sub)";
  } else if (me.doneToday) {
    const rank = d.rankByName[me.name];
    arrivalMsg = `오늘 ${rank}번째로 체크했어요 · ${formatTime(me.rec.times[d.idx])}`;
    arrivalDot = "var(--cyan)";
  } else {
    arrivalMsg = "아직 오늘 체크를 안 했어요";
    arrivalDot = "var(--sub)";
  }

  const dayCells = [];
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const isChecked = !!me.rec.days[i];
    const isToday = d.isActiveToday && i === d.idx;
    const isFuture = i > d.refIdx || (d.isActiveToday && i > d.idx);
    const bg = isChecked ? "var(--cyan)" : (isFuture ? "transparent" : "#171B36");
    let border = "1.5px solid transparent";
    if (isToday) border = "1.5px solid var(--gold)";
    else if (isFuture && !isChecked) border = "1.5px dashed var(--sub)";
    dayCells.push(`
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div class="day-cell readonly" style="width:100%;height:22px;background:${bg};border:${border};" title="${dateLabel(i)}"></div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:${isToday ? "var(--gold)" : "var(--sub)"};">${dateShort(i)}</div>
      </div>`);
  }

  const ctaDisabled = !d.isActiveToday;
  const ctaLabel = !d.isActiveToday ? (periodDone ? "챌린지 종료" : "챌린지 시작 전") : (me.doneToday ? "오늘 기록 완료 (다시 누르면 취소)" : "오늘 좌표 기록하기");

  return `
    <div class="eyebrow">PROBE · ${me.name}</div>
    <h1>온라인선교 챌린지</h1>
    <div class="sub" style="margin-bottom:16px;">2026.09.01 – 2026.10.03 · 총 ${TOTAL_DAYS}일</div>

    <div class="card" style="margin-bottom:14px;">
      <div class="panel-head">
        <div class="panel-title" style="color:var(--cyan);"><span class="live-dot" style="background:var(--cyan);box-shadow:0 0 5px var(--cyan);"></span>오늘의 별자리</div>
        <div class="panel-note">${d.isActiveToday ? d.todayDoneCount + " / " + STUDENTS.length + " 도착" : ""}</div>
      </div>
      ${renderConstellation(d.perStudent, d.rankByName, d.isActiveToday, true)}
    </div>

    <div class="card" style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
      ${ringGauge(me.percent, 56, 44, 13)}
      <div style="flex:1;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;margin-bottom:2px;">${me.count}/${d.elapsed || TOTAL_DAYS}D · STREAK ${String(me.streak).padStart(2, "0")}D</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--gold);margin-bottom:2px;">${me.count * 5}점</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--sub);">${d.isActiveToday ? "DAY " + (d.idx + 1) + " / " + TOTAL_DAYS : (periodDone ? "완주" : "D-" + daysLeft)}</div>
      </div>
    </div>

    <div class="card" style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
      <span class="live-dot" style="background:${arrivalDot};box-shadow:0 0 5px ${arrivalDot};"></span>
      <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;">${arrivalMsg}</span>
    </div>

    <button class="cta-btn" data-action="toggle-today" style="background:${ctaDisabled ? "var(--line)" : (me.doneToday ? "var(--line)" : "var(--cyan)")};color:${ctaDisabled || me.doneToday ? "var(--sub)" : "#0B0E1F"};margin-bottom:22px;" ${ctaDisabled ? "disabled" : ""}>${ctaLabel}</button>

    <div class="section-label">FLIGHT LOG</div>
    <div class="legend">점선 = 아직 지나지 않은 날 · 금색 테두리 = 오늘 · 챌린지 종료까지 ${d.isActiveToday ? daysLeft : (periodDone ? 0 : -d.idx)}일</div>
    <div class="flight-log-grid">${dayCells.join("")}</div>

    <div class="link-row">
      <button class="link-btn" data-action="switch-student">다른 학생으로 전환</button>
      &nbsp;·&nbsp;
      <button class="link-btn" data-action="goto-admin">관리자 화면 →</button>
    </div>
  `;
}

// ---------- 렌더: 관리자 화면 ----------
function renderPinGate(errored) {
  return `
    <div class="pin-gate">
      <div class="eyebrow" style="justify-content:center;">MISSION CONTROL</div>
      <h1 style="text-align:center;">관리자 인증</h1>
      <div class="sub" style="text-align:center;">4자리 PIN을 입력하세요</div>
      <form data-action="pin-submit">
        <input class="pin-input" type="password" inputmode="numeric" maxlength="8" name="pin" autofocus>
        <div class="pin-error">${errored ? "PIN이 올바르지 않아요" : ""}</div>
        <button class="cta-btn" style="background:var(--cyan);color:#0B0E1F;" type="submit">입장</button>
      </form>
      <div class="link-row"><button class="link-btn" data-action="goto-student">학생 화면으로 ←</button></div>
    </div>
  `;
}

function renderAdminScreen() {
  const d = computeDerived();

  const statTiles = [
    { label: "ACTIVE PROBES", value: STUDENTS.length, color: "var(--star)" },
    { label: "TODAY'S CHECK-INS", value: d.isActiveToday ? d.todayDoneCount + " / " + STUDENTS.length : "-", color: "var(--cyan)" },
    { label: "AVG PROGRESS", value: d.avgPercent + "%", color: "var(--star)" },
    { label: "LONGEST STREAK", value: d.maxStreak + "D", color: "var(--gold)" }
  ].map((t) => `<div class="stat-tile"><div class="stat-label">${t.label}</div><div class="stat-value" style="color:${t.color};">${t.value}</div></div>`).join("");

  const arrivalRows = d.todayArrivals.length
    ? d.todayArrivals.map((a, i) => `
      <div class="rank-row" style="background:${i === 0 ? "rgba(255,200,87,0.1)" : "transparent"};">
        <div class="rank-num" style="color:${i === 0 ? "var(--gold)" : "var(--star)"};width:22px;">#${i + 1}</div>
        <div class="rank-name">${a.name}</div>
        <div class="rank-meta">${formatTime(a.time)}</div>
      </div>`).join("")
    : `<div class="star-empty" style="padding:16px 0;">${d.isActiveToday ? "아직 아무도 체크하지 않았어요" : "챌린지 기간이 아니에요"}</div>`;

  const cumulativeRows = d.cumulative.map((c, i) => `
    <div class="rank-row" style="background:${i === 0 ? "rgba(139,92,246,0.12)" : "transparent"};">
      <div class="rank-num" style="color:${i === 0 ? "var(--violet)" : "var(--star)"};width:22px;">#${i + 1}</div>
      <div class="rank-name">${c.name}</div>
      <div class="rank-meta">${c.count * 5}점</div>
    </div>`).join("");

  // 체크 관리 테이블
  let headCells = "";
  for (let i = 0; i < TOTAL_DAYS; i++) {
    if (i === 30) headCells += `<th class="gap-col"></th>`;
    headCells += `<th class="${d.isActiveToday && i === d.idx ? "today" : ""}">${dateShort(i)}</th>`;
  }
  let bodyRows = "";
  d.perStudent.forEach((p) => {
    let cells = "";
    for (let i = 0; i < TOTAL_DAYS; i++) {
      if (i === 30) cells += `<td class="gap-col"></td>`;
      const isChecked = !!p.rec.days[i];
      const isToday = d.isActiveToday && i === d.idx;
      const isFuture = d.isActiveToday ? i > d.idx : i > d.refIdx;
      const bg = isChecked ? "var(--cyan)" : (isFuture ? "transparent" : "#232A4D");
      let border = "1.5px solid transparent";
      if (isToday) border = "1.5px solid var(--gold)";
      else if (isFuture && !isChecked) border = "1.5px dashed var(--sub)";
      cells += `<td class="manage-cell-wrap"><div class="day-cell" data-action="toggle-cell" data-sid="${p.id}" data-day="${i}" style="width:14px;height:9px;background:${bg};border:${border};" title="${p.name} · ${dateLabel(i)}"></div></td>`;
    }
    bodyRows += `<tr>
      <td class="manage-name">${p.name}</td>
      ${cells}
      <td class="manage-gauge-col">${ringGauge(p.percent, 22, 15, 5)}</td>
      <td class="manage-score-col">${p.count}일 · ${p.count * 5}점</td>
    </tr>`;
  });

  return `
    <div class="eyebrow">MISSION CONTROL</div>
    <h1>온라인선교 챌린지 관리</h1>
    <div class="sub" style="margin-bottom:16px;">2026.09.01 – 2026.10.03 · ${d.isActiveToday ? "DAY " + (d.idx + 1) + " / " + TOTAL_DAYS + " 진행 중" : (d.idx < 0 ? "시작 전" : "종료")}</div>

    <div class="stat-grid" style="margin-bottom:14px;">${statTiles}</div>

    <div class="card" style="margin-bottom:14px;">
      <div class="panel-head">
        <div class="panel-title" style="color:var(--cyan);"><span class="live-dot" style="background:var(--cyan);box-shadow:0 0 5px var(--cyan);"></span>오늘의 별자리</div>
        <div class="panel-note">${d.isActiveToday ? d.todayDoneCount + " / " + STUDENTS.length + " 도착" : ""}</div>
      </div>
      ${renderConstellation(d.perStudent, d.rankByName, d.isActiveToday, false)}
    </div>

    <div class="rank-cols" style="margin-bottom:20px;">
      <div class="card">
        <div class="panel-title" style="color:var(--gold);margin-bottom:8px;"><span class="live-dot" style="background:var(--gold);box-shadow:0 0 4px var(--gold);"></span>오늘의 체크 순서</div>
        ${arrivalRows}
      </div>
      <div class="card">
        <div class="panel-title" style="color:var(--violet);margin-bottom:8px;"><span class="live-dot" style="background:var(--violet);box-shadow:0 0 4px var(--violet);"></span>누적랭킹</div>
        ${cumulativeRows}
      </div>
    </div>

    <div class="section-label">체크 관리</div>
    <div class="legend">셀 클릭 = 날짜별 체크 직접 수정 · 금색 = 오늘 · 점선 = 아직 지나지 않은 날 · 가로로 스크롤하면 전체 날짜가 보여요</div>
    <div class="manage-wrap">
      <table class="manage-table">
        <thead><tr><th></th>${headCells}<th></th><th></th></tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>

    <div class="link-row">
      <button class="link-btn" data-action="goto-student">학생 화면으로 ←</button>
    </div>
  `;
}

// ---------- 라우팅 & 렌더 ----------
function currentRoute() {
  return location.hash === "#admin" ? "admin" : "student";
}

function render() {
  const app = document.getElementById("app");
  const bg = `<div class="starfield-bg"></div>`;

  if (!state.loaded) {
    app.innerHTML = bg + `<div class="empty-notice">불러오는 중...</div>`;
    return;
  }
  if (state.loaded === "error") {
    app.innerHTML = bg + `<div class="empty-notice">데이터를 불러오지 못했어요.<br>firebase-config.js 설정을 확인해주세요.</div>`;
    return;
  }

  const route = currentRoute();
  if (route === "admin") {
    const ok = sessionStorage.getItem("adminOk") === "1";
    app.innerHTML = bg + (ok ? renderAdminScreen() : renderPinGate(state.pinError));
    return;
  }

  const myId = localStorage.getItem("myStudentId");
  app.innerHTML = bg + (myId ? renderStudentScreen(myId) : renderStudentPicker());
}

// ---------- 이벤트 위임 ----------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;

  if (action === "pick") {
    localStorage.setItem("myStudentId", el.dataset.sid);
    render();
  } else if (action === "switch-student") {
    localStorage.removeItem("myStudentId");
    render();
  } else if (action === "goto-admin") {
    location.hash = "#admin";
  } else if (action === "goto-student") {
    location.hash = "";
  } else if (action === "toggle-today") {
    const myId = localStorage.getItem("myStudentId");
    const idx = todayIndex();
    if (myId && idx >= 0 && idx < TOTAL_DAYS) toggleDay(myId, idx);
  } else if (action === "toggle-cell") {
    toggleDay(el.dataset.sid, Number(el.dataset.day));
  }
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest('[data-action="pin-submit"]');
  if (!form) return;
  e.preventDefault();
  const val = new FormData(form).get("pin");
  if (val === ADMIN_PIN) {
    sessionStorage.setItem("adminOk", "1");
    state.pinError = false;
  } else {
    state.pinError = true;
  }
  render();
});

window.addEventListener("hashchange", render);

// ---------- 시작 ----------
render();
ensureSeeded().then(subscribe).catch((e) => {
  console.error("init failed", e);
  state.loaded = "error";
  render();
});
