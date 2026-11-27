// 운영자 화면 (깔끔한 업무용): 로그인, 콘솔, 이용기록 입력, 노쇼, 프린터 23대, 전체 현황, 통계, 운영자 관리
import * as C from "./config.js";
import {
  db, auth, fb, col, settingsRef, me, isAdmin, actor, actorLabel, STATUS, CERTS, PRINTER_STATUS, esc, dateLabel, fmtTime, ymd,
  toast, logout, lsSet, isSharedDevice, uploadPhotos, loadPhotos
} from "./common.js";

const $app = () => document.getElementById("app");
let unsubs = [];
export function clear() { unsubs.forEach((u) => u()); unsubs = []; }
const today = () => ymd(new Date());

function shell(inner, back = false) {
  $app().innerHTML = `<div class="ops">
    <header class="o-top"><div class="o-wrap">
      ${back ? `<a href="#/staff" class="o-link">‹ 콘솔</a>` : `<b>3D프린터 운영</b>`}
      <nav class="o-nav">
        <a href="#/staff">콘솔</a><a href="#/staff/board">전체 현황</a><a href="#/staff/printers">프린터</a>
        ${isAdmin() ? `<a href="#/staff/admin">관리</a>` : ""}
        <span class="o-role">${me.role === "admin" ? "관리자" : "매니저"} · ${esc(me.name)}</span>
        <button class="o-btn ghost" id="out">로그아웃</button>
      </nav></div></header>
    <main class="o-wrap">${inner}</main></div>`;
  document.getElementById("out").onclick = () => logout("로그아웃했습니다.");
}
const badge = (s) => `<span class="o-badge ob-${s}">${STATUS[s]?.label || s}</span>`;
const hist = (status, memo = "") => fb.arrayUnion({ status, at: Date.now(), by: actor(), memo });

// ---------- 로그인 ----------
export function login() {
  $app().innerHTML = `<div class="ops"><main class="o-wrap o-login">
    <h1>운영자 로그인</h1><p class="o-muted">관리자가 등록한 구글 계정만 들어갈 수 있습니다.</p>
    ${me.role === "unregistered" ? `<p class="o-alert">${esc(me.email)} 계정은 등록되어 있지 않습니다.</p>` : ""}
    <button class="o-btn primary" id="g">구글 계정으로 로그인</button>
    ${me.role === "unregistered" ? `<button class="o-btn" id="o2">다른 계정으로</button>` : ""}
    <p><a href="#/">학생 화면으로</a></p></main></div>`;
  document.getElementById("g").onclick = async () => {
    try { const p = new fb.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" }); await fb.signInWithPopup(auth, p); }
    catch { toast("로그인하지 못했습니다."); }
  };
  const o2 = document.getElementById("o2");
  if (o2) o2.onclick = () => logout();
}

// ---------- 공통 데이터 구독 ----------
function watchAll(cb) {
  unsubs.push(fb.onSnapshot(fb.query(col.req, fb.orderBy("createdAt", "desc")), (s) => cb(s.docs.map((d) => d.data())), () => toast("목록을 불러오지 못했습니다.")));
}
function watchPrinters(cb) {
  unsubs.push(fb.onSnapshot(col.printers, (s) => {
    const m = {}; s.docs.forEach((d) => { m[d.id] = d.data(); });
    cb(C.PRINTERS.map((p) => ({ ...p, ...(m[p.id] || { status: "ok" }) })));
  }, () => {}));
}

// ---------- 콘솔 ----------
export function console_() {
  let all = [], printers = [];
  shell(`<div class="o-head"><h1>콘솔 <small>${dateLabel(today())}</small></h1><span id="pr" class="o-muted"></span></div>
    <div class="o-kpis" id="k"></div>
    <section class="o-card"><h2>오늘 방문 예약</h2><div id="t"></div></section>
    <section class="o-card"><h2>노쇼 기록</h2><div id="ns"></div></section>`);
  const draw = () => {
    const td = all.filter((r) => r.date === today() && r.status !== "canceled").sort((a, b) => a.time.localeCompare(b.time));
    const cnt = (f) => all.filter(f).length;
    document.getElementById("k").innerHTML = [
      ["오늘 예약", td.length], ["출력 중", cnt((r) => r.status === "printing")], ["기록 입력 대기", cnt((r) => r.status === "onsite")],
      ["수령 대기", cnt((r) => r.status === "done")], ["활용·설문 대기", cnt((r) => ["received", "used"].includes(r.status))], ["누적 완료", cnt((r) => r.status === "surveyed")]
    ].map(([l, n]) => `<div class="o-kpi"><b>${n}</b><span>${l}</span></div>`).join("");
    const ok = printers.filter((p) => p.status === "ok").length;
    document.getElementById("pr").textContent = printers.length ? `사용 가능 프린터 ${ok}/${C.PRINTERS.length}` : "";
    document.getElementById("t").innerHTML = td.length ? `<table class="o-table"><thead><tr><th>시간</th><th>학번</th><th>이름</th><th>자격증</th><th>파일</th><th>상태</th><th></th></tr></thead><tbody>
      ${td.map((r) => `<tr><td>${esc(r.time)}</td><td>${esc(r.studentNo)}</td><td>${esc(r.name)}</td><td>${esc(r.cert)}</td><td>${r.files}</td><td>${badge(r.status)}</td>
      <td class="o-actions">${r.status === "booked" ? `<button class="o-btn small primary" data-onsite="${r.id}">방문·요청서 작성</button><button class="o-btn small" data-noshow="${r.id}">노쇼</button>` : ""}
      ${["onsite", "printing"].includes(r.status) ? `<a class="o-btn small primary" href="#/staff/record/${esc(r.id)}">이용기록 입력</a>` : ""}
      ${r.status === "done" ? `<button class="o-btn small" data-recv="${r.id}">수령 처리</button>` : ""}</td></tr>`).join("")}</tbody></table>` : `<p class="o-muted">오늘 예약이 없습니다.</p>`;
    const ns = {}; all.filter((r) => r.status === "noshow").forEach((r) => { (ns[r.studentNo] ||= { name: r.name, sn: r.studentNo, list: [] }).list.push(r); });
    const nsRows = Object.values(ns).sort((a, b) => b.list.length - a.list.length);
    document.getElementById("ns").innerHTML = nsRows.length ? `<table class="o-table"><thead><tr><th>학번</th><th>이름</th><th>누적</th><th>최근</th><th>처리</th></tr></thead><tbody>
      ${nsRows.map((x) => { const l = x.list.sort((a, b) => b.updatedAt - a.updatedAt)[0]; return `<tr><td>${esc(x.sn)}</td><td>${esc(x.name)}</td><td><b class="${x.list.length >= 2 ? "o-warn" : ""}">${x.list.length}회</b></td><td>${dateLabel(l.date)} ${esc(l.time)}</td><td>${esc(actorLabel((l.history || []).slice(-1)[0]?.by))}</td></tr>`; }).join("")}</tbody></table>` : `<p class="o-muted">노쇼 기록이 없습니다.</p>`;
  };
  $app().onclick = async (e) => {
    const t = e.target.closest("[data-onsite],[data-noshow],[data-recv]");
    if (!t) return;
    const id = t.dataset.onsite || t.dataset.noshow || t.dataset.recv, r = all.find((x) => x.id === id), ref = fb.doc(col.req, id);
    try {
      if (t.dataset.onsite) { await fb.writeBatch(db).update(ref, { status: "onsite", updatedAt: Date.now(), history: hist("onsite") }).commit(); location.hash = `#/staff/record/${id}`; }
      if (t.dataset.noshow) {
        const [y, m, d] = r.date.split("-").map(Number), due = new Date(y, m - 1, d, Number(r.time.slice(0, 2)), C.NO_SHOW_MINUTES);
        if (new Date() < due && !confirm(`예약 후 ${C.NO_SHOW_MINUTES}분이 지나지 않았습니다. 그래도 노쇼로 처리할까요?`)) return;
        await fb.writeBatch(db).update(ref, { status: "noshow", updatedAt: Date.now(), history: hist("noshow") }).commit();
      }
      if (t.dataset.recv) await fb.writeBatch(db).update(ref, { status: "received", receivedAt: Date.now(), updatedAt: Date.now(), history: hist("received", "대리 수령 확인") }).commit();
    } catch (err) { console.error(err); toast("처리하지 못했습니다."); }
  };
  watchAll((x) => { all = x; draw(); });
  watchPrinters((p) => { printers = p; draw(); });
}

// ---------- 이용기록 입력 (장비 선택 → 자동 출력 중) ----------
export function record(id) {
  let r = null, printers = [], picked = [];
  shell(`<div id="rc"><p class="o-muted">불러오는 중…</p></div>`, true);
  const draw = () => {
    if (!r) return;
    const rec = r.record || {};
    if (!picked.length && rec.printers) picked = [...rec.printers];
    const avail = printers.filter((p) => p.status === "ok" || picked.includes(p.no));
    document.getElementById("rc").innerHTML = `<div class="o-head"><h1>이용기록 입력</h1>${badge(r.status)}</div>
    <div class="o-info"><span>예약 <b>${dateLabel(r.date)} ${esc(r.time)}</b></span><span>학번 <b>${esc(r.studentNo)}</b></span><span>이름 <b>${esc(r.name)}</b></span><span>자격증 <b>${esc(r.cert)}</b></span><span>파일 <b>${r.files}개</b></span></div>
    <form class="o-card o-form" id="rf">
      <h2>요청서 내용</h2>
      <div class="o-grid">
        <label>학과/소속<input name="dept" value="${esc(rec.dept || "")}"></label>
        <label>출력물 이름 *<input name="title" required value="${esc(rec.title || "")}"></label>
        <label>사용 목적 *<select name="purpose" required>${["", "수업 과제", "캡스톤/졸업작품", "공모전·경진대회", "동아리·비교과", "창업·시제품", "개인 학습", "기타"].map((o) => `<option ${rec.purpose === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>
        <label>재료 · 색상<input name="material" value="${esc(rec.material || "PLA")}"></label>
        <label>수량<input name="qty" type="number" min="1" value="${esc(rec.qty || 1)}"></label>
        <label>출력 시작<input name="start" type="time" value="${esc(rec.start || "")}"></label>
        <label>출력 종료(예정)<input name="end" type="time" value="${esc(rec.end || "")}"></label>
      </div>
      <h2>사용 장비 <small class="o-muted">파일 1개 = 프린터 1대 · ${picked.length}/${r.files} 선택</small></h2>
      <div class="o-printers" id="pp">${avail.map((p) => `<button type="button" class="o-pchip ${picked.includes(p.no) ? "on" : ""}" data-no="${p.no}">${esc(p.name)}<small>${p.no === 23 ? "스케치 스프린트" : "리플리케이터+"}</small></button>`).join("") || `<p class="o-muted">사용 가능한 프린터가 없습니다.</p>`}</div>
      <div class="o-row">
        <button type="button" class="o-btn primary" id="startBtn" ${r.status === "onsite" ? "" : "disabled"}>출력 시작 (장비 자동 '출력 중')</button>
      </div>
      <h2>출력 결과</h2>
      <div class="o-row">${["성공", "부분 실패·재출력", "실패"].map((x) => `<label class="o-radio"><input type="radio" name="result" value="${x}" ${rec.result === x ? "checked" : ""}>${x}</label>`).join("")}</div>
      <label>출력 완료 사진 (최대 ${C.MAX_PHOTOS}장)<input type="file" name="photos" accept="image/*" multiple></label>
      <label>메모 <small class="o-muted">개인정보 금지</small><textarea name="memo" rows="2">${esc(rec.memo || "")}</textarea></label>
      <label class="o-check"><input type="checkbox" name="signed" ${rec.signed ? "checked" : ""} required>학생이 현장 요청서를 작성·서명했고 내용이 일치합니다.</label>
      <div class="o-row"><button class="o-btn primary">출력 완료 · 이용기록 저장</button><button type="button" class="o-btn" id="saveOnly">임시 저장</button></div>
    </form>`;
    bind();
  };
  const formData = () => {
    const f = new FormData(document.getElementById("rf")), v = (k) => String(f.get(k) || "").trim();
    return { dept: v("dept"), title: v("title"), purpose: v("purpose"), material: v("material"), qty: Number(v("qty")) || 1, start: v("start"), end: v("end"),
      result: v("result"), memo: v("memo"), signed: !!f.get("signed"), printers: [...picked], by: actor(), at: Date.now() };
  };
  const setPrinters = (batch, status) => picked.forEach((no, i) => batch.set(fb.doc(col.printers, `p${no}`), status === "busy"
    ? { status: "busy", reqId: r.id, user: r.name, studentNo: r.studentNo, fileIdx: i + 1, fileTotal: picked.length, endAt: formData().end, updatedAt: Date.now(), by: actor() }
    : { status: "ok", updatedAt: Date.now(), by: actor() }));
  const bind = () => {
    document.getElementById("pp").onclick = (e) => {
      const b = e.target.closest("[data-no]"); if (!b || r.status === "printing") return;
      const no = Number(b.dataset.no);
      picked = picked.includes(no) ? picked.filter((x) => x !== no) : picked.length < r.files ? [...picked, no] : picked;
      if (!picked.includes(no) && picked.length >= r.files) toast(`파일 ${r.files}개 → 프린터 ${r.files}대까지 선택`);
      draw();
    };
    document.getElementById("startBtn").onclick = async () => {
      if (picked.length !== r.files) return toast(`프린터를 ${r.files}대 선택해 주세요.`);
      const b = fb.writeBatch(db);
      b.update(fb.doc(col.req, r.id), { status: "printing", record: formData(), updatedAt: Date.now(), history: hist("printing", picked.map((n) => n + "번").join(",")) });
      setPrinters(b, "busy");
      try { await b.commit(); toast("출력을 시작했습니다."); } catch (e) { console.error(e); toast("저장하지 못했습니다."); }
    };
    document.getElementById("saveOnly").onclick = async () => {
      try { await fb.writeBatch(db).update(fb.doc(col.req, r.id), { record: formData(), updatedAt: Date.now() }).commit(); toast("임시 저장했습니다."); } catch { toast("저장하지 못했습니다."); }
    };
    document.getElementById("rf").onsubmit = async (e) => {
      e.preventDefault();
      const fd = formData();
      if (!fd.result) return toast("출력 결과를 선택해 주세요.");
      if (picked.length !== r.files) return toast(`프린터를 ${r.files}대 선택해 주세요.`);
      const files = [...e.target.photos.files].slice(0, C.MAX_PHOTOS);
      try {
        if (files.length) await uploadPhotos(r.id, "done", files);
        const b = fb.writeBatch(db);
        b.update(fb.doc(col.req, r.id), { status: "done", record: fd, donePhotoCount: (r.donePhotoCount || 0) + files.length, doneAt: Date.now(), updatedAt: Date.now(), history: hist("done", fd.result) });
        setPrinters(b, "ok");
        await b.commit();
        toast("이용기록을 저장했습니다.");
        location.hash = "#/staff";
      } catch (err) { console.error(err); toast("저장하지 못했습니다."); }
    };
  };
  unsubs.push(fb.onSnapshot(fb.doc(col.req, id), (s) => { r = s.exists() ? s.data() : null; if (!r) document.getElementById("rc").innerHTML = "<p>없는 예약입니다.</p>"; draw(); }));
  watchPrinters((p) => { printers = p; draw(); });
}

// ---------- 프린터 23대 ----------
export function printersPage() {
  let list = [], filter = "all";
  shell(`<div class="o-head"><h1>프린터 가능 현황</h1><div class="o-row" id="f"></div></div>
    <p class="o-muted">이용기록에서 장비를 고르면 자동으로 '출력 중', 출력 완료를 저장하면 '사용 가능'으로 바뀝니다. 점검·고장·관리자 사용은 여기서 바꿉니다.</p>
    <div class="o-pgrid" id="g"></div>`);
  const draw = () => {
    const cnt = (k) => list.filter((p) => p.status === k).length;
    document.getElementById("f").innerHTML = [["all", "전체", list.length], ...Object.entries(PRINTER_STATUS).map(([k, l]) => [k, l, cnt(k)])]
      .map(([k, l, n]) => `<button class="o-chip ${filter === k ? "on" : ""}" data-f="${k}">${l} ${n}</button>`).join("");
    document.getElementById("g").innerHTML = list.filter((p) => filter === "all" || p.status === filter).map((p) => `
      <div class="o-pcard ps-${p.status}"><div class="o-prow"><b>${esc(p.name)}</b><span class="o-dot"></span></div>
        <small>${esc(p.model)}${p.material ? " · " + esc(p.material) : ""}</small>
        <span class="o-pstat">${PRINTER_STATUS[p.status]}</span>
        <small>${p.status === "busy" ? `${esc(p.user)} ${esc(p.studentNo)} · 파일 ${p.fileIdx}/${p.fileTotal}${p.endAt ? " · " + esc(p.endAt) + " 종료" : ""}` : esc(p.note || "")}</small>
        <select data-p="${p.id}" aria-label="${esc(p.name)} 상태">${Object.entries(PRINTER_STATUS).map(([k, l]) => `<option value="${k}" ${p.status === k ? "selected" : ""} ${k === "busy" ? "disabled" : ""}>${l}</option>`).join("")}</select>
      </div>`).join("");
  };
  $app().onclick = (e) => { const b = e.target.closest("[data-f]"); if (b) { filter = b.dataset.f; draw(); } };
  $app().onchange = async (e) => {
    const s = e.target.closest("[data-p]"); if (!s) return;
    const st = s.value, note = st === "ok" ? "" : prompt(st === "admin" ? "사용 목적" : "사유", "") || "";
    try { await fb.setDoc(fb.doc(col.printers, s.dataset.p), { status: st, note: st === "admin" ? `${me.name} · ${note}` : note, updatedAt: Date.now(), by: actor() }); }
    catch { toast("변경하지 못했습니다."); }
  };
  watchPrinters((p) => { list = p; draw(); });
}

// ---------- 전체 현황 ----------
export function board() {
  let all = [], q = "", st = "all";
  shell(`<div class="o-head"><h1>전체 이용 현황</h1><input class="o-search" id="q" placeholder="학번·이름·출력물 검색"></div>
    <div class="o-row" id="tabs"></div><div class="o-card"><div id="tb"></div></div>`);
  const draw = () => {
    const keys = ["all", ...Object.keys(STATUS)];
    document.getElementById("tabs").innerHTML = keys.map((k) => `<button class="o-chip ${st === k ? "on" : ""}" data-s="${k}">${k === "all" ? "전체" : STATUS[k].label} ${k === "all" ? all.length : all.filter((r) => r.status === k).length}</button>`).join("");
    const rows = all.filter((r) => (st === "all" || r.status === st) && (!q || [r.studentNo, r.name, r.record?.title].join(" ").includes(q)));
    document.getElementById("tb").innerHTML = `<table class="o-table"><thead><tr><th>예약</th><th>학번</th><th>이름</th><th>자격증</th><th>파일</th><th>장비</th><th>출력물</th><th>상태</th><th>만족도</th><th></th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${dateLabel(r.date)} ${esc(r.time)}</td><td>${esc(r.studentNo)}</td><td>${esc(r.name)}</td><td>${esc(r.cert)}</td><td>${r.files}</td>
      <td>${esc((r.record?.printers || []).map((n) => n + "번").join(", "))}</td><td>${esc(r.record?.title || "")}</td><td>${badge(r.status)}</td><td>${r.survey ? "★" + r.survey.rating : ""}</td>
      <td>${["onsite", "printing", "done"].includes(r.status) ? `<a href="#/staff/record/${esc(r.id)}">기록</a>` : ""}</td></tr>`).join("") || `<tr><td colspan="10" class="o-muted">기록이 없습니다.</td></tr>`}</tbody></table>`;
  };
  document.getElementById("q").oninput = (e) => { q = e.target.value.trim(); draw(); };
  $app().onclick = (e) => { const b = e.target.closest("[data-s]"); if (b) { st = b.dataset.s; draw(); } };
  watchAll((x) => { all = x; draw(); });
}

// ---------- 관리 (관리자) ----------
export function adminPage() {
  if (!isAdmin()) { location.hash = "#/staff"; return; }
  let all = [];
  shell(`<div class="o-head"><h1>관리</h1></div>
    <section class="o-card"><h2>내려받기</h2><div class="o-row">
      <label>시작<input type="date" id="d1"></label><label>종료<input type="date" id="d2"></label>
      <button class="o-btn primary" id="xl">이용기록 엑셀(.xlsx)</button><button class="o-btn" id="hw">보고서 한글(.hwpx)</button><button class="o-btn" id="dx">보고서 Word(.docx)</button></div>
      <p class="o-muted">학생 개인정보가 포함됩니다. 메일 첨부·USB 이동을 피하고 사용 후 삭제하세요.</p></section>
    <section class="o-card"><h2>실적 통계</h2><div id="st"></div></section>
    <section class="o-card"><h2>운영 설정</h2><div class="o-row"><label>시간당 예약 가능 파일 수 <input type="number" id="cap" min="1" max="23" style="width:80px"></label><button class="o-btn" id="capSave">저장</button></div>
      <label class="o-check"><input type="checkbox" id="shared" ${isSharedDevice() ? "checked" : ""}>이 기기를 공용 PC로 사용</label></section>
    <section class="o-card"><h2>운영자 관리</h2><div id="sl"></div>
      <form id="sf" class="o-row"><input name="email" type="email" required placeholder="구글 이메일"><input name="name" required placeholder="이름"><select name="role"><option value="manager">매니저(근로학생)</option><option value="admin">관리자</option></select><button class="o-btn primary">추가</button></form></section>
    <section class="o-card"><h2>학생 비밀번호 초기화</h2><form id="pf" class="o-row"><input name="sn" required placeholder="학번"><button class="o-btn">초기화</button></form></section>`);
  const q = (id) => document.getElementById(id);
  const range = () => all.filter((r) => (!q("d1").value || r.date >= q("d1").value) && (!q("d2").value || r.date <= q("d2").value));
  fb.getDoc(settingsRef).then((s) => { q("cap").value = (s.exists() && s.data().capacity) || C.DEFAULT_CAPACITY_PER_HOUR; });
  q("capSave").onclick = async () => { try { await fb.setDoc(settingsRef, { capacity: Number(q("cap").value) }); toast("저장했습니다."); } catch { toast("저장하지 못했습니다."); } };
  q("shared").onchange = (e) => { lsSet("print-shared-device", e.target.checked); toast(e.target.checked ? "공용 PC로 설정했습니다." : "해제했습니다."); };
  q("xl").onclick = async () => (await import("./export.js")).exportXlsx(range());
  q("hw").onclick = async () => (await import("./export.js")).exportReport(range(), "hwpx", loadPhotos);
  q("dx").onclick = async () => (await import("./export.js")).exportReport(range(), "docx", loadPhotos);
  q("sf").onsubmit = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    try { await fb.setDoc(fb.doc(col.staff, String(f.get("email")).trim().toLowerCase()), { name: String(f.get("name")).trim(), role: String(f.get("role")), addedBy: me.email, addedAt: Date.now() }); e.target.reset(); toast("추가했습니다."); }
    catch { toast("추가하지 못했습니다."); }
  };
  q("pf").onsubmit = async (e) => {
    e.preventDefault(); const sn = String(new FormData(e.target).get("sn")).trim();
    if (!confirm(`${sn} 학생의 비밀번호를 초기화할까요? 다음 예약 때 새로 정합니다.`)) return;
    try { await fb.deleteDoc(fb.doc(col.students, sn)); toast("초기화했습니다."); } catch { toast("초기화하지 못했습니다."); }
  };
  unsubs.push(fb.onSnapshot(col.staff, (s) => {
    q("sl").innerHTML = `<table class="o-table"><tbody>${s.docs.map((d) => `<tr><td>${d.data().role === "admin" ? "관리자" : "매니저"}</td><td>${esc(d.data().name)}</td><td>${esc(d.id)}</td>
      <td>${d.id === me.email ? "(나)" : `<button class="o-btn small" data-del="${esc(d.id)}">삭제</button>`}</td></tr>`).join("")}</tbody></table>`;
    q("sl").querySelectorAll("[data-del]").forEach((b) => { b.onclick = () => confirm("삭제할까요?") && fb.deleteDoc(fb.doc(col.staff, b.dataset.del)); });
  }));
  watchAll((x) => {
    all = x;
    const v = x.filter((r) => !["canceled"].includes(r.status)), fin = x.filter((r) => STATUS[r.status].step >= 2 && r.status !== "printing");
    const sv = x.filter((r) => r.survey), avg = sv.length ? (sv.reduce((a, r) => a + r.survey.rating, 0) / sv.length).toFixed(1) : "-";
    const people = new Set(v.map((r) => r.studentNo)).size, cert = new Set(v.filter((r) => r.cert === "소지").map((r) => r.studentNo)).size;
    q("st").innerHTML = `<div class="o-kpis">${[["누적 예약", v.length], ["이용 학생", people], ["출력 파일", fin.reduce((a, r) => a + r.files, 0)],
      ["노쇼", x.filter((r) => r.status === "noshow").length], ["자격증 소지", people ? Math.round(cert / people * 100) + "%" : "-"], ["평균 만족도", avg]]
      .map(([l, n]) => `<div class="o-kpi"><b>${n}</b><span>${l}</span></div>`).join("")}</div>`;
  });
}
export { CERTS, fmtTime };
