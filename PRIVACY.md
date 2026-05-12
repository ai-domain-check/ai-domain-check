# 개인정보 처리방침 — AI Domain Check

**최종 업데이트**: 2026-05-12

본 크롬 확장프로그램(이하 "본 도구")이 사용자 데이터를 어떻게 다루는지 정직하게 설명합니다.

## 한 줄 요약

**본 도구는 사용자의 어떤 개인정보도 수집하지 않으며, 외부 서버로 전송하지 않습니다.**

---

## 본 도구가 하는 일

본 도구는 사용자가 방문 중인 웹사이트의 도메인(예: `chatgpt.com`)을 공개 화이트리스트·블랙리스트와 대조하여, 그 사이트가 AI 도구의 공식 도메인인지 또는 사칭으로 알려진 도메인인지 화면에 배지로 표시합니다.

## 수집하지 않는 정보

다음 정보는 어떤 식으로도 **수집·저장·전송하지 않습니다**:

- 이름, 이메일, 전화번호 등 개인 식별 정보
- 방문 기록 (어떤 사이트를 언제 방문했는지)
- 검색어, 입력 내용
- 페이지 콘텐츠
- 결제·금융 정보
- IP 주소 (본 도구가 별도로 수집하지 않음)
- 쿠키
- 광고 식별자

본 도구는 자체 서버를 운영하지 않으며, 사용자 데이터를 송신할 백엔드 자체가 존재하지 않습니다.

## 로컬에 저장되는 정보

브라우저 안(`chrome.storage.local`)에 다음 정보만 저장됩니다.

- **화이트리스트·블랙리스트 데이터** — 공개 GitHub raw URL에서 가져온 도메인 목록과 마지막 갱신 시각
- 사용자별 식별 정보는 일절 포함되지 않습니다

이 데이터는 본 도구가 동작하기 위한 캐시이며, 사용자의 브라우저 밖으로 나가지 않습니다. 확장프로그램을 제거하면 함께 삭제됩니다.

## 외부와 주고받는 통신

본 도구는 단 하나의 외부 URL에만 접근합니다.

- `https://raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/main/whitelist.json`
- `https://raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/main/blacklist.json`

**오로지 데이터를 가져오기(GET 요청)만** 하며, 어떤 정보도 전송하지 않습니다. 사용자가 방문하는 일반 웹사이트와는 통신하지 않습니다.

GitHub의 raw 콘텐츠 서비스에 접근할 때 GitHub이 표준 HTTP 로깅(IP, User-Agent 등)을 할 수 있는데, 이는 GitHub의 [개인정보 처리방침](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement)을 따르며 본 도구가 통제하지 못하는 영역입니다.

## 권한 사용 사유

| 권한 | 사용 사유 |
|---|---|
| `storage` | 화이트리스트·블랙리스트 데이터를 `chrome.storage.local`에 캐싱 |
| `alarms` | 6시간 주기로 백그라운드에서 데이터 갱신 |
| `tabs` | 현재 탭의 URL(hostname·pathname)을 읽어 도메인 상태 판정 |
| `host_permissions` (`raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/*`) | 위 단일 경로에서 화이트리스트·블랙리스트 JSON fetch. **다른 어떤 URL에도 접근할 수 없습니다.** |
| `content_scripts` (`<all_urls>`) | 사용자가 방문 중인 페이지에 도메인 상태 배지를 주입. **페이지 내용을 읽거나 외부로 전송하지 않습니다.** |

## 본 도구가 사칭을 100% 막아주지 않는다는 점

본 도구는 결제·로그인 직전에 "한 번 더 의심하게 만드는 마찰"이지, 모든 사칭 사이트를 차단하는 도구가 아닙니다. 자세한 한계는 [확장프로그램 README](https://github.com/ai-domain-check/ai-domain-check#한계--이건-100-막아주지-않습니다)를 참고해주세요.

## 데이터 공유

본 도구는 사용자 데이터를 어떤 제3자에게도 공유하지 않습니다. 공유할 데이터 자체가 없습니다.

## 어린이 개인정보

본 도구는 13세 미만 어린이로부터 어떤 정보도 수집하지 않습니다.

## 변경 사항

본 처리방침이 변경되면 본 문서의 "최종 업데이트" 날짜가 갱신되고, 중요한 변경은 확장프로그램 업데이트 노트와 GitHub 저장소 commit history에 명시됩니다.

## 소스 공개

본 도구의 모든 소스코드는 다음 저장소에서 공개되어 누구나 검증할 수 있습니다.

- 확장프로그램: https://github.com/ai-domain-check/ai-domain-check
- 데이터(화이트리스트·블랙리스트): https://github.com/ai-domain-check/ai-domain-check-list

## 문의

처리방침이나 데이터 처리에 대해 문의가 있으시면 확장프로그램 저장소에 [이슈](https://github.com/ai-domain-check/ai-domain-check/issues/new)로 남겨주세요.

---

# Privacy Policy — AI Domain Check (English)

**Last updated**: 2026-05-12

## TL;DR

**This extension does not collect, store, or transmit any personal data.**

## What this extension does

It compares the domain of the website you're currently visiting (e.g., `chatgpt.com`) against a public whitelist/blacklist, then displays a badge indicating whether the site is verified as an official AI tool's domain or known as an impersonation.

## What it does NOT collect

The following are never collected, stored, or transmitted:

- Personally identifying information (name, email, phone)
- Browsing history (which sites you visit and when)
- Search queries or input
- Page content
- Payment or financial information
- IP address (we don't collect it)
- Cookies
- Advertising identifiers

This extension does not operate any backend server. There is no infrastructure to which user data could be sent.

## What is stored locally

Only in your browser (`chrome.storage.local`):

- The whitelist/blacklist data fetched from a public GitHub URL, plus the last refresh timestamp.

No user-identifying information is included. Data stays in your browser and is removed when you uninstall the extension.

## External requests

The extension accesses only these two URLs:

- `https://raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/main/whitelist.json`
- `https://raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/main/blacklist.json`

These are **read-only GET requests**. No data is transmitted from your browser to any server. The extension does not communicate with the websites you visit.

GitHub may log standard HTTP request metadata (IP, User-Agent) per [their privacy policy](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement), which is outside our control.

## Permission justifications

| Permission | Why |
|---|---|
| `storage` | Caches whitelist/blacklist in `chrome.storage.local` |
| `alarms` | Refreshes data in the background every 6 hours |
| `tabs` | Reads the current tab's URL (hostname/pathname) for status check |
| `host_permissions` (`raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/*`) | Fetches public whitelist/blacklist JSON. **No other URL is accessible.** |
| `content_scripts` (`<all_urls>`) | Injects the status badge into the page. **Does not read or transmit page content.** |

## Not a guarantee against impersonation

This tool is friction at the moment of payment/login, not a complete impersonation blocker. See [README](https://github.com/ai-domain-check/ai-domain-check#한계--이건-100-막아주지-않습니다) for limitations.

## Data sharing

We do not share any user data with any third party. There is no data to share.

## Children's data

We do not collect any data from children under 13.

## Changes

Changes to this policy are reflected in the "Last updated" date and in the GitHub commit history.

## Open source

All source code is open:

- Extension: https://github.com/ai-domain-check/ai-domain-check
- Data: https://github.com/ai-domain-check/ai-domain-check-list

## Contact

Open an [issue](https://github.com/ai-domain-check/ai-domain-check/issues/new) on the extension repository for questions.
