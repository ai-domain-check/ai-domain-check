# Chrome Web Store 제출 가이드

이 문서는 Chrome Web Store 개발자 대시보드 양식에 그대로 복사·붙여넣기 위한 카피와 절차 안내입니다. 사용자에게 노출되지 않습니다.

---

## 1. 짧은 설명 (Short description)

**한국어** (132자 이내):
> AI 도구 사칭 사이트를 즉시 식별. 결제·로그인 직전에 공식 도메인인지 한눈에 확인하세요.

**English** (132 chars max):
> Spot fake AI tool sites instantly. Get a one-glance signal whether you're on the official domain before payment or login.

---

## 2. 자세한 설명 (Detailed description)

**한국어:**

```
AI 도구 사칭 사이트로 인한 피해를 줄이기 위한 크롬 확장프로그램입니다.

ChatGPT, Claude, Gemini, Midjourney 같은 유명 AI 도구를 사칭한 가짜 사이트들이 검색 광고와 SNS를 통해 빠르게 확산되고 있습니다. 본 확장프로그램은 사용자가 결제·로그인 직전에 "지금 보고 있는 사이트가 진짜 공식인지" 한 번 더 확인할 수 있는 시각 신호를 제공합니다.

[작동 방식]

웹사이트에 접속하면 확장프로그램이 현재 도메인을 공개 화이트리스트·블랙리스트와 대조해 다음 세 가지 상태로 표시합니다.

🟢 공식 — 검증된 AI 도구의 공식 도메인
🟡 미확인 — 등록되지 않은 일반 도메인. 결제·로그인 시 한 번 더 확인 필요
🔴 사칭 의심 — 사칭으로 신고·확인된 도메인

신호는 두 곳에 동시에 표시됩니다. 페이지 우측 상단의 배지와 브라우저 툴바의 확장프로그램 아이콘. 둘이 다르면 툴바 아이콘을 신뢰하세요(사이트가 페이지 내 배지를 위조할 수는 있어도 툴바 아이콘은 건드릴 수 없습니다).

[개인정보 수집 없음]

본 도구는 사용자의 어떤 개인정보도 수집하지 않습니다. 방문 기록·검색어·페이지 내용·IP 모두 수집하지 않으며, 외부 서버를 운영하지도 않습니다. 화이트리스트·블랙리스트 데이터를 공개 GitHub 저장소에서 가져오는 GET 요청만 발생합니다. 자세한 내용은 개인정보 처리방침을 참고해주세요.

[공개 데이터베이스]

화이트리스트·블랙리스트는 GitHub 공개 저장소에서 운영되며 누구나 PR로 기여할 수 있습니다. 사칭 사이트를 발견하시면 확장프로그램 popup의 신고 버튼으로 바로 등록할 수 있습니다.

[솔직한 한계]

본 도구는 사칭을 100% 막아주지 않습니다. "결제·로그인 직전 한 번 더 의심하게 만드는 마찰"이 본 도구의 역할입니다. 새로 등장한 사칭 도메인은 아직 데이터베이스에 없을 가능성이 높으니 "미확인(노란색)"을 진지하게 받아들여주세요.

[오픈소스]

소스코드 전부 공개되어 누구나 검증 가능합니다.
- 확장프로그램: https://github.com/ai-domain-check/ai-domain-check
- 데이터: https://github.com/ai-domain-check/ai-domain-check-list
```

**English:**

```
A Chrome extension that helps reduce harm from fake AI tool websites.

Phishing sites impersonating popular AI tools like ChatGPT, Claude, Gemini, and Midjourney are rapidly spreading through search ads and social media. This extension provides a visual signal so you can verify whether you're on the official domain — right before you pay or log in.

[How it works]

When you visit a website, the extension compares the current domain against a public whitelist/blacklist and shows one of three states:

🟢 Official — Verified official domain of an AI tool
🟡 Unverified — An unregistered domain. Double-check before payment/login.
🔴 Suspicious — Reported or confirmed as impersonation

The signal appears in two places at once: a badge at the top-right of the page, and the extension icon in the browser toolbar. If the two disagree, trust the toolbar icon — sites can fake an in-page badge but cannot touch the toolbar.

[No data collection]

This extension does not collect any personal information. No browsing history, no search queries, no page content, no IP. We do not operate any backend server. The only network requests are GET requests to fetch the whitelist/blacklist from a public GitHub repository. See the privacy policy for details.

[Public database]

The whitelist/blacklist is maintained in a public GitHub repository where anyone can contribute via pull requests. If you find a phishing site, you can report it directly from the extension's popup.

[Honest limitations]

This tool does not catch every impersonation. Its role is "one more moment of doubt before payment or login." Newly created phishing domains may not be in the database yet, so take a yellow "Unverified" signal seriously.

[Open source]

All source code is open and verifiable.
- Extension: https://github.com/ai-domain-check/ai-domain-check
- Data: https://github.com/ai-domain-check/ai-domain-check-list
```

---

## 3. 카테고리

대시보드 양식에서 선택:
- **Primary category**: `Productivity` 또는 `Workflow & Planning`
- **Secondary category** (있다면): `Developer Tools`

---

## 4. 언어

- **Primary language**: Korean (한국어)
- Add English as additional language with translated description

---

## 5. 단일 목적 선언 (Single Purpose)

```
Verifies whether a website is the official site of a known AI tool by checking the domain (and optionally the URL path) against a publicly maintained whitelist and blacklist, then displays a visual badge indicating the status.
```

---

## 6. 권한별 사유 (Permission justifications)

대시보드의 "Permission justifications" 양식에 각 권한에 대해 짧은 영문 사유 입력:

**`storage`:**
```
Caches the whitelist and blacklist locally in chrome.storage.local to avoid repeated network requests on every page load.
```

**`alarms`:**
```
Schedules a periodic background refresh of the whitelist/blacklist every 6 hours to keep the data current without user intervention.
```

**`tabs`:**
```
Reads the URL of the currently active tab to determine the domain's verification status and to update the toolbar icon per tab. The URL is processed in-memory only and never transmitted to any external server.
```

**`host_permissions` (`https://raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/*`):**
```
Fetches the public whitelist.json and blacklist.json files maintained by this project on GitHub. The extension makes read-only GET requests to this exact path and no other URL.
```

**`<all_urls>` content scripts:**
```
Injects a status badge (inside a closed shadow DOM) into the top-right corner of any web page so users see the verification result without clicking the extension icon. The content script does not read page contents or transmit any data.
```

---

## 7. 개인정보 처리방침 URL

`PRIVACY.md`를 GitHub Pages 또는 raw.githubusercontent.com URL로 호스팅한 뒤 그 URL을 입력.

**가장 빠른 방법** — GitHub의 raw URL을 그대로 사용:
```
https://raw.githubusercontent.com/ai-domain-check/ai-domain-check/main/PRIVACY.md
```

또는 더 깔끔하게 — GitHub Pages 활성화 후:
```
https://ai-domain-check.github.io/ai-domain-check/PRIVACY.html
```

(GitHub Pages 활성화는 Settings → Pages → Source: `main` branch / `/` root)

MVP 단계에선 raw URL로 충분합니다.

---

## 8. 스크린샷 가이드

**필요 개수**: 1~5장
**규격**: 1280x800 또는 640x400 (1280x800 권장)
**형식**: PNG 또는 JPG

**촬영 권장 시나리오:**

1. **🟢 공식 사이트 visit** — `chatgpt.com` 방문, 페이지 우측 상단에 녹색 "공식" 배지가 보이는 전체 화면 캡처
2. **popup 열린 상태 — 공식** — 위 화면에서 툴바 아이콘 클릭한 popup이 함께 보이게
3. **🟡 미확인 사이트 visit + popup** — 임의 사이트(예: 본인 블로그)에서 amber 배지·툴바 아이콘 표시
4. **🔴 사칭 의심 popup** — `sites.google.com/view/claudversion09` 방문 시 빨간 배지 + popup (이번 첫 blacklist entry 활용)
5. **데이터 흐름 다이어그램** — 옵션. 사용자 → 확장프로그램 → GitHub raw URL → chrome.storage → 배지 표시 흐름을 보여주는 인포그래픽

**캡처 방법 (Mac):**
- `Cmd+Shift+4` → 영역 드래그
- 또는 `Cmd+Shift+5` → 전체화면/창/영역 선택
- 1280x800에 맞게 크롭

**팁:**
- 화면을 깨끗하게 (시크릿 모드 추천 — 북마크바·다른 탭 노출 안 됨)
- 브라우저 zoom 100% 유지
- popup 캡처 시 배경이 보이도록 빈 새 탭 위에서

---

## 9. 프로모션 이미지 (선택이지만 검색 노출 영향)

| 사이즈 | 용도 |
|---|---|
| 440x280 | Chrome Web Store 검색 결과 카드 |
| 920x680 | (선택) 큰 카드 |
| 1400x560 | (선택) 마키 — 메인 페이지 노출 시 |

가장 작은 440x280만 만들어도 충분합니다. Figma에서 텍스트 + 아이콘 + 색상 그라데이션으로 만들면 30분 안에 가능.

---

## 10. 패키징 — zip 파일 만들기

빌드 후 다음 파일·폴더만 zip에 포함하면 됩니다.

```bash
cd "/Users/jigiyeok/Documents/Claude/Projects/AI 도구 관련 블로그 운영/ai-domain-check"

# 1. 최신 빌드
npm run build

# 2. zip 생성 (필요한 것만 포함)
zip -r ../ai-domain-check-v1.0.0.zip \
  manifest.json \
  icons \
  dist \
  src/popup/popup.html \
  -x "*.DS_Store"
```

**포함됨**: manifest.json, icons/, dist/ (빌드된 JS), src/popup/popup.html (HTML은 빌드되지 않음)

**제외됨**: node_modules/, src/(TypeScript), scripts/, package.json, README.md, .git/

생성된 `ai-domain-check-v1.0.0.zip`을 대시보드에 업로드.

---

## 11. 제출 절차

1. **개발자 계정 등록**: https://chrome.google.com/webstore/devconsole 접속 → 일회성 $5 결제
2. **새 항목 추가**: 대시보드에서 "New item" 클릭 → 위에서 만든 zip 업로드
3. **스토어 등록 정보 입력**:
   - 위 카피 복사·붙여넣기
   - 스크린샷 업로드
   - 카테고리·언어 선택
   - 개인정보 처리방침 URL 입력
4. **개인정보 처리 정보 (Privacy practices)** 양식:
   - 단일 목적 선언 입력
   - 각 권한 사유 입력
   - "Do you collect or use any of the following user data?" → 모두 No
5. **결제 옵션**: 무료
6. **검토 제출**: "Submit for review" 클릭

---

## 12. 검토 후 예상 시나리오

**평균 검토 시간**: 1~3일 (간단한 경우), 1~2주 (민감 권한 검토 필요한 경우)

본 확장프로그램은 `tabs` + `<all_urls>` 콘텐츠 스크립트를 사용하므로 **상세 검토 대상**일 가능성이 높습니다.

**자주 발생하는 거부 사유와 대응:**

- "권한 사용 사유 불명확" → 위 권한별 사유 카피 그대로 사용하면 대부분 통과
- "개인정보 처리방침 누락·접근 불가" → URL이 공개되어 있고 응답하는지 확인
- "단일 목적 위반" → 우리는 명확하니 거의 발생 안 함
- "아이콘 품질 / 스토어 가이드 위반" → 아이콘이 너무 단순하거나 다른 브랜드와 유사한 경우. 거부되면 디자인 보강 후 재제출
- "기능 설명과 실제 동작 불일치" → 스토어 설명에 적은 기능이 실제로 동작하는지 검토자가 테스트

**거부될 경우**:
- 거부 사유는 이메일로 옴
- 수정 후 같은 zip을 새 버전(1.0.1)으로 업로드하여 재제출
- 보통 두 번째 제출은 더 빠름

---

## 13. 출시 후 할 일

1. **블로그 글로 출시 알리기** — "왜 만들었나, 어떻게 동작하나, 한계는?" 정직한 톤으로
2. **첫 사용자 피드백 수집** — popup의 신고 버튼이 실제로 사용되는지, GitHub issue가 들어오는지
3. **whitelist 확장** — 처음엔 14개로 작게 시작했지만 사용자 요청 들어오는 대로 추가
4. **디자인된 아이콘으로 교체** — Figma 작업 후 PNG 교체, 다음 버전(1.0.1)으로 업로드
5. **버전 관리** — 모든 코드 변경은 manifest.json의 version 증가 + zip 재업로드 필요
