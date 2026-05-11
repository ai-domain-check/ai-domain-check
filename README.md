# AI Domain Check

AI 도구 사이트에 접속할 때 화면 우측 상단에 "공식 / 미확인 / 사칭 의심" 배지를 표시해주는 크롬 확장프로그램입니다. 결제·로그인 직전에 한 번 더 확인할 수 있는 안전망을 만드는 것이 목표입니다.

## 관련 저장소

- **[`ai-domain-check/ai-domain-check`](https://github.com/ai-domain-check/ai-domain-check)** (이 저장소) — 확장프로그램 코드
- **[`ai-domain-check/ai-domain-check-list`](https://github.com/ai-domain-check/ai-domain-check-list)** — 화이트리스트·블랙리스트 데이터 (별도 저장소, 누구나 PR로 기여 가능)

확장프로그램은 다음 URL에서 데이터를 가져옵니다.

- `https://raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/main/whitelist.json`
- `https://raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/main/blacklist.json`

## 작동 방식 (예정)

1. 사용자가 AI 도구로 추정되는 사이트에 접속합니다.
2. 확장프로그램이 현재 URL의 hostname과 pathname을 공개 화이트리스트와 대조합니다.
3. 결과를 화면 우측 상단에 배지로 띄웁니다.
   - 🟢 공식: 화이트리스트에 등록된 도메인 (필요 시 경로까지)
   - 🟡 미확인: 어디에도 등록되지 않은 도메인
   - 🔴 사칭 의심: 블랙리스트에 등록되었거나 사칭 패턴이 발견된 도메인

화이트리스트는 두 가지 매칭 모드를 지원합니다.

- **hostname-only** (기본): 전용 AI 도구 도메인용. 예: `chatgpt.com` → 모든 경로가 공식.
- **hostname + paths**: 사용자 콘텐츠 호스팅 플랫폼 안의 특정 제품만 신뢰. 예: `github.com`은 `/features/copilot`, `/settings/copilot`만 녹색이고, 사용자 임의 레포(`github.com/anyone/repo`)는 미확인.

화이트리스트는 별도의 GitHub 공개 저장소에서 운영하며, 누구나 PR로 추가·수정에 기여할 수 있도록 할 계획입니다.

## 폴더 구조

```
ai-domain-check/
├── manifest.json         # MV3 매니페스트 (dist/ 경로를 참조)
├── package.json          # npm 스크립트 + devDependencies
├── tsconfig.json         # TypeScript 설정 (strict)
├── src/                  # TypeScript 소스
│   ├── background/       # 화이트리스트 fetch + 캐싱 (service worker)
│   ├── content/          # 페이지에 배지 주입
│   └── popup/            # 배지 클릭 시 상세 패널
├── dist/                 # 빌드 산출물 (gitignore, manifest가 참조)
├── data/                 # 로컬 캐시·스키마 참조용
└── icons/                # 16/48/128 아이콘
```

화이트리스트·블랙리스트 데이터 자체는 별도 저장소(`ai-domain-check-list`)에서 관리되며, 확장프로그램은 GitHub raw URL로 가져와 `chrome.storage.local`에 캐싱합니다.

## 기술 선택

- Manifest V3 + TypeScript (strict)
- 빌드: esbuild (bundle, target=chrome120). 빌드 결과는 `dist/`로 출력되며 매니페스트가 이 경로를 참조합니다.
- 타입 검사: `tsc --noEmit` (esbuild는 타입을 검사하지 않으므로 분리 운용)
- 화이트리스트는 GitHub raw URL에서 fetch 후 `chrome.storage.local`에 캐싱

## 설치 (개발용)

```bash
# 1. 의존성 설치
npm install

# 2. 빌드 (또는 개발 중에는 npm run watch)
npm run build

# 3. (선택) 타입 검사
npm run type-check
```

이후 Chrome에서:
1. 주소창에 `chrome://extensions` 입력
2. 우측 상단 "개발자 모드" 토글을 켭니다
3. "압축 해제된 확장 프로그램 로드" 버튼을 누릅니다
4. 이 폴더(`ai-domain-check/`)를 선택합니다

현재는 골격만 있어 로드해도 화면에 표시되는 것은 없습니다.

## 한계와 운영 원칙

이 확장프로그램은 사칭을 100% 막아주는 도구가 아닙니다. 결제·로그인 직전에 한 번 더 멈칫할 단서를 주는 것이 본 도구의 역할입니다. 알려진 한계를 정직하게 공개합니다.

**1. 신호의 진짜 출처는 툴바 아이콘입니다**

본 확장프로그램의 신호는 두 곳에 동시에 표시됩니다.

- **툴바 아이콘 색상 (진짜 신호)** — 브라우저 자체가 그리므로 어떤 사이트도 위조할 수 없습니다.
- **페이지 우측 상단의 인앱 배지 (보조 신호)** — 시인성을 위해 shadow DOM으로 격리해 띄웁니다.

두 신호가 다를 경우 **툴바 아이콘을 우선 신뢰해주세요.** 사이트가 페이지 안에 가짜 "공식 인증" UI를 직접 그릴 수 있지만, 툴바 아이콘은 사이트가 건드릴 수 없습니다.

**2. 합법 호스팅 위의 사칭 페이지는 노란색으로 표시됩니다**

`xxx.notion.site`, `xxx.vercel.app` 같은 정당한 호스팅 플랫폼 위에 사칭 페이지가 올라간 경우, 화이트리스트가 완전 일치를 요구하므로 자동으로 노란색(미확인)으로 떨어집니다. 빨간색(사칭 의심)으로 자동 분류되지는 않으므로 노란색을 진지하게 받아들여주세요.

**3. 새로운 사칭 도메인은 일단 노란색입니다**

화이트리스트에도 블랙리스트에도 등록되지 않은 신규 도메인은 미확인으로 표시됩니다. 결제나 로그인 시 노란색은 "안전"이 아니라 "확인 못 함"의 의미입니다.

**4. 본 도구가 감지하지 못하는 영역**

- 공식 사이트 자체가 침해된 경우(서버 해킹, DNS 하이재킹 등)
- 합법 호스팅 위 사칭 페이지의 자동 빨간색 분류 (휴리스틱은 v2 예정)
- 브라우저 외부의 공격 (피싱 메일, 가짜 모바일 앱 등)

**5. 화이트리스트 운영 자체의 무결성**

악의적 PR과 메인테이너 계정 탈취를 방지하기 위해 다음을 적용합니다.

- 화이트리스트 추가 시 공식 발표·DNS 레코드 등 출처 증명 요구
- 메인테이너 2인 이상 승인
- main 브랜치 보호 + signed commits + 2FA 의무

## 진행 상태

- [x] 프로젝트 골격 (폴더 구조, manifest, README)
- [x] 화이트리스트 저장소 분리 (`ai-domain-check-list`)
- [x] 도메인 판정 로직 (background service worker, fetch + 6시간 알람 + 메시지 핸들러)
- [x] 배지 UI (content script + closed shadow DOM, official/suspicious만 표시)
- [x] 상세 패널 (popup HTML + JS, 신고/새로고침 버튼, 증거 링크)
- [x] 툴바 아이콘 색상 동기화 (OffscreenCanvas로 임시 원 아이콘, 4가지 상태)
- [ ] 아이콘 디자인 (16/48/128 PNG, OffscreenCanvas 임시 아이콘 교체)
- [ ] 사용자 신고 기능
- [ ] Chrome Web Store 등록

## 라이선스 / 기여

추후 정식 공개 시점에 라이선스와 기여 가이드를 추가할 예정입니다.
