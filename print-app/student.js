// 학생 화면 (포스터 톤): 홈, 방문 예약, 내 현황판(본인 기록만), 다른 기기 조회, 수령·활용 사진·만족도
import * as C from "./config.js";
import {
  db, fb, col, settingsRef, me, STATUS, STUDENT_STEPS, CERTS, esc, dateLabel, fmtTime, bookableDates, slotPast,
  newId, pinKey, toast, lsGet, lsSet, isSharedDevice, uploadPhotos, loadPhotos, logout
} from "./common.js";

const $app = () => document.getElementById("app");
let unsubs = [];
export function clear() { unsubs.forEach((u) => u()); unsubs = []; }

// 이 기기에서 쓴 학번 (공용 PC에서는 저장 안 함)
const ssGet = () => { try { return sessionStorage.getItem("print-sn") || ""; } catch { return ""; } };
const mySn = () => ssGet() || (isSharedDevice() ? "" : lsGet("print-my-sn", ""));
const rememberSn = (sn) => {
  try { sessionStorage.setItem("print-sn", sn); } catch { /* 무시 */ }
  if (!isSharedDevice()) lsSet("print-my-sn", sn);
};

const LOGO = `<svg class="logo" viewBox="0 0 100 100" aria-hidden="true"><rect x="3" y="3" width="94" height="94" rx="26" fill="#8CC63F"/><path d="M14 14Q50 40 86 14Q60 50 86 86Q50 60 14 86Q40 50 14 14z" fill="#fff"/><circle cx="50" cy="22" r="6" fill="#8CC63F"/><text x="50" y="50" text-anchor="middle" font-size="15" font-weight="700" fill="#1F1F1F">新</text><text x="50" y="68" text-anchor="middle" font-size="15" font-weight="700" fill="#1F1F1F">丘</text></svg>`;

function shell(inner, back = true) {
  $app().innerHTML = `<div class="stu">
    <header class="s-top">
      ${back ? `<a class="s-back" href="#/">‹ 처음으로</a>` : `<span class="s-brand">${LOGO}${esc(C.CENTER_NAME)}</span>`}
      ${isSharedDevice() ? `<button class="s-btn small" id="endBtn">이용 종료</button>` : back ? "" : `<a class="s-staff" href="#/staff">운영자</a>`}
    </header>
    ${isSharedDevice() ? `<div class="s-note">공용 PC입니다. 다 쓰면 <b>이용 종료</b>를 눌러 주세요.</div>` : ""}
    <main>${inner}</main>
    <footer class="s-foot"><span><b>장소</b> ${esc(C.LOCATION)}</span><span><b>문의</b> ${esc(C.CONTACT)}</span></footer>
  </div>`;
  const e = document.getElementById("endBtn");
  if (e) e.onclick = () => logout("이용을 종료했습니다.");
}
const sec = (t) => `<div class="s-sec"><h2>${t}</h2><span></span></div>`;

// ---------- 홈 ----------
export function home() {
  shell(`
    <div class="bubble">신구대학교 · <b>메이커스페이스</b></div>
    <div class="hero">
      <div><span class="hero-sub">${esc(C.SPACE_NAME)}</span><span class="pop y">3D프린터</span><span class="pop g">출력 예약하기</span></div>
    </div>
    <dl class="facts">
      <div><dt>운영시간</dt><dd>평일 <b>09:00 – 18:00</b></dd></div>
      <div><dt>보유장비</dt><dd>메이커봇 <b>${C.PRINTERS.length}</b>대</dd></div>
      <div><dt>예약가능</dt><dd>오늘부터 <b>${C.BOOKING_DAYS_AHEAD}</b>일 이내</dd></div>
    </dl>
    <div class="s-white">
      <a class="s-btn primary big" href="#/new">＋ 출력 예약하기</a>
      <div class="s-grid2">
        <a class="s-tile" href="#/my"><b>내 현황판</b><span>내 예약·이용 기록만</span></a>
        <a class="s-tile" href="#/find"><b>다른 기기에서 조회</b><span>학번 + 비밀번호</span></a>
      </div>
      ${sec("이용 절차")}
      ${STUDENT_STEPS.map((t, i) => `<div class="s-step"><span>STEP ${i + 1}</span><b>${t}</b></div>`).join("")}
      <div class="s-must"><span>필수</span>출력물 수령 후 <b>활용 사진</b>과 <b>만족도 조사</b>를 꼭 등록해 주세요.</div>
      ${C.KAKAO_CHANNEL_URL ? `<a class="s-btn kakao big" href="${esc(C.KAKAO_CHANNEL_URL)}" target="_blank" rel="noopener">카카오톡 채널로 문의하기</a>` : ""}
    </div>`, false);
}

// ---------- 방문 예약 ----------
const draft = { date: null, time: null, files: 1, cert: "" };
export function booking() {
  const dates = bookableDates();
  if (!draft.date || !dates.includes(draft.date)) draft.date = dates[0];
  draft.time = null;
  let counts = {}, cap = C.DEFAULT_CAPACITY_PER_HOUR;
  shell(`
    <h1 class="s-h1 g">출력 예약 신청</h1>
    <p class="s-lead">방문할 날짜·시간과 파일 수를 예약하세요. <b>출력 요청서는 당일 센터에서</b> 작성합니다.</p>
    <form class="s-card" id="bf">
      <h2 class="num"><i>1</i>신청자 정보</h2>
      <label>학번 *<input name="sn" required inputmode="numeric" maxlength="20" value="${esc(mySn())}" autocomplete="off"></label>
      <label>이름 *<input name="name" required maxlength="20" autocomplete="off"></label>
      <fieldset><legend>3D프린터운용기능사 자격증 *</legend><div class="s-pills" id="certs">
        ${CERTS.map((c) => `<button type="button" class="pill ${draft.cert === c ? "on" : ""}" data-cert="${c}">${c}</button>`).join("")}</div></fieldset>

      <h2 class="num"><i>2</i>방문 날짜 · 시간</h2>
      <div class="s-dates" id="dates">${dates.map((d) => `<button type="button" class="dchip ${d === draft.date ? "on" : ""}" data-date="${d}">${dateLabel(d)}</button>`).join("")}</div>
      <div class="s-files"><span><b>출력할 파일 수</b><small>1인 최대 ${C.MAX_FILES_PER_BOOKING}개 · 파일 1개 = 1자리</small></span>
        <span class="stepper"><button type="button" id="fdec" aria-label="줄이기">−</button><b id="fval">${draft.files}</b><button type="button" id="finc" aria-label="늘리기">+</button></span></div>
      <div class="s-times" id="times"></div>
      <p class="hint">점 하나가 파일 1개입니다. 남은 자리가 파일 수보다 적으면 선택할 수 없습니다.</p>

      <h2 class="num"><i>3</i>조회 비밀번호</h2>
      <label>숫자 4자리 * <small>처음 예약 시 등록, 이후 같은 비밀번호 사용</small>
        <input name="pin" required type="password" inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="new-password"></label>
      <div class="s-consent"><b>개인정보 수집·이용 동의 (필수)</b>
        <span>학번·이름·자격증 여부·이용 기록을 예약 관리와 운영 실적 집계에 사용하며 ${C.RETENTION_MONTHS}개월 후 파기합니다. 본인과 운영자만 열람합니다. 동의하지 않으면 이용이 제한됩니다.</span>
        <label class="check"><input type="checkbox" name="agree" required><span>동의합니다.</span></label></div>
      <div class="s-sum" id="sum">시간을 선택하세요</div>
      <button class="s-btn primary big" id="sb">예약 신청</button>
    </form>
    <div class="s-must"><span>당일</span>출력 파일(STL/OBJ/3MF)을 USB나 클라우드 링크로 준비해 오세요.</div>`);

  const drawTimes = () => {
    document.getElementById("fval").textContent = draft.files;
    document.getElementById("times").innerHTML = C.SLOTS.map((t) => {
      const n = counts[`${draft.date}_${t}`] || 0, left = cap - n, dis = left < draft.files || slotPast(draft.date, t);
      if (dis && draft.time === t) draft.time = null;
      const dots = Array.from({ length: cap }, (_, k) => `<i class="${k < n ? "f" : ""}"></i>`).join("");
      return `<button type="button" class="tchip ${draft.time === t ? "on" : ""}" data-time="${t}" ${dis ? "disabled" : ""}>
        <b>${t}</b><span class="dots">${dots}</span><small>${slotPast(draft.date, t) ? "지남" : left <= 0 ? "마감" : `${left}개 가능`}</small></button>`;
    }).join("");
    document.getElementById("sum").textContent = draft.time ? `${dateLabel(draft.date)} ${draft.time} · 파일 ${draft.files}개` : "시간을 선택하세요";
  };
  const watch = () => {
    clear();
    C.SLOTS.forEach((t) => {
      const id = `${draft.date}_${t}`;
      unsubs.push(fb.onSnapshot(fb.doc(col.counts, id), (d) => { counts[id] = d.exists() ? d.data().count || 0 : 0; drawTimes(); }, () => {}));
    });
  };
  fb.getDoc(settingsRef).then((s) => { if (s.exists() && s.data().capacity) cap = s.data().capacity; drawTimes(); }).catch(() => {});
  const q = (id) => document.getElementById(id);
  q("certs").onclick = (e) => { const b = e.target.closest("[data-cert]"); if (!b) return; draft.cert = b.dataset.cert; q("certs").querySelectorAll(".pill").forEach((p) => p.classList.toggle("on", p === b)); };
  q("dates").onclick = (e) => { const b = e.target.closest("[data-date]"); if (!b) return; draft.date = b.dataset.date; draft.time = null; q("dates").querySelectorAll(".dchip").forEach((p) => p.classList.toggle("on", p === b)); watch(); drawTimes(); };
  q("times").onclick = (e) => { const b = e.target.closest("[data-time]"); if (!b || b.disabled) return; draft.time = b.dataset.time; drawTimes(); };
  q("fdec").onclick = () => { draft.files = Math.max(1, draft.files - 1); drawTimes(); };
  q("finc").onclick = () => { draft.files = Math.min(C.MAX_FILES_PER_BOOKING, draft.files + 1); drawTimes(); };
  q("bf").onsubmit = submitBooking;
  watch(); drawTimes();
}

async function submitBooking(e) {
  e.preventDefault();
  const f = new FormData(e.target), v = (k) => String(f.get(k) || "").trim();
  if (!draft.cert) return toast("자격증 소지 여부를 선택해 주세요.");
  if (!draft.time) return toast("방문 시간을 선택해 주세요.");
  if (!/^\d{4}$/.test(v("pin"))) return toast("비밀번호는 숫자 4자리입니다.");
  const sn = v("sn"), btn = document.getElementById("sb");
  btn.disabled = true; btn.textContent = "신청 중…";
  try {
    const key = await pinKey(sn, v("pin"));
    // 이미 등록된 학번이면 비밀번호 확인(열람권 생성), 처음이면 같은 저장에서 등록
    let first = false;
    try { await fb.setDoc(fb.doc(col.grants, `${me.uid}_${sn}`), { uid: me.uid, studentNo: sn, key, createdAt: Date.now() }); }
    catch { first = true; }
    const id = newId(), now = Date.now(), slotId = `${draft.date}_${draft.time}`;
    await fb.runTransaction(db, async (tx) => {
      const cRef = fb.doc(col.counts, slotId), cSnap = await tx.get(cRef);
      const sSnap = await tx.get(settingsRef);
      const cap = (sSnap.exists() && sSnap.data().capacity) || C.DEFAULT_CAPACITY_PER_HOUR;
      const cur = cSnap.exists() ? cSnap.data().count || 0 : 0;
      if (cur + draft.files > cap) throw new Error("FULL");
      tx.set(fb.doc(col.req, id), {
        id, ownerUid: me.uid, status: "booked", studentNo: sn, name: v("name"), cert: draft.cert,
        date: draft.date, time: draft.time, slotId, files: draft.files, createdAt: now, updatedAt: now,
        history: [{ status: "booked", at: now, by: "student" }], consentAt: now
      });
      tx.set(cRef, { count: cur + draft.files, lastReq: id });
      if (first) {
        tx.set(fb.doc(col.students, sn), { keyHash: key, reqId: id, createdAt: now });
        tx.set(fb.doc(col.grants, `${me.uid}_${sn}`), { uid: me.uid, studentNo: sn, key, createdAt: now });
      }
    });
    rememberSn(sn);
    toast("예약이 완료되었습니다.");
    location.hash = "#/my";
  } catch (err) {
    console.error(err);
    btn.disabled = false; btn.textContent = "예약 신청";
    toast(err.message === "FULL" ? "방금 자리가 찼습니다. 다른 시간을 선택해 주세요." : "예약하지 못했습니다. 이미 등록된 학번이라면 처음 정한 비밀번호를 입력해 주세요.");
  }
}

// ---------- 다른 기기 조회 ----------
export function find() {
  shell(`<h1 class="s-h1 y">내 기록 조회</h1>
    <form class="s-card" id="ff"><label>학번<input name="sn" required inputmode="numeric" autocomplete="off"></label>
    <label>비밀번호 4자리<input name="pin" required type="password" inputmode="numeric" maxlength="4" autocomplete="off"></label>
    <button class="s-btn primary big">조회</button>
    <p class="hint">비밀번호를 잊었다면 센터 근로학생에게 초기화를 요청하세요.</p></form>`);
  document.getElementById("ff").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), sn = String(f.get("sn")).trim();
    try {
      const key = await pinKey(sn, String(f.get("pin")).trim());
      await fb.setDoc(fb.doc(col.grants, `${me.uid}_${sn}`), { uid: me.uid, studentNo: sn, key, createdAt: Date.now() }).catch(async (err) => {
        const ok = await fb.getDocs(fb.query(col.req, fb.where("studentNo", "==", sn))).then(() => true).catch(() => false);
        if (!ok) throw err;
      });
      rememberSn(sn);
      location.hash = "#/my";
    } catch { toast("학번 또는 비밀번호가 맞지 않습니다."); }
  };
}

// ---------- 내 현황판 ----------
export function my(sel) {
  const sn = mySn();
  if (!sn) { location.hash = "#/find"; return; }
  shell(`<h1 class="s-h1 g">내 현황판</h1><p class="s-lead">학번 ${esc(sn)}의 예약·이용 기록입니다.</p><div id="list"><p class="hint">불러오는 중…</p></div><div id="detail"></div>`);
  unsubs.push(fb.onSnapshot(fb.query(col.req, fb.where("studentNo", "==", sn)), (s) => {
    const rows = s.docs.map((d) => d.data()).sort((a, b) => b.createdAt - a.createdAt);
    const list = document.getElementById("list");
    if (!list) return;
    list.innerHTML = rows.length ? rows.map((r) => `<a class="s-rec ${r.id === sel ? "on" : ""}" href="#/my/${esc(r.id)}">
      <span class="badge b-${r.status}">${STATUS[r.status]?.label || r.status}</span>
      <b>${dateLabel(r.date)} ${esc(r.time)} · 파일 ${r.files}개</b><small>${esc(r.record?.title || "요청서는 당일 현장에서 작성")}</small></a>`).join("")
      : `<p class="hint">예약 기록이 없습니다. <a href="#/new">예약하기</a></p>`;
    const r = rows.find((x) => x.id === sel) || rows.find((x) => !["surveyed", "canceled", "noshow"].includes(x.status)) || rows[0];
    if (r) detail(r);
  }, () => { document.getElementById("list").innerHTML = `<p class="err">기록을 볼 수 없습니다. <a href="#/find">학번과 비밀번호로 다시 조회</a>해 주세요.</p>`; }));
}

async function detail(r) {
  const el = document.getElementById("detail");
  const photos = (r.record || r.usagePhotoCount) ? await loadPhotos(r.id).catch(() => []) : [];
  const step = STATUS[r.status]?.step ?? -1;
  const at = {}; (r.history || []).forEach((h) => { at[STATUS[h.status]?.step] = h.at; });
  const tl = step < 0 ? `<div class="s-stop">${STATUS[r.status].label}</div>` : `<ol class="s-tl">${STUDENT_STEPS.map((t, i) => {
    const done = i < step || (i === step && ["done", "received", "used", "surveyed"].includes(r.status) && i !== 3 && i !== 4 && i !== 5) || r.status === "surveyed";
    const cls = r.status === "surveyed" || i < step ? "past" : i === step ? "now" : "";
    return `<li class="${done ? "past" : cls}"><i>${i + 1}</i><b>${t}</b><small>${at[i] ? fmtTime(at[i]) : ""}</small></li>`;
  }).join("")}</ol>`;
  const done = photos.filter((p) => p.kind === "done"), usage = photos.filter((p) => p.kind === "usage");
  let act = "";
  if (r.status === "booked") act = `<button class="s-btn danger" data-a="cancel">예약 취소</button>`;
  if (r.status === "done") act = `<button class="s-btn yellow big" data-a="receive">출력물 받았어요 (수령 확인)</button>`;
  if (r.status === "received") act = `<form class="s-card dash" id="uf"><h2>5단계 · 활용 사진 등록</h2>
    <p class="warn"><b>출력물만</b> 나오게 찍어 주세요. 얼굴, 학생증, 다른 사람이 찍히지 않게 해 주세요.</p>
    <input type="file" accept="image/*" multiple required name="files">
    <label>어떻게 활용했나요? *<textarea name="note" rows="3" required maxlength="500"></textarea></label>
    <label class="check"><input type="checkbox" required><span>사진에 개인정보가 없음을 확인했습니다.</span></label>
    <button class="s-btn primary big">등록</button></form>`;
  if (r.status === "used") act = `<form class="s-card dash o" id="sf"><h2>6단계 · 만족도 조사</h2>
    <fieldset><legend>전체 만족도</legend><div class="stars" id="stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${n}점">★</button>`).join("")}</div></fieldset>
    <fieldset><legend>다시 이용하실 건가요?</legend><div class="s-pills">${["네", "보통", "아니요"].map((x) => `<label class="pill"><input type="radio" name="again" value="${x}" required>${x}</label>`).join("")}</div></fieldset>
    <label>개선했으면 하는 점<textarea name="comment" rows="2" maxlength="500"></textarea></label>
    <button class="s-btn primary big">제출하고 완료</button></form>`;
  if (r.status === "surveyed") act = `<p class="s-thanks">모든 과정이 완료되었습니다. 감사합니다!</p>`;
  el.innerHTML = `<section class="s-card"><div class="s-dhead"><span class="badge b-${r.status}">${STATUS[r.status]?.label}</span><small>${esc(r.id)}</small></div>
    <h2 class="s-title">${esc(r.record?.title || "출력 예약")}</h2><p class="s-lead">${dateLabel(r.date)} ${esc(r.time)} · 파일 ${r.files}개${r.record?.printers ? " · " + r.record.printers.map((p) => p + "번").join(", ") : ""}</p>
    ${tl}</section>
    ${done.length ? `${sec("출력 완료 사진")}<div class="s-photos">${done.map((p) => `<img src="${p.data}" alt="">`).join("")}</div>` : ""}
    ${usage.length ? `${sec("활용 사진")}<div class="s-photos">${usage.map((p) => `<img src="${p.data}" alt="">`).join("")}</div>` : ""}
    <div class="s-act">${act}</div>`;
  bindDetail(r);
}

function hist(status) { return fb.arrayUnion({ status, at: Date.now(), by: "student" }); }
function bindDetail(r) {
  const ref = fb.doc(col.req, r.id);
  document.querySelectorAll("[data-a]").forEach((b) => {
    b.onclick = async () => {
      try {
        if (b.dataset.a === "receive") await fb.writeBatch(db).update(ref, { status: "received", receivedAt: Date.now(), updatedAt: Date.now(), history: hist("received") }).commit();
        if (b.dataset.a === "cancel") {
          if (!confirm("예약을 취소할까요?")) return;
          await fb.runTransaction(db, async (tx) => {
            const cRef = fb.doc(col.counts, r.slotId), c = await tx.get(cRef);
            tx.update(ref, { status: "canceled", updatedAt: Date.now(), history: hist("canceled") });
            tx.set(cRef, { count: Math.max(0, (c.data()?.count || 0) - r.files), lastReq: r.id });
          });
        }
      } catch (e) { console.error(e); toast("처리하지 못했습니다."); }
    };
  });
  const uf = document.getElementById("uf");
  if (uf) uf.onsubmit = async (e) => {
    e.preventDefault();
    const files = [...uf.files.files].slice(0, C.MAX_PHOTOS), btn = uf.querySelector("button:last-child");
    btn.disabled = true; btn.textContent = "업로드 중…";
    try {
      await uploadPhotos(r.id, "usage", files);
      await fb.writeBatch(db).update(fb.doc(col.req, r.id), { status: "used", usedAt: Date.now(), updatedAt: Date.now(), usageNote: uf.note.value.trim(), usagePhotoCount: files.length, history: hist("used") }).commit();
    } catch (err) { console.error(err); btn.disabled = false; btn.textContent = "등록"; toast("업로드하지 못했습니다."); }
  };
  const sf = document.getElementById("sf");
  if (sf) {
    let rating = 0;
    sf.querySelector("#stars").onclick = (e) => {
      const b = e.target.closest("[data-star]"); if (!b) return;
      rating = Number(b.dataset.star);
      sf.querySelectorAll("[data-star]").forEach((s) => s.classList.toggle("on", Number(s.dataset.star) <= rating));
    };
    sf.onsubmit = async (e) => {
      e.preventDefault();
      if (!rating) return toast("별점을 선택해 주세요.");
      const f = new FormData(sf);
      try {
        await fb.writeBatch(db).update(fb.doc(col.req, r.id), { status: "surveyed", updatedAt: Date.now(), history: hist("surveyed"),
          survey: { rating, again: String(f.get("again")), comment: String(f.get("comment") || "").trim(), at: Date.now() } }).commit();
        toast("감사합니다!");
      } catch { toast("제출하지 못했습니다."); }
    };
  }
}
