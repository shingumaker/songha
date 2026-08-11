# 즉석 디지털 프로필 만들기 (Digital ID Booth)

창의융합혁신센터 EXPO 2026 부스용 즉석 디지털 프로필 발급 앱. 원본 정적 HTML/JS 프로토타입을
React + Firebase 구조로 리팩토링했습니다.

## 스택

- [Vite](https://vitejs.dev/) + React 19
- [Firebase](https://firebase.google.com/) — Firestore(카드 저장), Storage(프로필 사진)

## 프로젝트 구조

```
src/
  context/CardContext.jsx   전체 부스 상태(단계, 입력값, 발급 로직)를 관리하는 Context
  components/
    Stepper.jsx              상단 4단계 진행 표시
    Step1Template.jsx        1단계: 명함형 / 프로필형 / 포트폴리오형 선택
    Step2Info.jsx             2단계: 이름·소속·소개·링크·프로젝트 입력
    Step3Photo.jsx            3단계: 사진 업로드 + 개인정보 동의
    Step4Done.jsx              4단계: 발급 완료 화면
    BadgePreview.jsx           우측 실시간 뱃지 미리보기
  lib/firebase.js            Firebase 앱/Firestore/Storage 초기화
  App.jsx / App.css          레이아웃 및 원본 디자인 시스템(CSS 변수) 이식
```

## 시작하기

```bash
npm install
cp .env.example .env
```

`.env`에 Firebase 프로젝트 설정 값을 채워주세요 (Firebase Console → 프로젝트 설정 → 일반 → 웹 앱):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # oxlint
```

## Firebase 설정

- **Firestore**: `cards` 컬렉션에 발급된 프로필 카드를 저장합니다 (`id`, `template`, `name`,
  `org`, `role`, `intro`, `contact`, `links`, `portfolio`, `photoURL`, `createdAt`).
- **Storage**: 업로드한 프로필 사진을 `cards/{id}.jpg` 경로에 저장하고, 다운로드 URL을 Firestore
  문서에 함께 기록합니다.
- 오프라인이거나 Firebase 프로젝트가 연결되지 않은 경우, 저장 요청은 6초 후 타임아웃되며
  화면은 "데모 모드로 진행 중" 상태로 계속 진행됩니다 — 부스 운영 중 네트워크 문제로 흐름이
  멈추지 않도록 하기 위함입니다.
- 데모/전시 환경에서는 아래와 같은 오픈 규칙을 참고해 개발하고, 실제 운영 전 인증 기반 규칙으로
  교체하세요.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cards/{cardId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if false;
    }
  }
}
```

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /cards/{fileName} {
      allow read: if true;
      allow write: if request.resource.size < 5 * 1024 * 1024
                    && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 원본 대비 변경점

- 바닐라 JS DOM 조작 → React 컴포넌트/Context 상태 관리로 전환
- `window.storage.set/list` 목업 저장소 → Firebase Firestore `setDoc` / `getCountFromServer`
- 사진 업로드 → Firebase Storage 업로드 + 다운로드 URL 저장 (Firestore에는 URL만 기록)
- 디자인(CSS 변수, 폰트, 레이아웃)은 원본 그대로 유지
