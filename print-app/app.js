import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy,
  onSnapshot, writeBatch, updateDoc, addDoc, deleteDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  firebaseConfig, MANAGER_PIN, ADMIN_PIN, KAKAO_JS_KEY, KAKAO_CHANNEL_URL, CENTER_NAME, PRINTERS, SLOTS,
  MAX_SLOTS_PER_REQUEST, BOOKING_DAYS_AHEAD, CLOSED_WEEKDAYS, CLOSED_DATES, MATERIALS, MAX_PHOTOS
} from "./config.js";

// ---------- Firebase ----------
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const reqCol = collection(db, "printRequests");
const slotCol = collection(db, "printSlots");
const photoCol = collection(db, "printPhotos");

// ---------- 상태 정의 ----------
const STATUS = {
  requested: { label: "접수", desc: "근로학생 확인 대기", step: 0 },
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

// ---------- 유틸 ----------
const $app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WD = ["일", "월", "화", "수", "목", "금", "토"];
function dateLabel(s) {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${m}/${d}(${WD[dt.getDay()]})`;
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
const CERT_OPTIONS = ["소지", "미소지", "취득 준비 중"];
function certBadge(c) {
  if (!c) return `<span class="cert c-none">미입력</span>`;
  return `<span class="cert ${c === "소지" ? "c-yes" : c === "취득 준비 중" ? "c-prep" : "c-no"}">${esc(c)}</span>`;
}
function newId() {
  const d = new Date();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 4; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `P${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${r}`;
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
  setTimeout(() => el.remove(), 2600);
}
const requestUrl = (id) => `${location.origin}${location.pathname}#/r/${id}`;

// 내 요청 (이 기기에 저장)
const MY_KEY = "print-my-requests";
function myRequests() {
  try { return JSON.parse(localStorage.getItem(MY_KEY)) || []; } catch { return []; }
}
function rememberRequest(id, pin) {
  try {
    const list = myRequests().filter((r) => r.id !== id);
    list.unshift({ id, pin });
    localStorage.setItem(MY_KEY, JSON.stringify(list.slice(0, 20)));
  } catch { /* 저장 불가 환경 무시 */ }
}
const isMine = (id) => myRequests().some((r) => r.id === id);
// 역할: student(기본) / manager(근로학생) / admin(담당자)
const ROLE_LABEL = { manager: "매니저", admin: "관리자", student: "학생" };
function getRole() { try { return sessionStorage.getItem("print-role") || "student"; } catch { return "student"; } }
function staffName() { try { return sessionStorage.getItem("print-staff-name") || ""; } catch { return ""; } }
const isStaff = () => ["manager", "admin"].includes(getRole());
const isAdmin = () => getRole() === "admin";
const actor = () => (isStaff() ? `${getRole()}:${staffName()}` : "student");
function actorLabel(by) {
  if (!by || by === "student") return "학생";
  const [role, name] = by.split(":");
  return `${ROLE_LABEL[role] || role}${name ? " " + name : ""}`;
}

// ---------- 사진 압축 (Storage 없이 Firestore 문서에 저장) ----------
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
        out = c.toDataURL("image/jpeg", q);
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
    await addDoc(photoCol, { requestId, kind, data, createdAt: Date.now() });
  }
}
async function loadPhotos(requestId) {
  const snap = await getDocs(query(photoCol, where("requestId", "==", requestId)));
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
  try { await navigator.clipboard.writeText(text); toast("복사했습니다. 카카오톡에 붙여넣으세요."); }
  catch { prompt("아래 내용을 복사하세요", text); }
}
async function shareKakao(text, url) {
  if (await loadKakao()) {
    window.Kakao.Share.sendDefault({
      objectType: "text",
      text,
      link: { mobileWebUrl: url, webUrl: url },
      buttonTitle: "진행 현황 보기"
    });
    return;
  }
  if (navigator.share) {
    try { await navigator.share({ title: "3D프린터 출력 요청", text, url }); return; } catch { /* 사용자가 닫음 */ }
  }
  copyText(`${text}\n${url}`);
}
function staffNoticeText(r) {
  const head = `[${CENTER_NAME} 3D프린터] ${r.name}님,`;
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
  if (page === "staff") return isStaff() ? renderStaff() : renderPin();
  return renderHome();
}
window.addEventListener("hashchange", route);

function shell(inner, { back = true } = {}) {
  $app.innerHTML = `
    <header class="top">
      ${back ? `<a class="back" href="#/">‹ 처음으로</a>` : `<span></span>`}
      <span class="brand">${esc(CENTER_NAME)} · 3D프린터</span>
    </header>
    <main>${inner}</main>`;
}

// ---------- 홈 ----------
function renderHome() {
  const mine = myRequests();
  shell(`
    <h1>3D프린터 출력 요청</h1>
    <p class="sub">예약 → 요청서 → 출력 → 수령 → 활용 사진까지 한 곳에서 기록합니다.</p>
    <ol class="flow">
      ${["예약·요청서", "근로학생 확인", "출력", "완료 사진", "수령", "활용 사진"].map((t, i) => `<li><b>${i + 1}</b>${t}</li>`).join("")}
    </ol>
    <div class="menu">
      <a class="btn primary big" href="#/new">＋ 출력 예약하기</a>
      <a class="btn big" href="#/board">진행 현황판 보기</a>
      <a class="btn big" href="#/find">내 요청 조회</a>
    </div>
    ${mine.length ? `<h2>이 기기에서 접수한 요청</h2><div id="mine" class="list"><p class="muted">불러오는 중…</p></div>` : ""}
    ${KAKAO_CHANNEL_URL ? `<a class="btn kakao" href="${esc(KAKAO_CHANNEL_URL)}" target="_blank" rel="noopener">카카오톡 채널로 문의하기</a>` : ""}
    <p class="foot"><a href="#/staff">운영자(매니저·관리자) 로그인</a></p>
  `, { back: false });
  if (mine.length) {
    Promise.all(mine.map((m) => getDoc(doc(reqCol, m.id)))).then((snaps) => {
      const el = document.getElementById("mine");
      if (!el) return;
      const rows = snaps.filter((s) => s.exists()).map((s) => ({ id: s.id, ...s.data() }));
      el.innerHTML = rows.length ? rows.map(cardHtml).join("") : `<p class="muted">기록이 없습니다.</p>`;
    }).catch(() => {});
  }
}

function badge(status) {
  return `<span class="badge s-${status}">${STATUS[status]?.label || status}</span>`;
}
function cardHtml(r) {
  return `
    <a class="card" href="#/r/${esc(r.id)}">
      <div class="card-top">${badge(r.status)}<span class="mono">${esc(r.id)}</span></div>
      <div class="card-title">${esc(r.title)}</div>
      <div class="card-meta">${esc(r.dept || "")} ${esc(r.name)} · 자격증 ${esc(r.cert || "-")} · ${dateLabel(r.date)} ${slotRange(r.slots)} · ${esc(printerName(r.printerId))}</div>
    </a>`;
}

// ---------- 새 예약 ----------
const draft = { date: null, printerId: PRINTERS[0].id, slots: [] };
let takenSlots = new Set();

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
        <label>이름 *<input name="name" required maxlength="20"></label>
        <label>학번 *<input name="studentNo" required maxlength="20" inputmode="numeric"></label>
        <label>학과/소속 *<input name="dept" required maxlength="40"></label>
        <label>연락처 *<input name="phone" required maxlength="20" inputmode="tel" placeholder="010-0000-0000"></label>
      </div>
      <label>3D프린터운용기능사 자격증 *
        <select name="cert" required>
          <option value="">선택</option>
          ${CERT_OPTIONS.map((c) => `<option>${c}</option>`).join("")}
        </select>
      </label>
      <label>출력물 이름 *<input name="title" required maxlength="60" placeholder="예) 캡스톤 시제품 케이스"></label>
      <label>사용 목적 *
        <select name="purpose" required>
          <option value="">선택</option>
          <option>수업 과제</option><option>캡스톤/졸업작품</option><option>공모전·경진대회</option>
          <option>동아리·비교과</option><option>창업·시제품</option><option>개인 학습</option><option>기타</option>
        </select>
      </label>
      <label>출력 파일 링크 * <small>(구글드라이브·원드라이브 등 공유 링크, STL/OBJ/3MF)</small>
        <input name="fileLink" required type="url" placeholder="https://"></label>
      <div class="grid3">
        <label>재료
          <select name="material">${MATERIALS.map((m) => `<option>${esc(m)}</option>`).join("")}</select>
        </label>
        <label>색상<input name="color" maxlength="20" placeholder="흰색"></label>
        <label>수량<input name="qty" type="number" min="1" max="50" value="1"></label>
      </div>
      <label>크기(가로×세로×높이 mm)<input name="size" maxlength="40" placeholder="예) 80×60×40"></label>
      <label>요청 사항<textarea name="note" rows="3" maxlength="500" placeholder="서포트, 채움 비율, 마감 기한 등"></textarea></label>

      <h2><b class="num">3</b> 조회 비밀번호</h2>
      <label>숫자 4자리 * <small>(진행 확인·수령 확인·활용 사진 등록에 필요)</small>
        <input name="pin" required pattern="\\d{4}" maxlength="4" inputmode="numeric" placeholder="0000"></label>
      <label class="check"><input type="checkbox" name="agree" required> 출력물 기록(요청서·사진)이 센터 운영 실적 자료로 활용되는 것에 동의합니다.</label>

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
    // 양 끝에서만 해제 가능(연속 유지)
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
    return `<button type="button" class="slot ${on ? "on" : ""} ${taken ? "taken" : ""}" data-slot="${s}" ${taken || past ? "disabled" : ""}>
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

async function submitRequest(e) {
  e.preventDefault();
  if (!draft.slots.length) return toast("예약 시간을 선택해 주세요.");
  const f = new FormData(e.target);
  const v = (k) => String(f.get(k) || "").trim();
  if (!/^\d{4}$/.test(v("pin"))) return toast("비밀번호는 숫자 4자리입니다.");
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "신청 중…";
  const id = newId();
  const now = Date.now();
  const data = {
    id, status: "requested", createdAt: now, updatedAt: now,
    name: v("name"), studentNo: v("studentNo"), cert: v("cert"), dept: v("dept"), phone: v("phone"),
    title: v("title"), purpose: v("purpose"), fileLink: v("fileLink"),
    material: v("material"), color: v("color"), qty: Number(v("qty")) || 1, size: v("size"), note: v("note"),
    pin: v("pin"), date: draft.date, printerId: draft.printerId, slots: [...draft.slots],
    history: [{ status: "requested", at: now, by: "student", memo: "" }],
    donePhotoCount: 0, usagePhotoCount: 0
  };
  try {
    const batch = writeBatch(db);
    batch.set(doc(reqCol, id), data);
    draft.slots.forEach((s) => batch.set(doc(slotCol, `${draft.date}_${draft.printerId}_${s}`),
      { requestId: id, date: draft.date, printerId: draft.printerId, slot: s, createdAt: now }));
    await batch.commit();
    rememberRequest(id, data.pin);
    renderSubmitted(data);
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
      <p>근로학생이 확인하면 <b>예약 확정</b>으로 바뀝니다.</p>
      <div class="ticket">
        <div><span>접수번호</span><b class="mono">${esc(r.id)}</b></div>
        <div><span>예약</span><b>${dateLabel(r.date)} ${slotRange(r.slots)}</b></div>
        <div><span>장비</span><b>${esc(printerName(r.printerId))}</b></div>
      </div>
      <p class="hint">접수번호와 비밀번호 4자리로 언제든 진행 상황을 확인할 수 있습니다.</p>
      <button class="btn kakao big" id="shareBtn">카카오톡으로 나에게 보내기</button>
      <a class="btn big" href="#/r/${esc(r.id)}">진행 현황 보기</a>
    </div>`);
  document.getElementById("shareBtn").onclick = () =>
    shareKakao(`[${CENTER_NAME} 3D프린터 예약]\n접수번호: ${r.id}\n${dateLabel(r.date)} ${slotRange(r.slots)} / ${printerName(r.printerId)}\n출력물: ${r.title}`, requestUrl(r.id));
}

// ---------- 진행 현황판 (공개, 이름 마스킹) ----------
function renderBoard() {
  const dates = bookableDates();
  let sel = dates[0];
  shell(`
    <h1>진행 현황판</h1>
    <p class="sub">예약표와 진행 중인 출력물을 실시간으로 보여줍니다. (이름은 일부 가림)</p>
    <div class="chips" id="bDates">${dates.map((d) => `<button class="chip ${d === sel ? "on" : ""}" data-date="${d}">${dateLabel(d)}</button>`).join("")}</div>
    <div id="timetable" class="tt-wrap"><p class="muted">불러오는 중…</p></div>
    <h2>진행 중인 요청</h2>
    <div id="active" class="board"></div>
    <h2>이용 기록</h2>
    <p class="hint">개인정보 보호를 위해 이름·학번 일부는 가려서 표시합니다.</p>
    <div class="tt-wrap"><table class="log"><thead><tr><th>일자</th><th>학과</th><th>학번</th><th>이름</th><th>자격증</th><th>출력물</th><th>상태</th></tr></thead>
      <tbody id="logBody"><tr><td colspan="7" class="muted">불러오는 중…</td></tr></tbody></table></div>
  `);
  let reqs = [];
  const draw = () => {
    const tt = document.getElementById("timetable");
    if (tt) tt.innerHTML = timetableHtml(sel, reqs, false);
    const ac = document.getElementById("active");
    if (!ac) return;
    const groups = ACTIVE.map((s) => {
      const rows = reqs.filter((r) => r.status === s).sort((a, b) => (a.date + a.slots[0]).localeCompare(b.date + b.slots[0]));
      return `<div class="col"><h3>${badge(s)} <span>${rows.length}</span></h3>
        ${rows.map((r) => `<div class="mini"><b>${esc(maskName(r.name))}</b> ${esc(r.title)}<small>${dateLabel(r.date)} ${slotRange(r.slots)} · ${esc(printerName(r.printerId))}</small></div>`).join("") || `<p class="muted">없음</p>`}
      </div>`;
    });
    ac.innerHTML = groups.join("");
    const lb = document.getElementById("logBody");
    if (lb) {
      const rows = [...reqs, ...logs].sort((a, b) => (b.date + b.slots[0]).localeCompare(a.date + a.slots[0])).slice(0, 60);
      lb.innerHTML = rows.length ? rows.map((r) => `<tr><td>${dateLabel(r.date)}</td><td>${esc(r.dept)}</td><td class="mono">${esc(maskNo(r.studentNo))}</td>
        <td>${esc(maskName(r.name))}</td><td>${certBadge(r.cert)}</td><td>${esc(r.title)}</td><td>${badge(r.status)}</td></tr>`).join("")
        : `<tr><td colspan="7" class="muted">기록이 없습니다.</td></tr>`;
    }
  };
  let logs = [];
  unsubs.push(onSnapshot(query(reqCol, where("status", "in", ["received", "used"])), (snap) => {
    logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    draw();
  }, () => {}));
  document.getElementById("bDates").onclick = (e) => {
    const b = e.target.closest("[data-date]");
    if (!b) return;
    sel = b.dataset.date;
    document.querySelectorAll("#bDates .chip").forEach((c) => c.classList.toggle("on", c === b));
    draw();
  };
  unsubs.push(onSnapshot(query(reqCol, where("status", "in", ACTIVE)), (snap) => {
    reqs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    draw();
  }, () => {
    const tt = document.getElementById("timetable");
    if (tt) tt.innerHTML = `<p class="err">불러오지 못했습니다.</p>`;
  }));
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
      const label = c.first ? `${esc(staff ? c.r.name : maskName(c.r.name))}<small>${esc(c.r.title)}</small>` : "↓";
      return staff
        ? `<td class="busy s-${c.r.status}"><a href="#" data-open="${esc(c.r.id)}">${label}</a></td>`
        : `<td class="busy s-${c.r.status}">${label}</td>`;
    }).join("")}</tr>`).join("")}
  </tbody></table>`;
}

// ---------- 내 요청 조회 ----------
function renderFind() {
  shell(`
    <h1>내 요청 조회</h1>
    <form class="panel" id="findForm">
      <label>접수번호<input name="id" required placeholder="P261126-ABCD" autocapitalize="characters"></label>
      <label>비밀번호 4자리<input name="pin" required maxlength="4" inputmode="numeric"></label>
      <button class="btn primary big">조회</button>
    </form>`);
  document.getElementById("findForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const id = String(f.get("id")).trim().toUpperCase();
    const pin = String(f.get("pin")).trim();
    try {
      const snap = await getDoc(doc(reqCol, id));
      if (!snap.exists() || snap.data().pin !== pin) return toast("접수번호 또는 비밀번호가 맞지 않습니다.");
      rememberRequest(id, pin);
      location.hash = `#/r/${id}`;
    } catch { toast("조회 중 오류가 발생했습니다."); }
  };
}

// ---------- 요청 상세 (학생/근로학생 공용) ----------
function renderDetail(id, { inStaff = false } = {}) {
  const staff = inStaff || isStaff();
  const owner = isMine(id);
  const target = inStaff ? document.getElementById("detail") : null;
  const render = (html) => {
    if (target) target.innerHTML = html;
    else shell(html);
  };
  if (!staff && !owner) {
    render(`<h1>요청 확인</h1>
      <form class="panel" id="unlock"><p>이 요청의 비밀번호 4자리를 입력하세요.</p>
      <label>비밀번호<input name="pin" required maxlength="4" inputmode="numeric"></label>
      <button class="btn primary big">확인</button></form>`);
    document.getElementById("unlock").onsubmit = async (e) => {
      e.preventDefault();
      const pin = String(new FormData(e.target).get("pin")).trim();
      const snap = await getDoc(doc(reqCol, id)).catch(() => null);
      if (!snap || !snap.exists() || snap.data().pin !== pin) return toast("비밀번호가 맞지 않습니다.");
      rememberRequest(id, pin);
      renderDetail(id);
    };
    return;
  }
  render(`<p class="muted">불러오는 중…</p>`);
  let photos = null;
  const unsub = onSnapshot(doc(reqCol, id), async (snap) => {
    if (!snap.exists()) return render(`<h1>존재하지 않는 요청입니다.</h1>`);
    const r = { id: snap.id, ...snap.data() };
    const need = (r.donePhotoCount || 0) + (r.usagePhotoCount || 0);
    if (!photos || photos.length !== need) photos = await loadPhotos(id).catch(() => []);
    render(detailHtml(r, photos, staff));
    bindDetail(r);
  }, () => render(`<p class="err">불러오지 못했습니다.</p>`));
  unsubs.push(unsub);
}

function timelineHtml(r, staff) {
  if (["rejected", "canceled"].includes(r.status)) {
    return `<div class="stopped">${badge(r.status)} ${r.status === "rejected" ? `사유: ${esc(r.rejectReason || "-")}` : "학생이 예약을 취소했습니다."}</div>`;
  }
  const cur = STATUS[r.status].step;
  const at = {};
  const who = {};
  (r.history || []).forEach((h) => { at[h.status] = h.at; who[h.status] = h.by; });
  return `<ol class="timeline">${FLOW.map((s, i) => `
    <li class="${i < cur ? "past" : i === cur ? "now" : ""}">
      <span class="dot"></span><b>${STATUS[s].label}</b><small>${at[s] ? fmtTime(at[s]) + (staff ? ` · ${esc(actorLabel(who[s]))}` : "") : i === cur ? STATUS[s].desc : ""}</small>
    </li>`).join("")}</ol>`;
}

function photoGrid(list) {
  return list.length ? `<div class="photos">${list.map((p) => `<img src="${p.data}" alt="" loading="lazy">`).join("")}</div>` : "";
}

function uploader(kind, label, withNote) {
  return `<form class="panel upl" data-kind="${kind}">
    <h3>${label}</h3>
    <input type="file" name="files" accept="image/*" multiple required>
    <div class="prev"></div>
    ${withNote ? `<label>어떻게 활용했나요? *<textarea name="note" rows="3" maxlength="500" required placeholder="예) 캡스톤 발표회에서 시제품으로 시연했습니다."></textarea></label>` : ""}
    <button class="btn primary big">등록</button>
  </form>`;
}

function detailHtml(r, photos, staff) {
  const done = photos.filter((p) => p.kind === "done");
  const usage = photos.filter((p) => p.kind === "usage");
  const s = r.status;
  let actions = "";
  if (staff) {
    if (s === "requested") actions = `<button class="btn primary" data-act="approve">예약 확정</button><button class="btn danger" data-act="reject">반려</button>`;
    if (s === "approved") actions = `<button class="btn primary" data-act="printing">출력 시작</button><button class="btn danger" data-act="reject">반려</button>`;
    if (s === "printing") actions = uploader("done", "출력 완료 사진 등록 → 출력 완료 처리", false);
    if (s === "done") actions = `<button class="btn primary" data-act="receive">수령 처리(대리 확인)</button>`;
    if (s === "received") actions = uploader("usage", "활용 사진 대리 등록", true);
    actions += `<div class="row"><button class="btn kakao" data-act="notice">카톡 안내 문구 복사</button>
      ${r.phone ? `<a class="btn" href="sms:${esc(r.phone.replace(/[^\d]/g, ""))}?body=${encodeURIComponent(staffNoticeText(r) + "\n" + requestUrl(r.id))}">문자 보내기</a>` : ""}</div>
      ${isAdmin() ? adminTools(r) : ""}
      <label class="memo">운영 메모<textarea id="memo" rows="2">${esc(r.adminMemo || "")}</textarea></label>
      <button class="btn small" data-act="memo">메모 저장</button>`;
  } else {
    if (s === "requested" || s === "approved") actions = `<button class="btn danger" data-act="cancel">예약 취소</button>`;
    if (s === "done") actions = `<button class="btn primary big" data-act="receive">출력물 받았어요 (수령 확인)</button>`;
    if (s === "received") actions = uploader("usage", "활용 사진 등록 (최대 " + MAX_PHOTOS + "장)", true);
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
        <dt>신청자</dt><dd>${esc(r.name)} (${esc(r.dept)} ${esc(staff ? r.studentNo : "")})</dd>
        <dt>자격증</dt><dd>${certBadge(r.cert)}</dd>
        ${staff ? `<dt>연락처</dt><dd>${esc(r.phone)}</dd>` : ""}
        <dt>목적</dt><dd>${esc(r.purpose)}</dd>
        <dt>파일</dt><dd><a href="${esc(r.fileLink)}" target="_blank" rel="noopener">파일 열기 ↗</a></dd>
        <dt>사양</dt><dd>${esc(r.material)} · ${esc(r.color || "색상 무관")} · ${r.qty}개 ${r.size ? "· " + esc(r.size) : ""}</dd>
        ${r.note ? `<dt>요청사항</dt><dd>${esc(r.note)}</dd>` : ""}
        ${r.printHours ? `<dt>예상 출력</dt><dd>${esc(r.printHours)}시간</dd>` : ""}
      </dl>
      ${done.length ? `<h2>출력 완료 사진</h2>${photoGrid(done)}` : ""}
      ${usage.length ? `<h2>활용 사진</h2>${photoGrid(usage)}${r.usageNote ? `<p class="quote">${esc(r.usageNote)}</p>` : ""}` : ""}
      <div class="actions">${actions}</div>
    </div>`;
}

function adminTools(r) {
  const canFix = !["rejected", "canceled"].includes(r.status);
  return `<div class="admin-box">
    <h3>관리자 도구</h3>
    ${canFix ? `<div class="row"><select id="fixTo">${FLOW.map((s) => `<option value="${s}" ${s === r.status ? "selected" : ""}>${STATUS[s].label}</option>`).join("")}</select>
      <button class="btn small" data-act="fix">상태 정정</button></div>` : ""}
    <details><summary>처리 이력 ${(r.history || []).length}건</summary>
      <ul class="hist">${(r.history || []).map((h) => `<li>${fmtTime(h.at)} · ${STATUS[h.status]?.label || h.status} · ${esc(actorLabel(h.by))}${h.memo ? ` — ${esc(h.memo)}` : ""}</li>`).join("")}</ul>
    </details>
  </div>`;
}

async function setStatus(r, status, by, extra = {}, memo = "") {
  const now = Date.now();
  await updateDoc(doc(reqCol, r.id), {
    status, updatedAt: now, ...extra,
    history: arrayUnion({ status, at: now, by, memo })
  });
}
async function releaseSlots(r) {
  for (const s of r.slots) {
    await deleteDoc(doc(slotCol, `${r.date}_${r.printerId}_${s}`)).catch(() => {});
  }
}

function bindDetail(r) {
  const by = actor();
  document.querySelectorAll("[data-act]").forEach((b) => {
    b.onclick = async (e) => {
      e.preventDefault();
      const act = b.dataset.act;
      try {
        if (act === "approve") await setStatus(r, "approved", by);
        if (act === "printing") {
          const h = prompt("예상 출력 시간(시간 단위, 비워도 됨)", "");
          if (h === null) return;
          await setStatus(r, "printing", by, { printHours: h.trim() });
        }
        if (act === "reject") {
          const reason = prompt("반려 사유를 입력하세요 (학생에게 표시됩니다)");
          if (!reason) return;
          await setStatus(r, "rejected", by, { rejectReason: reason }, reason);
          await releaseSlots(r);
        }
        if (act === "cancel") {
          if (!confirm("예약을 취소할까요? 예약 시간이 다른 학생에게 열립니다.")) return;
          await setStatus(r, "canceled", by);
          await releaseSlots(r);
        }
        if (act === "receive") await setStatus(r, "received", by, { receivedAt: Date.now() });
        if (act === "fix") {
          const to = document.getElementById("fixTo").value;
          if (to === r.status) return;
          const why = prompt(`'${STATUS[to].label}'(으)로 정정합니다. 정정 사유를 입력하세요.`);
          if (!why) return;
          await setStatus(r, to, by, {}, `정정: ${why}`);
        }
        if (act === "memo") { await updateDoc(doc(reqCol, r.id), { adminMemo: document.getElementById("memo").value, updatedAt: Date.now() }); toast("저장했습니다."); }
        if (act === "notice") copyText(`${staffNoticeText(r)}\n${requestUrl(r.id)}`);
        if (act === "share") shareKakao(`[${CENTER_NAME} 3D프린터]\n'${r.title}' 현재 상태: ${STATUS[r.status].label}\n접수번호: ${r.id}`, requestUrl(r.id));
      } catch (err) {
        console.error(err);
        toast("처리하지 못했습니다. 네트워크를 확인해 주세요.");
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
          await setStatus(r, "done", by, { donePhotoCount: (r.donePhotoCount || 0) + files.length, doneAt: Date.now() });
        } else {
          const note = String(new FormData(form).get("note") || "").trim();
          await setStatus(r, "used", by, { usagePhotoCount: (r.usagePhotoCount || 0) + files.length, usageNote: note, usedAt: Date.now() });
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

// ---------- 근로학생·관리자 ----------
function renderPin() {
  shell(`
    <h1>운영자 로그인</h1>
    <p class="sub">PIN에 따라 <b>매니저(근로학생)</b> 또는 <b>관리자(담당자)</b> 화면으로 들어갑니다.</p>
    <form class="panel" id="pinForm">
      <label>이름 * <small>(처리 기록에 남습니다)</small><input name="name" required maxlength="20"></label>
      <label>PIN<input name="pin" type="password" inputmode="numeric" maxlength="8" required></label>
      <button class="btn primary big">들어가기</button>
    </form>`);
  document.getElementById("pinForm").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const pin = String(f.get("pin"));
    const role = pin === ADMIN_PIN ? "admin" : pin === MANAGER_PIN ? "manager" : null;
    if (!role) return toast("PIN이 맞지 않습니다.");
    try {
      sessionStorage.setItem("print-role", role);
      sessionStorage.setItem("print-staff-name", String(f.get("name")).trim());
    } catch { /* 무시 */ }
    renderStaff();
  };
}

function renderStaff() {
  const dates = bookableDates();
  const today = ymd(new Date());
  let selDate = dates.includes(today) ? today : dates[0];
  let tab = "requested";
  let all = [];
  let search = "";
  shell(`
    <div class="staff-head">
      <h1>${isAdmin() ? "관리자" : "매니저"} 콘솔 <span class="role r-${getRole()}">${ROLE_LABEL[getRole()]} · ${esc(staffName())}</span></h1>
      <div class="row">
        ${isAdmin() ? `<button class="btn small" id="csv">CSV 내보내기</button>` : ""}
        <button class="btn small" id="logout">나가기</button>
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
  `);
  const draw = () => {
    const count = (s) => all.filter((r) => r.status === s).length;
    document.getElementById("kpis").innerHTML = [
      ["확인 대기", count("requested"), "requested"], ["출력 대기", count("approved"), "approved"],
      ["출력 중", count("printing"), "printing"], ["수령 대기", count("done"), "done"],
      ["활용 사진 대기", count("received"), "received"], ["누적 완료", count("used"), "used"]
    ].map(([l, n, s]) => `<button class="kpi s-${s}" data-tab="${s}"><b>${n}</b>${l}</button>`).join("");
    if (isAdmin()) document.getElementById("stats").innerHTML = statsHtml(all);
    document.getElementById("sTable").innerHTML = timetableHtml(selDate, all, true);
    document.getElementById("tabs").innerHTML = [...FLOW, "rejected", "canceled", "all"].map((s) =>
      `<button class="tab ${tab === s ? "on" : ""}" data-tab="${s}">${s === "all" ? "전체" : STATUS[s].label} ${s === "all" ? all.length : count(s)}</button>`).join("");
    const q = search.toLowerCase();
    const rows = all
      .filter((r) => tab === "all" || r.status === tab)
      .filter((r) => !q || [r.name, r.studentNo, r.id, r.title].join(" ").toLowerCase().includes(q))
      .sort((a, b) => (a.date + (a.slots[0] || "")).localeCompare(b.date + (b.slots[0] || "")) * (ACTIVE.includes(tab) ? 1 : -1));
    document.getElementById("sList").innerHTML = rows.length
      ? rows.map((r) => cardHtml(r).replace(`href="#/r/${esc(r.id)}"`, `href="#" data-open="${esc(r.id)}"`)).join("")
      : `<p class="muted">해당 요청이 없습니다.</p>`;
  };
  const open = (id) => {
    unsubs.slice(1).forEach((u) => u());
    unsubs = unsubs.slice(0, 1);
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
  document.getElementById("logout").onclick = () => { try { sessionStorage.removeItem("print-role"); sessionStorage.removeItem("print-staff-name"); } catch { /* 무시 */ } $app.onclick = null; location.hash = "#/"; };
  if (isAdmin()) document.getElementById("csv").onclick = () => exportCsv(all);
  unsubs.push(onSnapshot(query(reqCol, orderBy("createdAt", "desc")), (snap) => {
    all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    draw();
  }, () => toast("목록을 불러오지 못했습니다.")));
}

function statsHtml(rows) {
  const valid = rows.filter((r) => !["rejected", "canceled"].includes(r.status));
  const month = ymd(new Date()).slice(0, 7);
  const thisMonth = valid.filter((r) => r.date.startsWith(month)).length;
  const hours = valid.filter((r) => STATUS[r.status].step >= 3).reduce((a, r) => a + r.slots.length, 0);
  const finished = rows.filter((r) => STATUS[r.status].step >= 3).length;
  const used = rows.filter((r) => r.status === "used").length;
  const people = new Set(valid.map((r) => r.studentNo)).size;
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
      <div><b>${people ? Math.round((new Set(valid.filter((r) => r.cert === "소지").map((r) => r.studentNo)).size / people) * 100) : 0}%</b>자격증 소지 학생</div>
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
  const head = ["접수번호", "상태", "신청일시", "예약일", "시간", "장비", "이름", "학번", "학과", "자격증", "연락처", "출력물", "목적",
    "재료", "색상", "수량", "크기", "파일링크", "요청사항", "확정", "출력시작", "출력완료", "수령", "활용등록", "완료사진수", "활용사진수", "활용내용", "반려사유", "메모", "처리이력"];
  const lines = rows.map((r) => [r.id, STATUS[r.status]?.label, fmtTime(r.createdAt), r.date, slotRange(r.slots), printerName(r.printerId),
    r.name, r.studentNo, r.dept, r.cert, r.phone, r.title, r.purpose, r.material, r.color, r.qty, r.size, r.fileLink, r.note,
    at(r, "approved"), at(r, "printing"), at(r, "done"), at(r, "received"), at(r, "used"),
    r.donePhotoCount || 0, r.usagePhotoCount || 0, r.usageNote, r.rejectReason, r.adminMemo,
    (r.history || []).map((h) => `${fmtTime(h.at)} ${STATUS[h.status]?.label} (${actorLabel(h.by)})`).join(" / ")]);
  const csv = [head, ...lines].map((l) => l.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `3D프린터_출력기록_${ymd(new Date())}.csv`;
  a.click();
}

route();
