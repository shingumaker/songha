// Firebase 콘솔(console.firebase.google.com) → 프로젝트 설정 → 일반 → "내 앱" 웹 앱 설정에서
// 이 6~7개 값을 그대로 복사해서 붙여넣으세요. README.md의 1~3단계를 먼저 따라 하세요.
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 관리자 화면(#admin) 진입 시 물어보는 4자리 PIN. 원하는 숫자로 바꿔도 됩니다.
// (진짜 로그인 보안이 아니라, 학생들이 실수로 들어오지 못하게 막는 정도입니다.)
export const ADMIN_PIN = "2026";
