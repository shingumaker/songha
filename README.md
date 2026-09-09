# 즉석 디지털 프로필 만들기 (Digital ID Booth)

창의융합혁신센터 EXPO 2026 부스용 즉석 디지털 프로필 발급 앱. 원본 정적 HTML/JS 프로토타입을
React + Firebase 구조로 리팩토링했습니다.

## 스택

- [Vite](https://vitejs.dev/) + React 19 + [React Router](https://reactrouter.com/)
- [Firebase](https://firebase.google.com/) — Firestore(카드 저장, 프로필 사진 포함), Hosting(배포)

## 라우트

- `/` — 부스 발급 플로우 (유형 선택 → 정보 입력 → 사진/동의 → 발급 완료)
- `/card/:id` — 발급된 프로필을 보여주는 공개 페이지. 발급 완료 시 생성되는 URL이자, NFC 카드에
  태깅되는 링크입니다.

## 프로젝트 구조

```
src/
  context/CardContext.jsx   전체 부스 상태(단계, 입력값, 발급 로직)를 관리하는 Context
  components/
    Stepper.jsx              상단 4단계 진행 표시
    Step1Template.jsx        1단계: 명함형 / 프로필형 / 포트폴리오형 선택
    Step2Info.jsx             2단계: 이름·소속·소개·링크·프로젝트 입력
    Step3Photo.jsx            3단계: 사진 업로드 + 개인정보 동의
    Step4Done.jsx              4단계: 발급 완료 화면 (발급된 프로필 링크 포함)
    Badge.jsx                  뱃지 카드 마크업 (미리보기/공개 페이지 공용)
    BadgePreview.jsx           우측 실시간 뱃지 미리보기 (Badge + 발급 상태 표시)
  pages/
    Booth.jsx                 "/" 부스 발급 플로우 페이지
    CardView.jsx               "/card/:id" 공개 프로필 조회 페이지
  lib/firebase.js            Firebase 앱/Firestore 초기화
  App.jsx                    라우트 정의
  App.css                    원본 디자인 시스템(CSS 변수, 레이아웃) 이식
firebase.json                Hosting/Firestore 배포 설정 (SPA rewrite 포함)
firestore.rules             Firestore 보안 규칙
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
  `org`, `role`, `intro`, `contact`, `links`, `portfolio`, `photo`, `createdAt`). `/card/:id`
  페이지는 이 문서를 문서 ID로 직접 조회합니다.
- **사진**: Storage 없이, 업로드한 사진을 브라우저에서 최대 320px로 리사이즈·압축한 뒤 base64
  문자열(`photo` 필드)로 Firestore 문서에 함께 저장합니다. Firebase Storage는 Blaze(종량제)
  요금제가 있어야 활성화되는데, Firestore만으로도 이 앱 규모(작은 프로필 사진)에는 충분하고
  무료 요금제(Spark)로 계속 운영할 수 있습니다. (Firestore 문서 필드는 최대 1MiB까지 저장 가능.)
- 오프라인이거나 Firebase 프로젝트가 연결되지 않은 경우, 저장 요청은 6초 후 타임아웃되며
  화면은 "데모 모드로 진행 중" 상태로 계속 진행됩니다 — 부스 운영 중 네트워크 문제로 흐름이
  멈추지 않도록 하기 위함입니다. (이 경우 `/card/:id`는 실제로 존재하지 않으므로 접속 시
  "존재하지 않는 프로필입니다"가 표시됩니다.)
- `firestore.rules`는 전시 데모용 오픈 규칙(읽기 전체 허용, 생성만 허용, 수정/삭제 불가)입니다.
  실제 운영 전에는 인증 기반 규칙으로 교체하세요.

### 배포 (Firebase Hosting)

```bash
npm install -g firebase-tools   # 최초 1회
firebase login
firebase use --add              # 실제 Firebase 프로젝트 연결
npm run build
firebase deploy
```

`firebase.json`에 `dist` 폴더 정적 호스팅과 모든 경로를 `index.html`로 되돌리는 SPA rewrite가
이미 설정되어 있어, `/card/:id`처럼 새로고침하거나 직접 접속하는 URL도 정상 동작합니다.

## 원본 대비 변경점

- 바닐라 JS DOM 조작 → React 컴포넌트/Context 상태 관리로 전환
- `window.storage.set/list` 목업 저장소 → Firebase Firestore `setDoc` / `getCountFromServer`
- 사진 업로드 → 브라우저에서 리사이즈·압축 후 base64로 Firestore 문서에 직접 저장 (Storage 불필요,
  무료 요금제로 운영 가능)
- 발급 시 생성되던 가짜 URL 문자열 → 실제 `/card/:id` 라우트로 연결되어 카드를 조회할 수 있는
  공개 페이지 추가
- 디자인(CSS 변수, 폰트, 레이아웃)은 원본 그대로 유지
