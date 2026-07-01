# MYFLIX — 나만의 넷플릭스 스타일 아카이브

유튜브 링크와 사진을 넷플릭스와 비슷한 UI로 모아 보여주는 개인 아카이빙 사이트입니다.
정적 파일(HTML/CSS/JS)로만 만들어져 있어 별도 빌드 없이 GitHub Pages에 바로 올릴 수 있습니다.

## 폴더 구조

```
netflix-archive/
├─ index.html          # 메인 페이지 (넷플릭스 스타일 뷰어)
├─ admin.html           # 관리자 페이지 (콘텐츠 등록/수정/삭제)
├─ css/style.css        # 공통 스타일
├─ js/firebase-config.js  # Firebase + Cloudinary 설정 (공용)
├─ js/app.js             # 메인 페이지 로직
└─ js/admin.js           # 관리자 페이지 로직
```

## 1. Firebase 설정 (필수)

이미 코드에 Firebase 프로젝트(`site-c67b4`) 설정이 연결되어 있습니다. 아래 3가지만 Firebase 콘솔에서 설정하면 됩니다.

### 1) Firestore Database 생성
1. https://console.firebase.google.com → 해당 프로젝트 선택
2. 왼쪽 메뉴 **Firestore Database** → **데이터베이스 만들기**
3. 위치는 아무 곳이나(예: asia-northeast3) 선택, **프로덕션 모드**로 시작

### 2) Firestore 보안 규칙 설정
Firestore → 규칙(Rules) 탭에서 아래 규칙을 붙여넣고 게시하세요.
(누구나 콘텐츠를 볼 수 있지만, 로그인한 관리자만 등록/수정/삭제 가능)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /items/{itemId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 3) 관리자 계정 만들기 (Authentication)
1. 왼쪽 메뉴 **Authentication** → **Sign-in method** → **이메일/비밀번호** 사용 설정
2. **Users** 탭 → **사용자 추가** → 본인이 로그인할 이메일/비밀번호 입력
   (이 계정으로 `admin.html`에서 로그인하게 됩니다)

### 4) 승인된 도메인 등록
Authentication → Settings → **승인된 도메인**에 GitHub Pages 주소를 추가하세요.
예: `아이디.github.io`

## 2. Cloudinary 설정 (필수 확인)

코드에는 이미 다음 값이 들어가 있습니다.

- Cloud name: `dbljkloal`
- Upload preset: `Everything`

**중요:** 이 preset이 **Unsigned(서명 없음)** 모드인지 꼭 확인하세요.
Cloudinary 콘솔 → Settings → Upload → Upload presets → `Everything` 편집 →
**Signing Mode**가 `Unsigned`로 되어 있어야 브라우저에서 바로 업로드가 가능합니다.

## 3. GitHub Pages로 배포하기

1. 이 폴더(`netflix-archive` 안의 모든 파일)를 새 GitHub 저장소에 업로드
2. 저장소 **Settings → Pages**
3. **Source**를 `Deploy from a branch`로, 브랜치는 `main`(또는 사용 중인 브랜치), 폴더는 `/ (root)` 선택
4. 저장하면 몇 분 뒤 `https://아이디.github.io/저장소이름/` 주소로 사이트가 열립니다
5. 위 "1-4) 승인된 도메인"에 이 주소의 도메인(`아이디.github.io`)을 꼭 추가해야 로그인이 됩니다

## 4. 사용 방법

1. 배포된 주소로 접속 → 우측 상단 **관리자** 클릭
2. Firebase에서 만든 이메일/비밀번호로 로그인
3. **새 콘텐츠 등록**에서:
   - 제목, 카테고리(예: 여행/가족/브이로그 등 자유롭게), 설명 입력
   - 콘텐츠 유형에서 **유튜브 영상** 또는 **사진** 선택
     - 유튜브: 영상 링크 붙여넣기 (워치 URL, 단축 URL, shorts 링크 모두 지원)
     - 사진: 본문에 표시될 이미지 파일 업로드
   - **썸네일 이미지**는 모든 콘텐츠에 공통으로 필요하며, 원하는 사진을 직접 업로드
   - 메인 화면 상단 배너에 띄우고 싶다면 "메인 히어로 배너에 노출" 체크
   - 등록하기 클릭
4. 메인 페이지(`index.html`)에서 카테고리별 행, 검색, 클릭 시 재생/확대 모달을 확인할 수 있습니다

## 5. 커스터마이징 팁

- 사이트 이름(`MYFLIX`)은 `index.html`, `admin.html`의 `.nf-logo` 텍스트를 바꾸면 됩니다
- 색상(빨간 포인트 컬러 등)은 `css/style.css` 최상단 `:root` 변수(`--nf-red` 등)에서 변경 가능합니다
- 카테고리는 별도 설정 없이, 콘텐츠 등록 시 입력한 "카테고리" 값 기준으로 자동으로 행이 생성됩니다

## 문제 해결

- **콘텐츠가 안 보여요** → Firestore 규칙이 게시됐는지, 브라우저 콘솔에 에러가 없는지 확인
- **로그인이 안 돼요** → Authentication에서 이메일/비밀번호 로그인 방식이 켜져 있는지, 승인된 도메인에 배포 주소가 등록됐는지 확인
- **이미지 업로드가 안 돼요** → Cloudinary preset이 Unsigned인지 확인
