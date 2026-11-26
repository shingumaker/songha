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

// 운영자(매니저·관리자)는 구글 계정으로 로그인합니다. PIN은 쓰지 않습니다.
//  - 첫 관리자: Firebase 콘솔 → Firestore → printStaff 컬렉션에 문서 ID = 구글 이메일,
//    필드 role: "admin", name: "이름" 으로 직접 만듭니다. (README 참고)
//  - 이후 매니저(근로학생)는 관리자 콘솔의 "운영자 관리"에서 이메일로 추가합니다.
//  - 매니저: 예약 확정·반려, 출력 시작/완료 사진, 수령 처리, 카톡 안내
//  - 관리자: 매니저 기능 + 실적 통계, CSV, 상태 정정, 운영자 관리, 기록 파기, 공용 PC 설정

// 개인정보 보유 기간(개월). 예약일로부터 이 기간이 지난 기록은 관리자가 "파기"로 익명화합니다.
export const RETENTION_MONTHS = 12;

// 자동 로그아웃(분): 운영자 / 공용 PC 모드의 학생
export const STAFF_IDLE_MINUTES = 30;
export const SHARED_IDLE_MINUTES = 3;

// 개인정보 담당 문의처 (동의서에 표시)
export const PRIVACY_CONTACT = "창의융합혁신센터 사무실";

// (선택) 카카오 JavaScript 키. developers.kakao.com → 내 애플리케이션 → 앱 키 → JavaScript 키.
// 비워두면 휴대폰 기본 공유창(카카오톡 선택 가능) 또는 링크 복사로 동작합니다.
export const KAKAO_JS_KEY = "";

// (선택) 카카오톡 채널 1:1 채팅 링크. 예: "https://pf.kakao.com/_xxxxxx/chat"
export const KAKAO_CHANNEL_URL = "";

export const CENTER_NAME = "신구대학교 창의융합혁신센터";
export const SPACE_NAME = "신구대학교 메이커스페이스";
export const LOCATION = "미래창의관 지하 1층 3D프린팅룸";
export const CONTACT = "031-740-1241 또는 카카오톡 채널";

// 보유 장비 (파일 1개 = 프린터 1대)
export const PRINTERS = [
  ...Array.from({ length: 22 }, (_, i) => ({ id: `p${i + 1}`, no: i + 1, name: `${String(i + 1).padStart(2, "0")}번`, model: "메이커봇 리플리케이터+", material: "PLA" })),
  { id: "p23", no: 23, name: "23번", model: "메이커봇 스케치 스프린트", material: "" }
];

// 방문 예약 시간(1시간 단위)과 시간당 출력 가능 파일 수(관리자 화면에서 조정 가능, 이 값은 기본값)
export const SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
export const DEFAULT_CAPACITY_PER_HOUR = 10;
export const MAX_FILES_PER_BOOKING = 5;
// 예약 시간 이후 몇 분이 지나면 노쇼 처리 가능
export const NO_SHOW_MINUTES = 30;

// 오늘부터 며칠 뒤까지 예약을 받을지
export const BOOKING_DAYS_AHEAD = 14;
// 예약을 받지 않는 요일 (0=일, 6=토)
export const CLOSED_WEEKDAYS = [0, 6];
// 휴관일 (YYYY-MM-DD)
export const CLOSED_DATES = ["2026-12-25", "2027-01-01"];

export const MATERIALS = ["PLA", "PETG", "TPU(유연)", "레진", "잘 모르겠음(상담 필요)"];

// 사진 1장당 최대 장수
export const MAX_PHOTOS = 3;
