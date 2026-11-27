// 공통: Firebase, 로그인 상태, 유틸
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, onSnapshot,
  writeBatch, runTransaction, deleteDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import * as C from "./config.js";

export const fb = { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, onSnapshot, writeBatch, runTransaction, deleteDoc, arrayUnion, signInWithPopup, GoogleAuthProvider, signOut };
const app = initializeApp(C.firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const col = {
  req: collection(db, "printRequests"), counts: collection(db, "printCounts"), students: collection(db, "printStudents"),
  grants: collection(db, "printGrants"), staff: collection(db, "printStaff"), printers: collection(db, "printPrinters")
};
export const photosOf = (id) => collection(db, "printRequests", id, "photos");
export const settingsRef = doc(db, "printSettings", "main");

// 상태
export const STATUS = {
  booked: { label: "방문 예약", step: 0 }, onsite: { label: "현장 요청서 작성", step: 1 }, printing: { label: "출력", step: 2 },
  done: { label: "출력 완료", step: 2 }, received: { label: "수령 완료", step: 3 }, used: { label: "활용 사진 등록", step: 4 },
  surveyed: { label: "만족도 조사 완료", step: 5 }, noshow: { label: "노쇼", step: -1 }, canceled: { label: "취소", step: -1 }
};
export const STUDENT_STEPS = ["방문 예약", "현장 요청서 작성", "출력", "수령 완료", "활용 사진 등록", "만족도 조사"];
export const CERTS = ["소지", "미소지", "취득 준비 중"];
export const PRINTER_STATUS = {
  ok: "사용 가능", busy: "출력 중", admin: "관리자 사용 중", check: "점검 중", broken: "고장"
};

// 로그인
export const me = { uid: null, email: "", name: "", role: "student" };
export const isStaff = () => me.role === "manager" || me.role === "admin";
export const isAdmin = () => me.role === "admin";
export const actor = () => (isStaff() ? `${me.role}:${me.name}` : "student");
export function actorLabel(by) {
  if (!by || by === "student") return "학생";
  const [r, n] = by.split(":");
  return `${r === "admin" ? "관리자" : "매니저"} ${n || ""}`.trim();
}
export function startAuth(onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      Object.assign(me, { uid: null, email: "", name: "", role: "student" });
      try { await signInAnonymously(auth); } catch { document.getElementById("app").innerHTML = `<p class="err" style="padding:24px">서버에 연결하지 못했습니다.</p>`; }
      return;
    }
    me.uid = user.uid;
    if (user.isAnonymous) Object.assign(me, { email: "", name: "", role: "student" });
    else {
      me.email = String(user.email || "").toLowerCase();
      const s = await getDoc(doc(col.staff, me.email)).catch(() => null);
      if (s && s.exists()) { me.role = s.data().role === "admin" ? "admin" : "manager"; me.name = s.data().name || me.email; }
      else { me.role = "unregistered"; me.name = ""; }
    }
    onReady();
  });
}
export async function logout(msg) {
  try { await signOut(auth); } catch { /* 무시 */ }
  location.hash = "#/";
  if (msg) toast(msg);
}

// 유틸
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WD = ["일", "월", "화", "수", "목", "금", "토"];
export function dateLabel(s) {
  const [y, m, d] = String(s).split("-").map(Number);
  return `${m}/${d}(${WD[new Date(y, m - 1, d).getDay()]})`;
}
export function fmtTime(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function bookableDates() {
  const out = [], t = new Date();
  t.setHours(0, 0, 0, 0);
  for (let i = 0; i <= C.BOOKING_DAYS_AHEAD; i++) {
    const d = new Date(t);
    d.setDate(t.getDate() + i);
    const s = ymd(d);
    if (!C.CLOSED_WEEKDAYS.includes(d.getDay()) && !C.CLOSED_DATES.includes(s)) out.push(s);
  }
  return out;
}
export function slotPast(date, time) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, Number(time.slice(0, 2)), 0) < new Date();
}
export function newId() {
  const d = new Date(), chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = crypto.getRandomValues(new Uint32Array(6));
  return `P${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${[...r].map((x) => chars[x % chars.length]).join("")}`;
}
export async function pinKey(sn, pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${sn}:${pin}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}
export function lsGet(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }
export function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 무시 */ } }
export const isSharedDevice = () => lsGet("print-shared-device", false) === true;

// 사진 압축 (위치정보 제거)
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let max = 1280, q = 0.75, out = "";
      for (let i = 0; i < 6; i++) {
        const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        out = c.toDataURL("image/jpeg", q);
        if (out.length < 700000) return resolve(out);
        max = Math.round(max * 0.8); q = Math.max(0.5, q - 0.08);
      }
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("이미지 오류")); };
    img.src = url;
  });
}
export async function uploadPhotos(id, kind, files) {
  for (const f of files) await setDoc(doc(photosOf(id)), { kind, data: await compressImage(f), createdAt: Date.now(), by: actor() });
}
export async function loadPhotos(id) {
  const s = await getDocs(photosOf(id));
  return s.docs.map((d) => d.data()).sort((a, b) => a.createdAt - b.createdAt);
}
