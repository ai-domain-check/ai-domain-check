// AI Domain Check — Content Script.
// 책임:
//   1) 현재 페이지 hostname을 service worker에 전송하여 상태 조회.
//   2) 'official' 또는 'suspicious'이면 페이지 우측 상단에 shadow DOM 격리 배지 주입.
//   3) 'unverified'는 표시하지 않음 — 거의 모든 사이트가 미확인이라 노이즈 방지.
//      (미확인 상태는 향후 툴바 아이콘 색상으로만 신호)
//
// 보안 메모:
//   - closed shadow DOM 사용 → 페이지 스크립트가 host.shadowRoot로 접근 불가.
//   - 단, 사이트가 페이지 안에 가짜 "공식" UI를 그리는 위조는 완전히 막을 수 없음.
//     사용자에게는 "툴바 아이콘과 페이지 배지가 일치할 때만 신뢰" 원칙을 별도로 안내.

import type {
  CheckDomainMessage,
  StatusResult,
  DomainStatus,
  WhitelistEntry,
  BlacklistEntry,
} from '../lib/types';

const HOST_ID = 'ai-domain-check-host';

const LABELS: Record<DomainStatus, string> = {
  official: '공식',
  unverified: '미확인',
  suspicious: '사칭 의심',
};

const BADGE_STYLES = `
  .badge {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px 7px 11px;
    border-radius: 999px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.01em;
    line-height: 1;
    color: #ffffff;
    box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.08),
      0 4px 12px rgba(15, 23, 42, 0.12);
    user-select: none;
    cursor: default;
    backdrop-filter: saturate(1.1);
  }
  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #ffffff;
    display: inline-block;
    opacity: 0.9;
  }
  .badge-official {
    background: #059669;
    /* 공식 사이트는 잠깐만 확인 시켜주고 사라짐 — 콘텐츠를 가리지 않도록.
       2.5초 노출 후 0.8초에 걸쳐 부드럽게 사라짐. 툴바 아이콘은 계속 녹색 유지. */
    animation: aidc-fade-out 0.8s ease-out 2.5s forwards;
  }
  .badge-suspicious {
    background: #dc2626;
    /* 사칭 의심은 자동으로 사라지지 않음 — 사용자가 인지할 때까지 끈질기게 노출 */
  }
  .badge-unverified { background: #d97706; }

  @keyframes aidc-fade-out {
    to {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
  }
`;

// 탑 프레임에서만 실행. iframe 내부에서는 스킵.
if (window.top === window.self) {
  void init();
}

async function init(): Promise<void> {
  const hostname = window.location.hostname;
  if (!hostname) return;
  // 개발 환경 제외
  if (hostname === 'localhost' || hostname === '127.0.0.1') return;

  const msg: CheckDomainMessage = {
    type: 'check-domain',
    hostname,
    pathname: window.location.pathname,
    isReload: isPageReload(),
  };

  let result: StatusResult | null = null;
  try {
    result = (await chrome.runtime.sendMessage(msg)) as StatusResult;
  } catch (err) {
    // service worker가 깨어나는 중일 수 있음 — 조용히 종료.
    console.warn('[ai-domain-check] check-domain message failed:', err);
    return;
  }

  if (!result) return;
  // MVP: 미확인은 페이지에 표시하지 않음 (노이즈 방지).
  if (result.status === 'unverified') return;

  injectBadge(result);
}

function injectBadge(result: StatusResult): void {
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement('div');
  host.id = HOST_ID;
  // 주의: 'all:initial'은 반드시 가장 먼저 와야 함.
  // 뒤에 두면 이후 모든 속성을 초기값으로 reset해서 position:fixed가 풀려
  // 배지가 viewport 우측 상단이 아니라 페이지 흐름 끝(보통 페이지 하단)에 떨어짐.
  host.style.cssText = [
    'all:initial',
    'position:fixed',
    'top:16px',
    'right:16px',
    'z-index:2147483647',
    'pointer-events:none',
  ].join(';');

  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = BADGE_STYLES;
  shadow.appendChild(style);

  const badge = document.createElement('div');
  badge.className = `badge badge-${result.status}`;
  badge.title = makeTitle(result);

  const dot = document.createElement('span');
  dot.className = 'dot';

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = LABELS[result.status];

  badge.appendChild(dot);
  badge.appendChild(label);
  shadow.appendChild(badge);

  (document.documentElement ?? document.body).appendChild(host);
}

function makeTitle(result: StatusResult): string {
  const base = `AI Domain Check — ${LABELS[result.status]} (${result.hostname})`;
  if (result.status === 'official' && isWhitelistEntry(result.matchedEntry)) {
    return `${base}\n운영 주체: ${result.matchedEntry.publisher}`;
  }
  if (result.status === 'suspicious' && isBlacklistEntry(result.matchedEntry)) {
    const impersonates = result.matchedEntry.impersonates;
    return impersonates
      ? `${base}\n사칭 대상: ${impersonates}\n사유: ${result.matchedEntry.reasonCode}`
      : `${base}\n사유: ${result.matchedEntry.reasonCode}`;
  }
  return base;
}

function isWhitelistEntry(
  entry: WhitelistEntry | BlacklistEntry | undefined,
): entry is WhitelistEntry {
  return !!entry && 'publisher' in entry;
}

function isBlacklistEntry(
  entry: WhitelistEntry | BlacklistEntry | undefined,
): entry is BlacklistEntry {
  return !!entry && 'reasonCode' in entry;
}

// 이번 페이지 로드가 reload였는지(Cmd+R, F5, brower reload 버튼) 첫 방문이었는지 판단.
// 사용자가 reload를 했다면 "데이터를 새로 받아오라"는 명시적 신호로 해석.
function isPageReload(): boolean {
  try {
    const entries = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    return entries[0]?.type === 'reload';
  } catch {
    return false;
  }
}
