# AI Domain Check

AI 도구 사칭 사이트를 결제·로그인 직전에 한 번 더 의심하게 만드는 크롬 확장프로그램입니다.

| 배지 | 의미 | 색상 |
|---|---|---|
| ✓ 공식 | 검증된 AI 도구 도메인 | 🟢 녹색 |
| ? 미확인 | 화이트리스트에 없는 일반 도메인 | 🟡 amber |
| ! 사칭 의심 | 사칭으로 신고·확인된 도메인 | 🔴 빨강 |

툴바 아이콘과 페이지 우측 상단 배지에 동시 표시됩니다.

---

## 설치

> Chrome Web Store 등록은 진행 중입니다. 그 전엔 개발자 모드로 직접 로드해주세요.

```bash
git clone https://github.com/ai-domain-check/ai-domain-check.git
cd ai-domain-check
npm install
npm run build
```

이후 Chrome에서:

1. `chrome://extensions` 접속
2. 우측 상단 **개발자 모드** ON
3. **압축 해제된 확장 프로그램 로드** 클릭
4. `ai-domain-check/` 폴더 선택

---

## 어떻게 동작하나요?

```
사용자가 사이트 방문
     ↓
확장프로그램이 현재 URL을 공개 데이터베이스와 대조
     ↓
hostname + (필요 시) pathname 매칭
     ↓
배지 표시 (공식 / 미확인 / 사칭 의심)
```

데이터베이스는 [`ai-domain-check-list`](https://github.com/ai-domain-check/ai-domain-check-list) 저장소에 공개되어 있고, 누구나 PR로 기여할 수 있습니다.

---

## 한계 — 이건 100% 막아주지 않습니다

본 도구는 "사칭을 차단"하는 게 아니라 "**결제·로그인 직전 한 번 더 의심하게 만드는 마찰**"입니다.

**알아두실 점:**

- **툴바 아이콘이 진짜 신호입니다.** 페이지 안의 배지는 사이트가 가짜로 그릴 수 있지만 툴바 아이콘은 못 건드립니다. **두 신호가 다르면 툴바를 신뢰하세요.**
- **새로운 사칭 도메인은 일단 노란색입니다.** 화이트리스트·블랙리스트 어디에도 없으면 미확인 처리. 노란색은 "안전"이 아니라 **"확인 못 함"** 입니다.
- **본 도구가 감지하지 못하는 것** — 공식 사이트 자체의 해킹, DNS 하이재킹, 이메일·메신저 피싱, 가짜 모바일 앱

이런 한계를 알고 도구를 사용하시는 게 가장 안전합니다.

---

## 사칭 사이트를 발견하셨다면

popup의 **신고** 버튼 → 자동으로 신고 폼이 열립니다.

또는 직접:
[**사칭 도메인 신고하기**](https://github.com/ai-domain-check/ai-domain-check-list/issues/new?template=domain-report.yml)

---

<details>
<summary><strong>개발자 가이드 (빌드·기여)</strong></summary>

### 폴더 구조

```
ai-domain-check/
├── manifest.json         # MV3 매니페스트
├── package.json
├── tsconfig.json
├── src/
│   ├── lib/              # 공유 타입·매칭 로직·캐싱
│   ├── background/       # service worker (fetch, 아이콘)
│   ├── content/          # 페이지 배지 (shadow DOM)
│   └── popup/            # 클릭 시 상세 패널
├── dist/                 # 빌드 산출물 (gitignore)
└── icons/                # 브랜드 아이콘 16/32/48/128
```

### 빌드

```bash
npm install
npm run build       # 또는 npm run watch (auto-rebuild)
npm run type-check  # 타입 검사 분리 실행
```

빌드 산출물은 `dist/`로 출력되며 manifest.json이 이 경로를 참조합니다.

### 기술 스택

- Manifest V3 + TypeScript (strict)
- esbuild (번들), tsc (타입 검사)
- 화이트리스트·블랙리스트 데이터: GitHub raw URL → `chrome.storage.local` 캐싱 (6시간 주기)

</details>

<details>
<summary><strong>운영자 메모 — 위협 모델</strong></summary>

### 핵심 가정

- **사용자 콘텐츠 호스팅 플랫폼**(github.com, sites.google.com 등)은 hostname-only 매칭이 위험합니다. 사칭이 그 안에 페이지를 만들 수 있으므로 `paths`로 좁힙니다.
- **공식 사이트가 침해된 경우**는 우리 도구의 범위 밖입니다.
- **시그널 이중 표시** — 페이지 안 배지(사이트가 흉내 가능) + 툴바 아이콘(브라우저 chrome이 그림). 사용자에게 "둘이 다르면 툴바 신뢰" 안내.

### 화이트리스트 운영 무결성

악의적 PR과 메인테이너 계정 탈취를 방지하려면:

- 추가 시 공식 announcement·DNS 등 출처 증명 요구
- 메인테이너 2인 이상 승인
- main 브랜치 보호 + signed commits + 2FA

</details>

---

## 라이선스 / 기여

정식 공개 시점에 추가됩니다.
