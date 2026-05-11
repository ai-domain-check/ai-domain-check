// AI Domain Check — Service Worker.
// 책임:
//   1) 설치/시작 시 화이트리스트·블랙리스트 즉시 fetch.
//   2) chrome.alarms로 6시간마다 자동 refresh.
//   3) content script · popup으로부터 메시지를 받아 상태 응답 / 강제 갱신.
//   4) 탭 URL 변경마다 chrome.action.setIcon으로 툴바 아이콘 색상 동기화.

import { refreshLists, getLists } from '../lib/store';
import { matchDomain } from '../lib/match';
import { setIconForTab } from './icon';
import type { IconStatus } from './icon';
import type {
  CheckDomainMessage,
  ForceRefreshMessage,
  ForceRefreshResponse,
  StatusResult,
} from '../lib/types';

const REFRESH_ALARM = 'ai-domain-check:refresh';
const REFRESH_PERIOD_MIN = 360; // 6시간

// 캐시가 이보다 오래되면 페이지 활동(message·tab 이벤트)을 계기로 백그라운드 refresh 트리거.
// stale-while-revalidate 패턴 — 응답은 캐시로 즉시 주고 fetch는 비동기.
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1시간

// 사용자 reload가 짧은 시간에 몰릴 때 GitHub 폭격 방지용 cooldown.
// 이 시간 안에 또 reload가 오면 fetch 안 하고 캐시(이미 갓 fetch된 상태)를 사용.
const RELOAD_REFRESH_COOLDOWN_MS = 10_000; // 10초

const INTERNAL_URL_RE = /^(chrome|edge|about|chrome-extension|view-source|file):/i;

// 동시 백그라운드 refresh 중복 방지용 인플라이트 guard.
let backgroundRefreshInFlight: Promise<void> | null = null;

// 마지막 reload-trigger refresh 시각 — cooldown 체크용.
let lastReloadRefreshAt = 0;

// ---------- 생명주기 ----------

// 설치·업데이트 시 즉시 refresh + 알람 등록 + 기존 탭들 아이콘 초기화.
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ai-domain-check] installed/updated');
  chrome.alarms.create(REFRESH_ALARM, {
    periodInMinutes: REFRESH_PERIOD_MIN,
  });
  void (async () => {
    await refreshLists();
    await refreshAllIcons();
  })();
});

// 브라우저 재시작 시에도 갱신 시도.
chrome.runtime.onStartup.addListener(() => {
  void (async () => {
    await refreshLists();
    await refreshAllIcons();
  })();
});

// 주기 알람 — service worker가 깨어나면서 실행.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REFRESH_ALARM) {
    void (async () => {
      await refreshLists();
      await refreshAllIcons();
    })();
  }
});

// ---------- 탭 이벤트 ----------

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // URL이 바뀌었거나 페이지 로딩이 완료된 순간에 아이콘 갱신.
  if (changeInfo.url || changeInfo.status === 'complete') {
    void updateTabIcon(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void (async () => {
    try {
      const tab = await chrome.tabs.get(tabId);
      await updateTabIcon(tabId, tab.url);
    } catch {
      // 탭이 이미 닫혔을 수 있음 — 무시.
    }
  })();
});

// ---------- 메시지 핸들러 ----------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (isCheckDomainMessage(message)) {
    void (async () => {
      // 사용자가 페이지를 reload한 경우: 응답 전에 fresh fetch까지 완료.
      // 첫 방문/탭 전환은 캐시로 즉시 응답하고 stale이면 백그라운드 갱신(SWR).
      if (message.isReload) {
        await refreshOnReload();
      }

      const { whitelist, blacklist, fetchedAt } = await getLists();
      const result: StatusResult = matchDomain(
        message.hostname,
        message.pathname ?? '/',
        whitelist,
        blacklist,
      );
      result.fetchedAt = fetchedAt;
      sendResponse(result);

      if (!message.isReload) {
        ensureFreshInBackground(fetchedAt);
      }
    })();
    return true; // 비동기 응답 알림
  }

  if (isForceRefreshMessage(message)) {
    void (async () => {
      // 사용자가 직접 누른 새로고침은 CDN 캐시까지 우회해 즉시 반영
      await refreshLists(true);
      await refreshAllIcons();
      const response: ForceRefreshResponse = { ok: true };
      sendResponse(response);
    })();
    return true;
  }

  return false;
});

// ---------- 헬퍼 ----------

async function updateTabIcon(
  tabId: number,
  url: string | undefined,
): Promise<void> {
  const { status, fetchedAt } = await statusForUrl(url);
  await setIconForTab(tabId, status);
  // 페이지 새로고침/탭 전환 등의 활동을 계기로 캐시가 오래되었으면 fresh fetch 트리거.
  ensureFreshInBackground(fetchedAt);
}

async function statusForUrl(
  url: string | undefined,
): Promise<{ status: IconStatus; fetchedAt: number | null }> {
  if (!url || INTERNAL_URL_RE.test(url)) {
    return { status: 'unsupported', fetchedAt: null };
  }

  let hostname = '';
  let pathname = '/';
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname;
    pathname = parsed.pathname || '/';
  } catch {
    return { status: 'unsupported', fetchedAt: null };
  }
  if (!hostname) return { status: 'unsupported', fetchedAt: null };

  const { whitelist, blacklist, fetchedAt } = await getLists();
  const result = matchDomain(hostname, pathname, whitelist, blacklist);
  return { status: result.status, fetchedAt };
}

function isStale(fetchedAt: number | null): boolean {
  if (fetchedAt === null) return true;
  return Date.now() - fetchedAt > STALE_THRESHOLD_MS;
}

// 캐시가 stale이면 백그라운드에서 refresh 트리거.
// 현재 요청 응답은 막지 않음(이미 캐시에서 응답한 뒤 호출되는 게 정상).
// 인플라이트 가드로 동시 호출이 와도 1회만 수행.
function ensureFreshInBackground(fetchedAt: number | null): void {
  if (!isStale(fetchedAt)) return;
  if (backgroundRefreshInFlight) return;

  backgroundRefreshInFlight = (async () => {
    try {
      await refreshLists(false);
      await refreshAllIcons();
    } catch (err) {
      console.error('[ai-domain-check] background refresh failed:', err);
    } finally {
      backgroundRefreshInFlight = null;
    }
  })();
}

// 사용자가 명시적으로 reload한 페이지에서 호출. 응답 전에 fresh fetch를 완료(또는 in-flight를 대기)하여
// 그 페이지에 그려질 배지가 최신 데이터를 반영하도록 함. 짧은 시간 다발 요청은 cooldown으로 dedup.
async function refreshOnReload(): Promise<void> {
  // 이미 다른 reload가 트리거한 fetch가 진행 중이면 그걸 기다리기만 함.
  if (backgroundRefreshInFlight) {
    try {
      await backgroundRefreshInFlight;
    } catch {
      /* refreshLists 내부에서 이미 로깅됨 */
    }
    return;
  }
  // cooldown 안이면(방금 누군가 refresh했으므로 캐시가 fresh) skip.
  if (Date.now() - lastReloadRefreshAt < RELOAD_REFRESH_COOLDOWN_MS) return;

  lastReloadRefreshAt = Date.now();
  backgroundRefreshInFlight = (async () => {
    try {
      // reload는 사용자의 명시적 "fresh 요청" 신호 — CDN 캐시까지 우회
      await refreshLists(true);
      await refreshAllIcons();
    } catch (err) {
      console.error('[ai-domain-check] reload refresh failed:', err);
    } finally {
      backgroundRefreshInFlight = null;
    }
  })();
  await backgroundRefreshInFlight;
}

async function refreshAllIcons(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.map(async (t) => {
        if (t.id !== undefined) {
          await updateTabIcon(t.id, t.url);
        }
      }),
    );
  } catch (err) {
    console.error('[ai-domain-check] refreshAllIcons failed:', err);
  }
}

function isCheckDomainMessage(msg: unknown): msg is CheckDomainMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return m.type === 'check-domain' && typeof m.hostname === 'string';
}

function isForceRefreshMessage(msg: unknown): msg is ForceRefreshMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  return (msg as Record<string, unknown>).type === 'force-refresh';
}
