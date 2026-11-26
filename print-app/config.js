// ============================================================
// 3D프린터 출력 요청 관리 — 운영 설정
// 이 파일만 고치면 장비·예약 시간·재료 목록을 바꿀 수 있습니다.
// ============================================================

// Firebase 콘솔 → 프로젝트 설정 → 일반 → "내 앱" 웹 앱 설정 값.
// 기본값은 checkin-app과 같은 프로젝트(online-mission)입니다.
// 같은 프로젝트를 쓰면 README의 "보안 규칙" 단계에서 규칙을 합쳐 게시해야 합니다.
export const firebaseConfig = {
  apiKey: "AIzaSyBbhcl9JBIeDVB-exWg0u6wv3zXhy7Dzow",
  authDomain: "online-mission.firebaseapp.com",
  projectId: "online-mission",
  storageBucket: "online-mission.firebasestorage.app",
  messagingSenderId: "885880567048",
  appId: "1:885880567048:web:b88611d9c200f9b936a8bd"
};

// 운영자 화면(#/staff) PIN — 입력한 PIN으로 역할이 정해집니다.
// 진짜 보안이 아니라 학생이 실수로 들어오는 것을 막는 정도입니다. 학기마다 바꾸세요.
//  - 매니저(근로학생): 예약 확정·반려, 출력 시작/완료 사진, 수령 처리, 카톡 안내
//  - 관리자(담당자): 매니저 기능 + 실적 통계, CSV 내보내기, 상태 정정, 처리자 이력 확인
export const MANAGER_PIN = "3030";
export const ADMIN_PIN = "9090";

// (선택) 카카오 JavaScript 키. developers.kakao.com → 내 애플리케이션 → 앱 키 → JavaScript 키.
// 비워두면 휴대폰 기본 공유창(카카오톡 선택 가능) 또는 링크 복사로 동작합니다.
export const KAKAO_JS_KEY = "";

// (선택) 카카오톡 채널 1:1 채팅 링크. 예: "https://pf.kakao.com/_xxxxxx/chat"
export const KAKAO_CHANNEL_URL = "";

export const CENTER_NAME = "창의융합혁신센터";

// 보유 장비
export const PRINTERS = [
  { id: "p1", name: "1호기 (FDM)" },
  { id: "p2", name: "2호기 (FDM)" },
  { id: "p3", name: "3호기 (레진)" }
];

// 예약 가능한 시간 칸(1칸 = 1시간). 학생은 한 장비에서 연속된 칸을 여러 개 잡을 수 있습니다.
export const SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
export const MAX_SLOTS_PER_REQUEST = 4;

// 오늘부터 며칠 뒤까지 예약을 받을지
export const BOOKING_DAYS_AHEAD = 14;
// 예약을 받지 않는 요일 (0=일, 6=토)
export const CLOSED_WEEKDAYS = [0, 6];
// 휴관일 (YYYY-MM-DD)
export const CLOSED_DATES = ["2026-12-25", "2027-01-01"];

export const MATERIALS = ["PLA", "PETG", "TPU(유연)", "레진", "잘 모르겠음(상담 필요)"];

// 사진 1장당 최대 장수
export const MAX_PHOTOS = 3;
