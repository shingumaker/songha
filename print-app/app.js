// 라우터: 학생 화면(student.js) / 운영자 화면(staff.js)
import { startAuth, isStaff, me, logout, toast } from "./common.js";
import * as S from "./student.js";
import * as O from "./staff.js";
import { STAFF_IDLE_MINUTES, SHARED_IDLE_MINUTES } from "./config.js";
import { isSharedDevice } from "./common.js";

function route() {
  S.clear(); O.clear();
  const app = document.getElementById("app");
  app.onclick = null; app.onchange = null;
  window.scrollTo(0, 0);
  const [page, a, b] = location.hash.replace(/^#\/?/, "").split("/");
  if (page === "staff") {
    if (!isStaff()) return O.login();
    if (a === "record" && b) return O.record(b);
    if (a === "printers") return O.printersPage();
    if (a === "board") return O.board();
    if (a === "admin") return O.adminPage();
    return O.console_();
  }
  if (page === "new") return S.booking();
  if (page === "find") return S.find();
  if (page === "my") return S.my(a);
  return S.home();
}
window.addEventListener("hashchange", route);

// 자동 로그아웃
let last = Date.now();
["pointerdown", "keydown", "touchstart"].forEach((e) => window.addEventListener(e, () => { last = Date.now(); }, { passive: true }));
setInterval(() => {
  const idle = (Date.now() - last) / 60000;
  if (isStaff() && idle >= STAFF_IDLE_MINUTES) { last = Date.now(); logout("자동 로그아웃되었습니다."); }
  else if (!isStaff() && isSharedDevice() && idle >= SHARED_IDLE_MINUTES && location.hash && location.hash !== "#/") {
    last = Date.now();
    try { sessionStorage.clear(); } catch { /* 무시 */ }
    logout("공용 PC: 처음 화면으로 돌아왔습니다.");
  }
}, 20000);

startAuth(() => {
  if (me.role === "unregistered") toast("등록되지 않은 운영자 계정입니다.");
  route();
});
