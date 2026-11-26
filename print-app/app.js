import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, query, where, orderBy,
  onSnapshot, writeBatch, deleteDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  firebaseConfig, KAKAO_JS_KEY, KAKAO_CHANNEL_URL, CENTER_NAME, PRINTERS, SLOTS, MAX_SLOTS_PER_REQUEST,
  BOOKING_DAYS_AHEAD, CLOSED_WEEKDAYS, CLOSED_DATES, MATERIALS, MAX_PHOTOS, RETENTION_MONTHS,
  STAFF_IDLE_MINUTES, SHARED_IDLE_MINUTES, PRIVACY_CONTACT
} from "./config.js";

// ---------- Firebase ----------
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);
const reqCol = collection(db, "printRequests");   // 요청서 원본 (비공개)
const pubCol = collection(db, "printPublic");     // 현황판용 요약 (가린 이름·학번)
const slotCol = collection(db, "printSlots");
const keyCol = collection(db, "printKeys");
const grantCol = collection(db, "printGrants");
const staffCol = collection(db, "printStaff");
const photoColOf = (id) => collection(db, "printRequests", id, "photos");

// ---------- 상태 정의 ----------
const STATUS = {
  requested: { label: "접수", desc: "매니저 확인 대기", step: 0 },
  approved: { label: "예약 확정", desc: "예약 시간에 출력 예정", step: 1 },
  printing: { label: "출력 중", desc: "프린터에서 출력 중", step: 2 },
  done: { label: "출력 완료", desc: "센터에서 수령 가능", step: 3 },
  received: { label: "수령 완료", desc: "활용 사진 등록 대기", step: 4 },
  used: { label: "활용 등록", desc: "모든 과정 완료", step: 5 },
  rejected: { label: "반려", desc: "요청이 반려됨", step: -1 },
  canceled: { label: "취소", desc: "학생이 취소함", step: -1 }
};
const FLOW = ["requested", "approved", "printing", "done", "received", "used"];
const ACTIVE = ["requested", "approved", "printing", "done"];
const CERT_OPTIONS = ["소지", "미소지", "취득 준비 중"];
const ROLE_LABEL = { manager: "매니저", admin: "관리자", student: "학생" };

// ---------- 로그인 상태 ----------
// me.role: student(익명 로그인) / manager / admin / unregistered(명단에 없는 구글 계정)
const me = { uid: null, email: "", name: "", role: "student" };
const isStaff = () => me.role === "manager" || me.role === "admin";
const isAdmin = () => me.role === "admin";
const actor = () => (isStaff() ? `${me.role}:${me.name}` : "student");
function actorLabel(by) {
  if (!by || by === "student") return "학생";
  const [role, name] = by.split(":");
  return `${ROLE_LABEL[role] || role}${name ? " " + name : ""}`;
}

// ---------- 유틸 ----------
const $app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WD = ["일", "월", "화", "수", "목", "금", "토"];
function dateLabel(s) {
  const [y, m, d] = String(s).split("-").map(Number);
  return `${m}/${d}(${WD[new Date(y, m - 1, d).getDay()]})`;
}
function fmtTime(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const printerName = (id) => (PRINTERS.find((p) => p.id === id) || {}).name || id;
function slotRange(slots) {
  if (!slots || !slots.length) return "";
  const last = SLOTS.indexOf(slots[slots.length - 1]);
  const end = SLOTS[last + 1] || `${pad(Number(slots[slots.length - 1].slice(0, 2)) + 1)}:00`;
  return `${slots[0]}~${end}`;
}
function maskName(n) {
  const s = String(n || "");
  if (s.length <= 1) return s;
  if (s.length === 2) return s[0] + "*";
  return s[0] + "*".repeat(s.length - 2) + s[s.length - 1];
}
function maskNo(n) {
  const s = String(n || "");
  return s.length <= 4 ? s : s.slice(0, 4) + "*".repeat(s.length - 4);
}
function certBadge(c) {
  if (!c) return `<span class="cert c-none">미입력</span>`;
  return `<span class="cert ${c === "소지" ? "c-yes" : c === "취득 준비 중" ? "c-prep" : "c-no"}">${esc(c)}</span>`;
}
function newId() {
  const d = new Date();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = crypto.getRandomValues(new Uint32Array(6));
  let r = "";
  for (let i = 0; i < 6; i++) r += chars[rnd[i] % chars.length];
  return `P${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${r}`;
}
// 비밀번호는 저장하지 않고 해시만 키 문서 ID로 사용
async function pinKey(id, pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${id}:${pin}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function bookableDates() {
  const out = [];
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  for (let i = 0; i <= BOOKING_DAYS_AHEAD; i++) {
    const d = new Date(t);
    d.setDate(t.getDate() + i);
    const s = ymd(d);
    if (CLOSED_WEEKDAYS.includes(d.getDay()) || CLOSED_DATES.includes(s)) continue;
    out.push(s);
  }
  return out;
}
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}
const requestUrl = (id) => `${location.origin}${location.pathname}#/r/${id}`;
const denied = (e) => e && (e.code === "permission-denied" || /permission/i.test(e.message || ""));

// ---------- 기기 설정 ----------
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가 환경 */ } }
// 공용 PC 모드: 이 기기에 학생 기록을 남기지 않고, 일정 시간 미사용 시 자동 초기화
const isSharedDevice = () => lsGet("print-shared-device", false) === true;
// 이 기기에서 접수한 요청 (접수번호만 저장, 비밀번호는 저장하지 않음)
const MY_KEY = "print-my-requests";
const myRequests = () => (isSharedDevice() ? [] : lsGet(MY_KEY, []).filter((x) => typeof x === "string"));
function rememberRequest(id) {
  if (isSharedDevice()) return;
  lsSet(MY_KEY, [id, ...myRequests().filter((x) => x !== id)].slice(0, 20));
}

// ---------- 자동 로그아웃 ----------
let lastActive = Date.now();
["pointerdown", "keydown", "scroll", "touchstart"].forEach((ev) =>
  window.addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true }));
setInterval(() => {
  const idleMin = (Date.now() - lastActive) / 60000;
  if (isStaff() && idleMin >= STAFF_IDLE_MINUTES) {
    endSession(`${STAFF_IDLE_MINUTES}분 동안 사용하지 않아 자동 로그아웃되었습니다.`);
  } else if (!isStaff() && isSharedDevice() && idleMin >= SHARED_IDLE_MINUTES && location.hash && location.hash !== "#/") {
    endSession("공용 PC: 사용하지 않아 처음 화면으로 돌아왔습니다.");
  }
}, 20000);

// 로그아웃 → 새 익명 학생 세션으로 교체
async function endSession(msg) {
  lastActive = Date.now();
  try { await signOut(auth); } catch { /* 무시 */ }
  location.hash = "#/";
  if (msg) toast(msg);
}

// ---------- 사진 압축 ----------
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let max = 1280, q = 0.75, out = "";
      for (let tries = 0; tries < 6; tries++) {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        out = c.toDataURL("image/jpeg", q); // 다시 그리면서 사진의 위치(GPS) 등 메타데이터도 제거됨
        if (out.length < 700000) return resolve(out);
        max = Math.round(max * 0.8);
        q = Math.max(0.5, q - 0.08);
      }
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("이미지를 읽을 수 없습니다")); };
    img.src = url;
  });
}
async function uploadPhotos(requestId, kind, files) {
  for (const f of files) {
    const data = await compressImage(f);
    await setDoc(doc(photoColOf(requestId)), { kind, data, createdAt: Date.now(), by: actor() });
  }
}
async function loadPhotos(requestId) {
  const snap = await getDocs(photoColOf(requestId));
  return snap.docs.map((d) => d.data()).sort((a, b) => a.createdAt - b.createdAt);
}

// ---------- 카카오톡 공유 ----------
let kakaoReady = null;
function loadKakao() {
  if (!KAKAO_JS_KEY) return Promise.resolve(false);
  if (kakaoReady) return kakaoReady;
  kakaoReady = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
    s.onload = () => {
      try { if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_JS_KEY); resolve(true); } catch { resolve(false); }
    };
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return kakaoReady;
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast("복사했습니다. 카카오톡 1:1 대화에 붙여넣으세요."); }
  catch { prompt("아래 내용을 복사하세요", text); }
}
async function shareKakao(text, url) {
  if (await loadKakao()) {
    window.Kakao.Share.sendDefault({ objectType: "text", text, link: { mobileWebUrl: url, webUrl: url }, buttonTitle: "진행 현황 보기" });
    return;
  }
  if (navigator.share) {
    try { await navigator.share({ title: "3D프린터 출력 요청", text, url }); return; } catch { /* 닫음 */ }
  }
  copyText(`${text}\n${url}`);
}
// 단톡방 오발송 대비: 안내 문구에는 가린 이름만 사용
function staffNoticeText(r) {
  const head = `[${CENTER_NAME} 3D프린터] ${maskName(r.name)}님,`;
  const body = {
    approved: `'${r.title}' 출력 예약이 확정되었습니다.\n예약: ${dateLabel(r.date)} ${slotRange(r.slots)} / ${printerName(r.printerId)}`,
    printing: `'${r.title}' 출력을 시작했습니다.${r.printHours ? ` (예상 ${r.printHours}시간)` : ""}`,
    done: `'${r.title}' 출력이 완료되었습니다. 센터에서 수령해 주세요.\n수령 후 아래 링크에서 '수령 확인'과 활용 사진 등록을 부탁드립니다.`,
    rejected: `'${r.title}' 요청이 반려되었습니다.\n사유: ${r.rejectReason || "-"}`,
    received: `'${r.title}' 수령이 확인되었습니다. 활용 사진을 등록해 주세요.`
  }[r.status] || `'${r.title}' 현재 상태: ${STATUS[r.status].label}`;
  return `${head}\n${body}\n접수번호: ${r.id}`;
}

// ---------- 라우터 ----------
let unsubs = [];
function clearSubs() { unsubs.forEach((u) => u()); unsubs = []; }
function route() {
  clearSubs();
  $app.onclick = null;
  const h = location.hash.replace(/^#\/?/, "");
  const [page, arg] = h.split("/");
  window.scrollTo(0, 0);
  if (page === "new") return renderNew();
  if (page === "board") return renderBoard();
  if (page === "find") return renderFind();
  if (page === "r" && arg) return renderDetail(arg);
  if (page === "staff") return isStaff() ? renderStaff() : renderLogin();
  return renderHome();
}
window.addEventListener("hashchange", route);

function shell(inner, { back = true } = {}) {
  const right = isStaff()
    ? `<span class="role r-${me.role}">${ROLE_LABEL[me.role]} · ${esc(me.name)}</span>`
    : isSharedDevice()
      ? `<button class="btn small" id="endBtn">이용 종료</button>`
      : `<span class="brand">${esc(CENTER_NAME)} · 3D프린터</span>`;
  $app.innerHTML = `
    <header class="top">
      ${back ? `<a class="back" href="${isStaff() ? "#/staff" : "#/"}">‹ ${isStaff() ? "콘솔로" : "처음으로"}</a>` : `<span></span>`}
      ${right}
    </header>
    ${isSharedDevice() && !isStaff() ? `<div class="shared-note">공용 PC입니다. 다 쓰고 나면 <b>이용 종료</b>를 눌러 주세요. (${SHARED_IDLE_MINUTES}분 미사용 시 자동 종료)</div>` : ""}
    <main>${inner}</main>`;
  const end = document.getElementById("endBtn");
  if (end) end.onclick = () => endSession("이용을 종료했습니다.");
}

// ---------- 홈 ----------
function renderHome() {
  const mine = myRequests();
  shell(`
    <h1>3D프린터 출력 요청</h1>
    <p class="sub">예약 → 요청서 → 출력 → 수령 → 활용 사진까지 한 곳에서 기록합니다.</p>
    <ol class="flow">
      ${["예약·요청서", "매니저 확인", "출력", "완료 사진", "수령", "활용 사진"].map((t, i) => `<li><b>${i + 1}</b>${t}</li>`).join("")}
    </ol>
    <div class="menu">
      <a class="btn primary big" href="#/new">＋ 출력 예약하기</a>
      <a class="btn big" href="#/board">진행 현황판 보기</a>
      <a class="btn big" href="#/find">내 요청 조회 (접수번호 + 비밀번호)</a>
    </div>
    ${mine.length ? `<h2>이 기기에서 접수한 요청</h2><div id="mine" class="list"><p class="muted">불러오는 중…</p></div>` : ""}
    ${KAKAO_CHANNEL_URL ? `<a class="btn kakao big" href="${esc(KAKAO_CHANNEL_URL)}" target="_blank" rel="noopener">카카오톡 채널로 문의하기</a>` : ""}
    <p class="foot"><a href="#/staff">운영자(매니저·관리자) 로그인</a></p>
  `, { back: false });
  if (mine.length) {
    Promise.all(mine.map((id) => getDoc(doc(reqCol, id)).catch(() => null))).then((snaps) => {
      const el = document.getElementById("mine");
      if (!el) return;
      const rows = snaps.filter((s) => s && s.exists()).map((s) => ({ id: s.id, ...s.data() }));
      el.innerHTML = rows.length ? rows.map((r) => cardHtml(r)).join("") : `<p class="muted">이 기기에서 볼 수 있는 기록이 없습니다. '내 요청 조회'를 이용하세요.</p>`;
    });
  }
}

function badge(status) {
  return `<span class="badge s-${status}">${STATUS[status]?.label || status}</span>`;
}
function cardHtml(r, attr = `href="#/r/${esc(r.id)}"`) {
  return `
    <a class="card" ${attr}>
      <div class="card-top">${badge(r.status)}<span class="mono">${esc(r.id)}</span></div>
      <div class="card-title">${esc(r.title)}</div>
      <div class="card-meta">${esc(r.dept || "")} ${esc(r.name)} · 자격증 ${esc(r.cert || "-")} · ${dateLabel(r.date)} ${slotRange(r.slots)} · ${esc(printerName(r.printerId))}</div>
    </a>`;
}

// ---------- 새 예약 ----------
const draft = { date: null, printerId: PRINTERS[0].id, slots: [] };
let takenSlots = new Set();

function consentHtml() {
  return `
    <div class="consent">
      <h3>개인정보 수집·이용 동의 (필수)</h3>
      <table>
        <tr><th>수집 항목</th><td>이름, 학번, 학과/소속, 3D프린터운용기능사 자격증 소지 여부, 출력물 정보(파일 링크·사양), 출력 완료·활용 사진</td></tr>
        <tr><th>이용 목적</th><td>3D프린터 예약 및 출력 관리, 출력물 수령 확인, 센터 운영 실적 집계·보고</td></tr>
        <tr><th>보유 기간</th><td>예약일로부터 ${RETENTION_MONTHS}개월 후 파기 (통계용 학과·자격증·목적 정보만 이름 없이 보존)</td></tr>
        <tr><th>공개 범위</th><td>진행 현황판에는 이름·학번 일부를 가려 표시(예: 홍*동, 2025****). 사진과 원본 정보는 본인과 운영자만 열람</td></tr>
        <tr><th>거부 권리</th><td>동의를 거부할 수 있으며, 이 경우 출력 서비스 이용이 제한됩니다.</td></tr>
        <tr><th>문의</th><td>${esc(PRIVACY_CONTACT)}</td></tr>
      </table>
      <label class="check"><input type="checkbox" name="agree" required> <span>위 내용을 확인했으며 개인정보 수집·이용에 동의합니다.</span></label>
    </div>`;
}

function renderNew() {
  const dates = bookableDates();
  if (!draft.date || !dates.includes(draft.date)) draft.date = dates[0];
  draft.slots = [];
  shell(`
    <h1>출력 예약하기</h1>
    <section class="panel">
      <h2><b class="num">1</b> 날짜·장비·시간 선택</h2>
      <div class="chips" id="dates">
        ${dates.map((d) => `<button type="button" class="chip ${d === draft.date ? "on" : ""}" data-date="${d}">${dateLabel(d)}</button>`).join("")}
      </div>
      <div class="chips" id="printers">
        ${PRINTERS.map((p) => `<button type="button" class="chip ${p.id === draft.printerId ? "on" : ""}" data-printer="${p.id}">${esc(p.name)}</button>`).join("")}
      </div>
      <div class="slots" id="slots"><p class="muted">예약 현황 불러오는 중…</p></div>
      <p class="hint">연속된 시간을 최대 ${MAX_SLOTS_PER_REQUEST}칸까지 선택할 수 있습니다. 회색 칸은 이미 예약된 시간입니다.</p>
    </section>

    <form class="panel" id="reqForm">
      <h2><b class="num">2</b> 출력 요청서</h2>
      <div class="grid2">
        <label>이름 *<input name="name" required maxlength="20" autocomplete="off"></label>
        <label>학번 *<input name="studentNo" required maxlength="20" inputmode="numeric" autocomplete="off"></label>
        <label>학과/소속 *<input name="dept" required maxlength="40"></label>
        <label>3D프린터운용기능사 자격증 *
          <select name="cert" required><option value="">선택</option>${CERT_OPTIONS.map((c) => `<option>${c}</option>`).join("")}</select>
        </label>
      </div>
      <label>출력물 이름 *<input name="title" required maxlength="60" placeholder="예) 캡스톤 시제품 케이스"></label>
      <label>사용 목적 *
        <select name="purpose" required>
          <option value="">선택</option>
          <option>수업 과제</option><option>캡스톤/졸업작품</option><option>공모전·경진대회</option>
          <option>동아리·비교과</option><option>창업·시제품</option><option>개인 학습</option><option>기타</option>
        </select>
      </label>
      <label>출력 파일 링크 * <small>(구글드라이브·원드라이브 등, STL/OBJ/3MF)</small>
        <input name="fileLink" required type="url" placeholder="https://"></label>
      <p class="hint warn">파일 공유는 폴더 전체가 아니라 <b>출력할 파일 하나만</b> "링크가 있는 사용자 보기"로 공유해 주세요.</p>
      <div class="grid3">
        <label>재료<select name="material">${MATERIALS.map((m) => `<option>${esc(m)}</option>`).join("")}</select></label>
        <label>색상<input name="color" maxlength="20" placeholder="흰색"></label>
        <label>수량<input name="qty" type="number" min="1" max="50" value="1"></label>
      </div>
      <label>크기(가로×세로×높이 mm)<input name="size" maxlength="40" placeholder="예) 80×60×40"></label>
      <label>요청 사항<textarea name="note" rows="3" maxlength="500" placeholder="서포트, 채움 비율, 마감 기한 등 (개인정보는 적지 마세요)"></textarea></label>

      <h2><b class="num">3</b> 조회 비밀번호</h2>
      <label>숫자 4자리 * <small>(다른 기기에서 진행 확인·수령 확인·활용 사진 등록에 필요. 다른 서비스와 다른 번호 권장)</small>
        <input name="pin" required pattern="\\d{4}" maxlength="4" inputmode="numeric" type="password" autocomplete="new-password" placeholder="0000"></label>

      ${consentHtml()}

      <div id="summary" class="summary muted">시간을 선택해 주세요.</div>
      <button class="btn primary big" type="submit" id="submitBtn">예약 신청</button>
    </form>
  `);

  document.getElementById("dates").onclick = (e) => {
    const b = e.target.closest("[data-date]");
    if (!b) return;
    draft.date = b.dataset.date;
    draft.slots = [];
    document.querySelectorAll("#dates .chip").forEach((c) => c.classList.toggle("on", c === b));
    watchSlots();
  };
  document.getElementById("printers").onclick = (e) => {
    const b = e.target.closest("[data-printer]");
    if (!b) return;
    draft.printerId = b.dataset.printer;
    draft.slots = [];
    document.querySelectorAll("#printers .chip").forEach((c) => c.classList.toggle("on", c === b));
    drawSlots();
  };
  document.getElementById("slots").onclick = (e) => {
    const b = e.target.closest("[data-slot]");
    if (!b || b.disabled) return;
    toggleSlot(b.dataset.slot);
    drawSlots();
  };
  document.getElementById("reqForm").onsubmit = submitRequest;
  watchSlots();
}

function watchSlots() {
  clearSubs();
  const date = draft.date;
  unsubs.push(onSnapshot(query(slotCol, where("date", "==", date)), (snap) => {
    if (date !== draft.date) return;
    takenSlots = new Set(snap.docs.map((d) => d.id));
    draft.slots = draft.slots.filter((s) => !takenSlots.has(`${date}_${draft.printerId}_${s}`));
    drawSlots();
  }, () => {
    const el = document.getElementById("slots");
    if (el) el.innerHTML = `<p class="err">예약 현황을 불러오지 못했습니다. 네트워크를 확인해 주세요.</p>`;
  }));
}
function slotPast(date, slot) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, Number(slot.slice(0, 2)), 0) < new Date();
}
function toggleSlot(slot) {
  const idx = SLOTS.indexOf(slot);
  const sel = draft.slots.map((s) => SLOTS.indexOf(s));
  if (draft.slots.includes(slot)) {
    if (idx === Math.min(...sel) || idx === Math.max(...sel)) draft.slots = draft.slots.filter((s) => s !== slot);
    else draft.slots = [slot];
  } else if (!sel.length) {
    draft.slots = [slot];
  } else if ((idx === Math.max(...sel) + 1 || idx === Math.min(...sel) - 1) && sel.length < MAX_SLOTS_PER_REQUEST) {
    draft.slots.push(slot);
  } else {
    draft.slots = [slot];
  }
  draft.slots.sort((a, b) => SLOTS.indexOf(a) - SLOTS.indexOf(b));
}
function drawSlots() {
  const el = document.getElementById("slots");
  if (!el) return;
  el.innerHTML = SLOTS.map((s) => {
    const taken = takenSlots.has(`${draft.date}_${draft.printerId}_${s}`);
    const past = slotPast(draft.date, s);
    const on = draft.slots.includes(s);
    return `<button type="button" class="slot ${on ? "on" : ""}" data-slot="${s}" ${taken || past ? "disabled" : ""}>
      ${s}<small>${taken ? "예약됨" : past ? "지남" : on ? "선택" : "가능"}</small></button>`;
  }).join("");
  const sum = document.getElementById("summary");
  if (sum) {
    sum.innerHTML = draft.slots.length
      ? `<b>${dateLabel(draft.date)} ${slotRange(draft.slots)}</b> · ${esc(printerName(draft.printerId))} (${draft.slots.length}시간)`
      : "시간을 선택해 주세요.";
    sum.classList.toggle("muted", !draft.slots.length);
  }
}

function publicOf(r) {
  return {
    maskedName: maskName(r.name), maskedNo: maskNo(r.studentNo), dept: r.dept, cert: r.cert, title: r.title,
    date: r.date, printerId: r.printerId, slots: r.slots, status: r.status, updatedAt: r.updatedAt
  };
}

async function submitRequest(e) {
  e.preventDefault();
  if (!draft.slots.length) return toast("예약 시간을 선택해 주세요.");
  if (!me.uid) return toast("연결 중입니다. 잠시 후 다시 시도해 주세요.");
  const f = new FormData(e.target);
  const v = (k) => String(f.get(k) || "").trim();
  if (!/^\d{4}$/.test(v("pin"))) return toast("비밀번호는 숫자 4자리입니다.");
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "신청 중…";
  const id = newId();
  const now = Date.now();
  const r = {
    id, ownerUid: me.uid, status: "requested", createdAt: now, updatedAt: now,
    name: v("name"), studentNo: v("studentNo"), dept: v("dept"), cert: v("cert"),
    title: v("title"), purpose: v("purpose"), fileLink: v("fileLink"),
    material: v("material"), color: v("color"), qty: Number(v("qty")) || 1, size: v("size"), note: v("note"),
    date: draft.date, printerId: draft.printerId, slots: [...draft.slots],
    history: [{ status: "requested", at: now, by: "student", memo: "" }],
    donePhotoCount: 0, usagePhotoCount: 0, consentAt: now, consentVersion: `v1-${RETENTION_MONTHS}m`
  };
  try {
    const key = await pinKey(id, v("pin"));
    const batch = writeBatch(db);
    batch.set(doc(reqCol, id), r);
    batch.set(doc(pubCol, id), publicOf(r));
    batch.set(doc(keyCol, key), { requestId: id, createdAt: now });
    r.slots.forEach((s) => batch.set(doc(slotCol, `${r.date}_${r.printerId}_${s}`),
      { requestId: id, date: r.date, printerId: r.printerId, slot: s, createdAt: now }));
    await batch.commit();
    rememberRequest(id);
    renderSubmitted(r);
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "예약 신청";
    toast("방금 다른 사람이 같은 시간을 예약했거나 네트워크 오류입니다. 시간을 다시 선택해 주세요.");
  }
}

function renderSubmitted(r) {
  shell(`
    <div class="done-box">
      <div class="done-icon">✓</div>
      <h1>예약 신청 완료</h1>
      <p>매니저가 확인하면 <b>예약 확정</b>으로 바뀝니다.</p>
      <div class="ticket">
        <div><span>접수번호</span><b class="mono">${esc(r.id)}</b></div>
        <div><span>예약</span><b>${dateLabel(r.date)} ${slotRange(r.slots)}</b></div>
        <div><span>장비</span><b>${esc(printerName(r.printerId))}</b></div>
      </div>
      <p class="hint"><b>접수번호를 꼭 기록해 두세요.</b> 접수번호와 비밀번호 4자리로 언제든 진행 상황을 확인할 수 있습니다.
      ${isSharedDevice() ? "<br>공용 PC에는 기록이 남지 않습니다." : ""}</p>
      <button class="btn kakao big" id="shareBtn">카카오톡으로 나에게 보내기</button>
      <a class="btn big" href="#/r/${esc(r.id)}">진행 현황 보기</a>
    </div>`);
  document.getElementById("shareBtn").onclick = () =>
    shareKakao(`[${CENTER_NAME} 3D프린터 예약]\n접수번호: ${r.id}\n${dateLabel(r.date)} ${slotRange(r.slots)} / ${printerName(r.printerId)}\n출력물: ${r.title}`, requestUrl(r.id));
}

// ---------- 진행 현황판 (공개 요약만 사용) ----------
function renderBoard() {
  const dates = bookableDates();
  let sel = dates[0];
  let active = [];
  let logs = [];
  shell(`
    <h1>진행 현황판</h1>
    <p class="sub">예약표와 진행 중인 출력물을 실시간으로 보여줍니다. 개인정보 보호를 위해 이름·학번 일부는 가려집니다.</p>
    <div class="chips" id="bDates">${dates.map((d) => `<button class="chip ${d === sel ? "on" : ""}" data-date="${d}">${dateLabel(d)}</button>`).join("")}</div>
    <div id="timetable" class="tt-wrap"><p class="muted">불러오는 중…</p></div>
    <h2>진행 중인 요청</h2>
    <div id="active" class="board"></div>
    <h2>이용 기록</h2>
    <div class="tt-wrap"><table class="log"><thead><tr><th>일자</th><th>학과</th><th>학번</th><th>이름</th><th>자격증</th><th>출력물</th><th>상태</th></tr></thead>
      <tbody id="logBody"><tr><td colspan="7" class="muted">불러오는 중…</td></tr></tbody></table></div>
  `);
  const draw = () => {
    const tt = document.getElementById("timetable");
    if (tt) tt.innerHTML = timetableHtml(sel, active, false);
    const ac = document.getElementById("active");
    if (ac) {
      ac.innerHTML = ACTIVE.map((s) => {
        const rows = active.filter((r) => r.status === s).sort((a, b) => (a.date + a.slots[0]).localeCompare(b.date + b.slots[0]));
        return `<div class="col"><h3>${badge(s)} <span>${rows.length}</span></h3>
          ${rows.map((r) => `<div class="mini"><b>${esc(r.maskedName)}</b> ${esc(r.title)}<small>${dateLabel(r.date)} ${slotRange(r.slots)} · ${esc(printerName(r.printerId))}</small></div>`).join("") || `<p class="muted">없음</p>`}
        </div>`;
      }).join("");
    }
    const lb = document.getElementById("logBody");
    if (lb) {
      const rows = [...active, ...logs].sort((a, b) => (b.date + b.slots[0]).localeCompare(a.date + a.slots[0])).slice(0, 60);
      lb.innerHTML = rows.length ? rows.map((r) => `<tr><td>${dateLabel(r.date)}</td><td>${esc(r.dept)}</td><td class="mono">${esc(r.maskedNo)}</td>
        <td>${esc(r.maskedName)}</td><td>${certBadge(r.cert)}</td><td>${esc(r.title)}</td><td>${badge(r.status)}</td></tr>`).join("")
        : `<tr><td colspan="7" class="muted">기록이 없습니다.</td></tr>`;
    }
  };
  document.getElementById("bDates").onclick = (e) => {
    const b = e.target.closest("[data-date]");
    if (!b) return;
    sel = b.dataset.date;
    document.querySelectorAll("#bDates .chip").forEach((c) => c.classList.toggle("on", c === b));
    draw();
  };
  unsubs.push(onSnapshot(query(pubCol, where("status", "in", ACTIVE)), (snap) => {
    active = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    draw();
  }, () => {
    const tt = document.getElementById("timetable");
    if (tt) tt.innerHTML = `<p class="err">불러오지 못했습니다.</p>`;
  }));
  unsubs.push(onSnapshot(query(pubCol, where("status", "in", ["received", "used"])), (snap) => {
    logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    draw();
  }, () => {}));
}

function timetableHtml(date, reqs, staff) {
  const cell = {};
  reqs.filter((r) => r.date === date && !["rejected", "canceled"].includes(r.status)).forEach((r) => {
    r.slots.forEach((s, i) => { cell[`${r.printerId}_${s}`] = { r, first: i === 0 }; });
  });
  return `<table class="tt"><thead><tr><th></th>${PRINTERS.map((p) => `<th>${esc(p.name)}</th>`).join("")}</tr></thead><tbody>
    ${SLOTS.map((s) => `<tr><th>${s}</th>${PRINTERS.map((p) => {
      const c = cell[`${p.id}_${s}`];
      if (!c) return `<td class="free">-</td>`;
      const label = c.first ? `${esc(staff ? c.r.name : c.r.maskedName)}<small>${esc(c.r.title)}</small>` : "↓";
      return staff
        ? `<td class="busy s-${c.r.status}"><a href="#" data-open="${esc(c.r.id)}">${label}</a></td>`
        : `<td class="busy s-${c.r.status}">${label}</td>`;
    }).join("")}</tr>`).join("")}
  </tbody></table>`;
}

// ---------- 내 요청 조회 / 열람권 ----------
// 비밀번호가 맞으면 printGrants에 열람권이 생성되고(규칙에서 해시 키로 검증), 이후 이 로그인으로 요청을 볼 수 있음
async function unlockRequest(id, pin) {
  const key = await pinKey(id, pin);
  try {
    await setDoc(doc(grantCol, `${me.uid}_${id}`), { uid: me.uid, requestId: id, key, createdAt: Date.now() });
  } catch (e) {
    // 이미 열람권이 있으면 생성이 거부되므로 읽기로 다시 확인
    const ok = await getDoc(doc(reqCol, id)).then((s) => s.exists()).catch(() => false);
    if (!ok) throw e;
  }
  rememberRequest(id);
}

function renderFind() {
  shell(`
    <h1>내 요청 조회</h1>
    <form class="panel" id="findForm">
      <label>접수번호<input name="id" required placeholder="P261126-ABCDEF" autocapitalize="characters" autocomplete="off"></label>
      <label>비밀번호 4자리<input name="pin" required maxlength="4" inputmode="numeric" type="password" autocomplete="off"></label>
      <button class="btn primary big">조회</button>
    </form>`);
  document.getElementById("findForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const id = String(f.get("id")).trim().toUpperCase();
    try {
      await unlockRequest(id, String(f.get("pin")).trim());
      location.hash = `#/r/${id}`;
    } catch { toast("접수번호 또는 비밀번호가 맞지 않습니다."); }
  };
}

// ---------- 요청 상세 (학생/운영자 공용) ----------
function renderDetail(id, { inStaff = false } = {}) {
  const staff = isStaff();
  const target = inStaff ? document.getElementById("detail") : null;
  const render = (html) => { if (target) target.innerHTML = html; else shell(html); };
  const askPin = () => {
    render(`<h1>요청 확인</h1>
      <form class="panel" id="unlock"><p>접수번호 <b class="mono">${esc(id)}</b>의 비밀번호 4자리를 입력하세요.</p>
      <label>비밀번호<input name="pin" required maxlength="4" inputmode="numeric" type="password" autocomplete="off"></label>
      <button class="btn primary big">확인</button></form>`);
    document.getElementById("unlock").onsubmit = async (e) => {
      e.preventDefault();
      try {
        await unlockRequest(id, String(new FormData(e.target).get("pin")).trim());
        route();
      } catch { toast("비밀번호가 맞지 않습니다."); }
    };
  };
  render(`<p class="muted">불러오는 중…</p>`);
  let photos = null;
  unsubs.push(onSnapshot(doc(reqCol, id), async (snap) => {
    if (!snap.exists()) return render(`<h1>존재하지 않는 요청입니다.</h1>`);
    const r = { id: snap.id, ...snap.data() };
    const need = (r.donePhotoCount || 0) + (r.usagePhotoCount || 0);
    if (!photos || photos.length !== need) photos = await loadPhotos(id).catch(() => []);
    render(detailHtml(r, photos, staff));
    bindDetail(r);
  }, (err) => {
    if (denied(err) && !staff) askPin();
    else render(`<p class="err">불러오지 못했습니다.</p>`);
  }));
}

function timelineHtml(r, staff) {
  if (["rejected", "canceled"].includes(r.status)) {
    return `<div class="stopped">${badge(r.status)} ${r.status === "rejected" ? `사유: ${esc(r.rejectReason || "-")}` : "예약이 취소되었습니다."}</div>`;
  }
  const cur = STATUS[r.status].step;
  const at = {}, who = {};
  (r.history || []).forEach((h) => { at[h.status] = h.at; who[h.status] = h.by; });
  return `<ol class="timeline">${FLOW.map((s, i) => `
    <li class="${i < cur ? "past" : i === cur ? "now" : ""}">
      <span class="dot"></span><b>${STATUS[s].label}</b>
      <small>${at[s] ? fmtTime(at[s]) + (staff ? ` · ${esc(actorLabel(who[s]))}` : "") : i === cur ? STATUS[s].desc : ""}</small>
    </li>`).join("")}</ol>`;
}

const photoGrid = (list) => list.length ? `<div class="photos">${list.map((p) => `<img src="${p.data}" alt="" loading="lazy">`).join("")}</div>` : "";

function uploader(kind, label, withNote) {
  return `<form class="panel upl" data-kind="${kind}">
    <h3>${label}</h3>
    <p class="hint warn">📷 <b>출력물만</b> 나오게 찍어 주세요. 얼굴, 학생증·명찰, 모니터 화면, 다른 사람이 찍히지 않도록 해 주세요.</p>
    <input type="file" name="files" accept="image/*" multiple required>
    <div class="prev"></div>
    ${withNote ? `<label>어떻게 활용했나요? *<textarea name="note" rows="3" maxlength="500" required placeholder="예) 캡스톤 발표회에서 시제품으로 시연했습니다."></textarea></label>` : ""}
    <label class="check"><input type="checkbox" name="photoOk" required> <span>사진에 얼굴·학생증 등 개인정보가 없음을 확인했습니다.</span></label>
    <button class="btn primary big">등록</button>
  </form>`;
}

function adminTools(r) {
  const canFix = !["rejected", "canceled"].includes(r.status) && !r.anonymized;
  return `<div class="admin-box">
    <h3>관리자 도구</h3>
    ${canFix ? `<div class="row"><select id="fixTo">${FLOW.map((s) => `<option value="${s}" ${s === r.status ? "selected" : ""}>${STATUS[s].label}</option>`).join("")}</select>
      <button class="btn small" data-act="fix">상태 정정</button></div>` : ""}
    <details><summary>처리 이력 ${(r.history || []).length}건</summary>
      <ul class="hist">${(r.history || []).map((h) => `<li>${fmtTime(h.at)} · ${STATUS[h.status]?.label || h.status} · ${esc(actorLabel(h.by))}${h.memo ? ` — ${esc(h.memo)}` : ""}</li>`).join("")}</ul>
    </details>
    ${r.anonymized ? "" : `<button class="btn small danger" data-act="purge">이 기록 파기(익명화)</button>`}
  </div>`;
}

function detailHtml(r, photos, staff) {
  const done = photos.filter((p) => p.kind === "done");
  const usage = photos.filter((p) => p.kind === "usage");
  const s = r.status;
  let actions = "";
  if (r.anonymized) {
    actions = `<p class="muted">보유 기간이 지나 개인정보가 파기된 기록입니다.</p>`;
  } else if (staff) {
    if (s === "requested") actions = `<button class="btn primary" data-act="approve">예약 확정</button><button class="btn danger" data-act="reject">반려</button>`;
    if (s === "approved") actions = `<button class="btn primary" data-act="printing">출력 시작</button><button class="btn danger" data-act="reject">반려</button>`;
    if (s === "printing") actions = uploader("done", "출력 완료 사진 등록 → 출력 완료 처리", false);
    if (s === "done") actions = `<button class="btn primary" data-act="receive">수령 처리(대리 확인)</button>`;
    if (s === "received") actions = uploader("usage", "활용 사진 대리 등록", true);
    actions += `<div class="row"><button class="btn kakao" data-act="notice">카톡 안내 문구 복사</button></div>
      <label class="memo">운영 메모 <small>(학생에게 보이지 않음. 개인정보는 적지 마세요)</small><textarea id="memo" rows="2">${esc(r.adminMemo || "")}</textarea></label>
      <button class="btn small" data-act="memo">메모 저장</button>
      ${isAdmin() ? adminTools(r) : ""}`;
  } else {
    if (s === "requested" || s === "approved") actions = `<button class="btn danger" data-act="cancel">예약 취소</button>`;
    if (s === "done") actions = `<button class="btn primary big" data-act="receive">출력물 받았어요 (수령 확인)</button>`;
    if (s === "received") actions = uploader("usage", `활용 사진 등록 (최대 ${MAX_PHOTOS}장)`, true);
    if (s === "used") actions = `<p class="thanks">활용 기록까지 완료되었습니다. 감사합니다!</p>`;
    actions += `<button class="btn kakao" data-act="share">카카오톡으로 공유</button>`;
  }
  return `
    <div class="detail">
      <div class="card-top">${badge(s)}<span class="mono">${esc(r.id)}</span></div>
      <h1>${esc(r.title)}</h1>
      ${timelineHtml(r, staff)}
      <dl class="info">
        <dt>예약</dt><dd>${dateLabel(r.date)} ${slotRange(r.slots)} · ${esc(printerName(r.printerId))}</dd>
        <dt>신청자</dt><dd>${esc(r.name)} (${esc(r.dept)} ${esc(r.studentNo)})</dd>
        <dt>자격증</dt><dd>${certBadge(r.cert)}</dd>
        <dt>목적</dt><dd>${esc(r.purpose)}</dd>
        ${r.fileLink ? `<dt>파일</dt><dd><a href="${esc(r.fileLink)}" target="_blank" rel="noopener noreferrer">파일 열기 ↗</a></dd>` : ""}
        <dt>사양</dt><dd>${esc(r.material)} · ${esc(r.color || "색상 무관")} · ${r.qty}개 ${r.size ? "· " + esc(r.size) : ""}</dd>
        ${r.note ? `<dt>요청사항</dt><dd>${esc(r.note)}</dd>` : ""}
        ${r.printHours ? `<dt>예상 출력</dt><dd>${esc(r.printHours)}시간</dd>` : ""}
      </dl>
      ${done.length ? `<h2>출력 완료 사진</h2>${photoGrid(done)}` : ""}
      ${usage.length ? `<h2>활용 사진</h2>${photoGrid(usage)}${r.usageNote ? `<p class="quote">${esc(r.usageNote)}</p>` : ""}` : ""}
      <div class="actions">${actions}</div>
    </div>`;
}

// 요청 원본과 공개 요약을 함께 갱신
async function setStatus(r, status, extra = {}, memo = "") {
  const now = Date.now();
  const batch = writeBatch(db);
  batch.update(doc(reqCol, r.id), { status, updatedAt: now, ...extra, history: arrayUnion({ status, at: now, by: actor(), memo }) });
  batch.update(doc(pubCol, r.id), { status, updatedAt: now });
  await batch.commit();
}
async function releaseSlots(r) {
  for (const s of r.slots) await deleteDoc(doc(slotCol, `${r.date}_${r.printerId}_${s}`)).catch(() => {});
}

// 보유 기간 경과 기록 파기: 실명·학번·파일·사진·열람권 삭제, 통계용 항목(학과·자격증·목적·날짜·장비)만 남김
async function purgeRequest(r) {
  const now = Date.now();
  const photos = await getDocs(photoColOf(r.id));
  for (const p of photos.docs) await deleteDoc(p.ref);
  for (const c of [keyCol, grantCol]) {
    const snap = await getDocs(query(c, where("requestId", "==", r.id)));
    for (const d of snap.docs) await deleteDoc(d.ref);
  }
  const batch = writeBatch(db);
  batch.update(doc(reqCol, r.id), {
    name: "(파기)", studentNo: "", fileLink: "", note: "", usageNote: "", adminMemo: "", title: "(파기)",
    rejectReason: r.rejectReason ? "(파기)" : "", anonymized: true, anonymizedAt: now, updatedAt: now,
    history: arrayUnion({ status: r.status, at: now, by: actor(), memo: "개인정보 파기(익명화)" })
  });
  batch.update(doc(pubCol, r.id), { maskedName: "-", maskedNo: "", title: "(파기)", updatedAt: now });
  await batch.commit();
}

function bindDetail(r) {
  document.querySelectorAll("[data-act]").forEach((b) => {
    b.onclick = async (e) => {
      e.preventDefault();
      const act = b.dataset.act;
      try {
        if (act === "approve") await setStatus(r, "approved");
        if (act === "printing") {
          const h = prompt("예상 출력 시간(시간 단위, 비워도 됨)", "");
          if (h === null) return;
          await setStatus(r, "printing", { printHours: h.trim() });
        }
        if (act === "reject") {
          const reason = prompt("반려 사유를 입력하세요 (학생에게 표시됩니다)");
          if (!reason) return;
          await setStatus(r, "rejected", { rejectReason: reason }, reason);
          await releaseSlots(r);
        }
        if (act === "cancel") {
          if (!confirm("예약을 취소할까요? 예약 시간이 다른 학생에게 열립니다.")) return;
          await setStatus(r, "canceled");
          await releaseSlots(r);
        }
        if (act === "receive") await setStatus(r, "received", { receivedAt: Date.now() });
        if (act === "memo") {
          await writeBatch(db).update(doc(reqCol, r.id), { adminMemo: document.getElementById("memo").value, updatedAt: Date.now() }).commit();
          toast("저장했습니다.");
        }
        if (act === "fix") {
          const to = document.getElementById("fixTo").value;
          if (to === r.status) return;
          const why = prompt(`'${STATUS[to].label}'(으)로 정정합니다. 정정 사유를 입력하세요.`);
          if (!why) return;
          await setStatus(r, to, {}, `정정: ${why}`);
        }
        if (act === "purge") {
          if (!confirm("이 기록의 이름·학번·파일 링크·사진을 영구 삭제합니다. 되돌릴 수 없습니다. 진행할까요?")) return;
          await purgeRequest(r);
          toast("파기했습니다.");
        }
        if (act === "notice") copyText(`${staffNoticeText(r)}\n${requestUrl(r.id)}`);
        if (act === "share") shareKakao(`[${CENTER_NAME} 3D프린터]\n'${r.title}' 현재 상태: ${STATUS[r.status].label}\n접수번호: ${r.id}`, requestUrl(r.id));
      } catch (err) {
        console.error(err);
        toast("처리하지 못했습니다. 권한 또는 네트워크를 확인해 주세요.");
      }
    };
  });
  document.querySelectorAll("form.upl").forEach((form) => {
    const input = form.querySelector("input[type=file]");
    input.onchange = () => {
      const files = [...input.files].slice(0, MAX_PHOTOS);
      form.querySelector(".prev").innerHTML = files.map((f) => `<img src="${URL.createObjectURL(f)}" alt="">`).join("");
      if (input.files.length > MAX_PHOTOS) toast(`사진은 최대 ${MAX_PHOTOS}장까지 등록됩니다.`);
    };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const files = [...input.files].slice(0, MAX_PHOTOS);
      if (!files.length) return toast("사진을 선택해 주세요.");
      const btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "업로드 중…";
      const kind = form.dataset.kind;
      try {
        await uploadPhotos(r.id, kind, files);
        if (kind === "done") {
          await setStatus(r, "done", { donePhotoCount: (r.donePhotoCount || 0) + files.length, doneAt: Date.now() });
        } else {
          const note = String(new FormData(form).get("note") || "").trim();
          await setStatus(r, "used", { usagePhotoCount: (r.usagePhotoCount || 0) + files.length, usageNote: note, usedAt: Date.now() });
        }
        toast("등록했습니다.");
      } catch (err) {
        console.error(err);
        btn.disabled = false;
        btn.textContent = "등록";
        toast("업로드에 실패했습니다. 사진 크기나 네트워크를 확인해 주세요.");
      }
    };
  });
}

// ---------- 운영자 로그인 (구글) ----------
function renderLogin() {
  const unregistered = me.role === "unregistered";
  shell(`
    <h1>운영자 로그인</h1>
    <p class="sub">관리자가 등록한 구글 계정으로만 들어갈 수 있습니다. 등록된 역할(매니저/관리자)에 맞는 화면이 열립니다.</p>
    ${unregistered ? `<div class="stopped"><b>${esc(me.email)}</b> 계정은 운영자로 등록되어 있지 않습니다. 담당자에게 등록을 요청하세요.</div>` : ""}
    <div class="panel">
      <button class="btn primary big" id="googleBtn">구글 계정으로 로그인</button>
      ${unregistered ? `<button class="btn big" id="outBtn">다른 계정으로 / 로그아웃</button>` : ""}
      <p class="hint">공용 PC에서는 사용 후 반드시 로그아웃하세요. ${STAFF_IDLE_MINUTES}분 동안 사용하지 않으면 자동 로그아웃됩니다.</p>
    </div>`);
  document.getElementById("googleBtn").onclick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      // onAuthStateChanged에서 역할 확인 후 화면 이동
    } catch (e) {
      console.error(e);
      toast("로그인하지 못했습니다.");
    }
  };
  const out = document.getElementById("outBtn");
  if (out) out.onclick = () => endSession();
}

// ---------- 운영자 콘솔 ----------
function renderStaff() {
  const dates = bookableDates();
  const today = ymd(new Date());
  let selDate = dates.includes(today) ? today : dates[0];
  let tab = "requested";
  let all = [];
  let search = "";
  shell(`
    <div class="staff-head">
      <h1>${isAdmin() ? "관리자" : "매니저"} 콘솔</h1>
      <div class="row">
        ${isAdmin() ? `<button class="btn small" id="csv">CSV 내보내기</button>` : ""}
        <button class="btn small" id="logout">로그아웃</button>
      </div>
    </div>
    <div class="kpis" id="kpis"></div>
    ${isAdmin() ? `<h2>실적 통계</h2><div id="stats" class="stats"></div>` : ""}
    <h2>예약표</h2>
    <div class="chips" id="sDates">${dates.map((d) => `<button class="chip ${d === selDate ? "on" : ""}" data-date="${d}">${dateLabel(d)}</button>`).join("")}</div>
    <div id="sTable" class="tt-wrap"></div>
    <h2>요청 목록</h2>
    <div class="tabs" id="tabs"></div>
    <input class="search" id="search" placeholder="이름·학번·접수번호·출력물 검색">
    <div id="sList" class="list"></div>
    <div id="detail" class="staff-detail"></div>
    ${isAdmin() ? adminPanelHtml() : ""}
  `, { back: false });
  const draw = () => {
    const count = (s) => all.filter((r) => r.status === s).length;
    document.getElementById("kpis").innerHTML = [
      ["확인 대기", "requested"], ["출력 대기", "approved"], ["출력 중", "printing"],
      ["수령 대기", "done"], ["활용 사진 대기", "received"], ["완료", "used"]
    ].map(([l, s]) => `<button class="kpi s-${s}" data-tab="${s}"><b>${count(s)}</b>${l}</button>`).join("");
    if (isAdmin()) {
      document.getElementById("stats").innerHTML = statsHtml(all);
      const old = expiredRecords(all).length;
      const pc = document.getElementById("purgeCount");
      if (pc) pc.textContent = old;
    }
    document.getElementById("sTable").innerHTML = timetableHtml(selDate, all, true);
    document.getElementById("tabs").innerHTML = [...FLOW, "rejected", "canceled", "all"].map((s) =>
      `<button class="tab ${tab === s ? "on" : ""}" data-tab="${s}">${s === "all" ? "전체" : STATUS[s].label} ${s === "all" ? all.length : count(s)}</button>`).join("");
    const q = search.toLowerCase();
    const rows = all
      .filter((r) => tab === "all" || r.status === tab)
      .filter((r) => !q || [r.name, r.studentNo, r.id, r.title].join(" ").toLowerCase().includes(q))
      .sort((a, b) => (a.date + (a.slots[0] || "")).localeCompare(b.date + (b.slots[0] || "")) * (ACTIVE.includes(tab) ? 1 : -1));
    document.getElementById("sList").innerHTML = rows.length
      ? rows.map((r) => cardHtml(r, `href="#" data-open="${esc(r.id)}"`)).join("")
      : `<p class="muted">해당 요청이 없습니다.</p>`;
  };
  const listUnsub = onSnapshot(query(reqCol, orderBy("createdAt", "desc")), (snap) => {
    all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    draw();
  }, () => toast("목록을 불러오지 못했습니다."));
  unsubs.push(listUnsub);
  const open = (id) => {
    unsubs.filter((u) => u !== listUnsub).forEach((u) => u());
    unsubs = [listUnsub];
    renderDetail(id, { inStaff: true });
    document.getElementById("detail").scrollIntoView({ behavior: "smooth" });
  };
  $app.onclick = (e) => {
    const t = e.target.closest("[data-tab]");
    if (t && t.closest("#tabs, #kpis")) { tab = t.dataset.tab; draw(); return; }
    const d = e.target.closest("#sDates [data-date]");
    if (d) { selDate = d.dataset.date; document.querySelectorAll("#sDates .chip").forEach((c) => c.classList.toggle("on", c === d)); draw(); return; }
    const o = e.target.closest("[data-open]");
    if (o) { e.preventDefault(); open(o.dataset.open); }
  };
  document.getElementById("search").oninput = (e) => { search = e.target.value; draw(); };
  document.getElementById("logout").onclick = () => endSession("로그아웃했습니다.");
  if (isAdmin()) {
    document.getElementById("csv").onclick = () => {
      if (confirm("CSV에는 학생 이름·학번이 포함됩니다.\n메일 첨부·USB 이동을 피하고, 사용 후 파일을 삭제해 주세요.\n내려받을까요?")) exportCsv(all);
    };
    bindAdminPanel(() => all);
  }
}

// ---------- 관리자 전용 패널: 운영자 관리 · 공용 PC · 기록 파기 ----------
function adminPanelHtml() {
  return `
    <h2>관리자 설정</h2>
    <div class="panel">
      <h3>운영자 관리</h3>
      <div id="staffList" class="staff-list"><p class="muted">불러오는 중…</p></div>
      <form id="staffForm" class="row">
        <input name="email" type="email" required placeholder="구글 이메일" style="flex:2;min-width:180px">
        <input name="name" required maxlength="20" placeholder="이름" style="flex:1;min-width:90px">
        <select name="role" style="width:auto"><option value="manager">매니저(근로학생)</option><option value="admin">관리자</option></select>
        <button class="btn small primary">추가</button>
      </form>
      <p class="hint">근로 기간이 끝난 학생은 바로 삭제하세요.</p>
    </div>
    <div class="panel">
      <h3>이 기기 설정</h3>
      <label class="check"><input type="checkbox" id="sharedToggle" ${isSharedDevice() ? "checked" : ""}>
        <span>이 기기를 <b>공용 PC</b>로 사용 (학생 기록을 기기에 남기지 않고, ${SHARED_IDLE_MINUTES}분 미사용 시 자동 초기화)</span></label>
    </div>
    <div class="panel">
      <h3>보유 기간 경과 기록 파기</h3>
      <p>예약일로부터 ${RETENTION_MONTHS}개월이 지난 기록: <b id="purgeCount">0</b>건</p>
      <p class="hint">이름·학번·파일 링크·사진·메모를 삭제하고, 통계용 항목(날짜·학과·자격증·목적·장비)만 남깁니다. 실적 보고에 필요한 CSV를 먼저 받아 두세요.</p>
      <button class="btn danger" id="purgeAll">일괄 파기</button>
    </div>`;
}
function expiredRecords(all) {
  const cut = new Date();
  cut.setMonth(cut.getMonth() - RETENTION_MONTHS);
  const cutStr = ymd(cut);
  return all.filter((r) => !r.anonymized && r.date < cutStr);
}
function bindAdminPanel(getAll) {
  unsubs.push(onSnapshot(staffCol, (snap) => {
    const el = document.getElementById("staffList");
    if (!el) return;
    el.innerHTML = snap.docs.map((d) => {
      const s = d.data();
      return `<div class="staff-row"><span class="role r-${s.role}">${ROLE_LABEL[s.role]}</span> <b>${esc(s.name)}</b>
        <span class="muted">${esc(d.id)}</span>
        ${d.id === me.email ? `<span class="muted">(나)</span>` : `<button class="btn small danger" data-del-staff="${esc(d.id)}">삭제</button>`}</div>`;
    }).join("") || `<p class="muted">등록된 운영자가 없습니다.</p>`;
    el.querySelectorAll("[data-del-staff]").forEach((b) => {
      b.onclick = async () => {
        if (!confirm(`${b.dataset.delStaff} 운영자를 삭제할까요?`)) return;
        await deleteDoc(doc(staffCol, b.dataset.delStaff)).catch(() => toast("삭제하지 못했습니다."));
      };
    });
  }, () => {}));
  document.getElementById("staffForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const email = String(f.get("email")).trim().toLowerCase();
    try {
      await setDoc(doc(staffCol, email), { name: String(f.get("name")).trim(), role: String(f.get("role")), addedAt: Date.now(), addedBy: me.email });
      e.target.reset();
      toast("추가했습니다.");
    } catch { toast("추가하지 못했습니다."); }
  };
  document.getElementById("sharedToggle").onchange = (e) => {
    lsSet("print-shared-device", e.target.checked);
    if (e.target.checked) lsSet(MY_KEY, []);
    toast(e.target.checked ? "이 기기를 공용 PC로 설정했습니다." : "공용 PC 설정을 해제했습니다.");
  };
  document.getElementById("purgeAll").onclick = async () => {
    const list = expiredRecords(getAll());
    if (!list.length) return toast("파기할 기록이 없습니다.");
    if (!confirm(`${list.length}건의 개인정보를 영구 삭제합니다. 되돌릴 수 없습니다. 진행할까요?`)) return;
    let n = 0;
    for (const r of list) { try { await purgeRequest(r); n++; } catch (err) { console.error(err); } }
    toast(`${n}건 파기했습니다.`);
  };
}

function statsHtml(rows) {
  const valid = rows.filter((r) => !["rejected", "canceled"].includes(r.status));
  const month = ymd(new Date()).slice(0, 7);
  const thisMonth = valid.filter((r) => r.date.startsWith(month)).length;
  const hours = valid.filter((r) => STATUS[r.status].step >= 3).reduce((a, r) => a + r.slots.length, 0);
  const finished = rows.filter((r) => STATUS[r.status].step >= 3).length;
  const used = rows.filter((r) => r.status === "used").length;
  const named = valid.filter((r) => r.studentNo);
  const people = new Set(named.map((r) => r.studentNo)).size;
  const certPeople = new Set(named.filter((r) => r.cert === "소지").map((r) => r.studentNo)).size;
  const groupBy = (key) => {
    const m = {};
    valid.forEach((r) => { m[r[key] || "-"] = (m[r[key] || "-"] || 0) + 1; });
    const max = Math.max(1, ...Object.values(m));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([k, n]) => `<div class="bar"><span>${esc(key === "printerId" ? printerName(k) : k)}</span><i style="width:${(n / max) * 100}%"></i><b>${n}</b></div>`).join("");
  };
  return `
    <div class="stat-tiles">
      <div><b>${valid.length}</b>누적 요청</div>
      <div><b>${thisMonth}</b>이번 달 예약</div>
      <div><b>${people}</b>이용 학생 수</div>
      <div><b>${hours}</b>장비 사용 시간</div>
      <div><b>${finished ? Math.round((used / finished) * 100) : 0}%</b>활용 사진 등록률</div>
      <div><b>${people ? Math.round((certPeople / people) * 100) : 0}%</b>자격증 소지 학생</div>
    </div>
    <div class="stat-cols">
      <div><h3>목적별</h3>${groupBy("purpose")}</div>
      <div><h3>학과별</h3>${groupBy("dept")}</div>
      <div><h3>장비별</h3>${groupBy("printerId")}</div>
      <div><h3>자격증</h3>${groupBy("cert")}</div>
    </div>`;
}

function exportCsv(rows) {
  const at = (r, s) => fmtTime((r.history || []).find((h) => h.status === s)?.at);
  const head = ["접수번호", "상태", "신청일시", "예약일", "시간", "장비", "이름", "학번", "학과", "자격증", "출력물", "목적",
    "재료", "색상", "수량", "크기", "요청사항", "확정", "출력시작", "출력완료", "수령", "활용등록",
    "완료사진수", "활용사진수", "활용내용", "반려사유", "처리이력", "파기여부"];
  const lines = rows.map((r) => [r.id, STATUS[r.status]?.label, fmtTime(r.createdAt), r.date, slotRange(r.slots), printerName(r.printerId),
    r.name, r.studentNo, r.dept, r.cert, r.title, r.purpose, r.material, r.color, r.qty, r.size, r.note,
    at(r, "approved"), at(r, "printing"), at(r, "done"), at(r, "received"), at(r, "used"),
    r.donePhotoCount || 0, r.usagePhotoCount || 0, r.usageNote, r.rejectReason,
    (r.history || []).map((h) => `${fmtTime(h.at)} ${STATUS[h.status]?.label} (${actorLabel(h.by)})`).join(" / "),
    r.anonymized ? "파기" : ""]);
  // 엑셀 수식 주입 방지: =,+,-,@ 로 시작하는 값 앞에 ' 추가
  const cell = (c) => { let s = String(c ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const csv = [head, ...lines].map((l) => l.map(cell).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = `3D프린터_출력기록_${ymd(new Date())}.csv`;
  a.click();
}

// ---------- 시작: 로그인 상태 확인 ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    me.uid = null; me.role = "student"; me.email = ""; me.name = "";
    try { await signInAnonymously(auth); } catch (e) {
      console.error(e);
      $app.innerHTML = `<p class="err" style="padding:24px">서버에 연결하지 못했습니다. 네트워크를 확인하거나 관리자에게 문의하세요.</p>`;
    }
    return;
  }
  me.uid = user.uid;
  lastActive = Date.now();
  if (user.isAnonymous) {
    me.role = "student"; me.email = ""; me.name = "";
  } else {
    me.email = String(user.email || "").toLowerCase();
    const s = await getDoc(doc(staffCol, me.email)).catch(() => null);
    if (s && s.exists()) {
      me.role = s.data().role === "admin" ? "admin" : "manager";
      me.name = s.data().name || user.displayName || me.email;
    } else {
      me.role = "unregistered";
      me.name = "";
    }
  }
  route();
});
