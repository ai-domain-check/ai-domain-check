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

const INTERNAL_URL_RE = /^(chrome|edge|about|chrome-extension|view-source|file):/i;

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
      const { whitelist, blacklist, fetchedAt } = await getLists();
      const result: StatusResult = matchDomain(
        message.hostname,
        message.pathname ?? '/',
        whitelist,
        blacklist,
      );
      result.fetchedAt = fetchedAt;
      sendResponse(result);
    })();
    return true; // 비동기 응답 알림
  }

  if (isForceRefreshMessage(message)) {
    void (async () => {
      await refreshLists();
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
  const status = await statusForUrl(url);
  await setIconForTab(tabId, status);
}

async function statusForUrl(url: string | undefined): Promise<IconStatus> {
  if (!url || INTERNAL_URL_RE.test(url)) return 'unsupported';

  let hostname = '';
  let pathname = '/';
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname;
    pathname = parsed.pathname || '/';
  } catch {
    return 'unsupported';
  }
  if (!hostname) return 'unsupported';

  const { whitelist, blacklist } = await getLists();
  const result = matchDomain(hostname, pathname, whitelist, blacklist);
  return result.status;
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
