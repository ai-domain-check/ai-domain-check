// 화이트리스트·블랙리스트 fetch 및 chrome.storage 캐싱.
// 정책:
//   - 데이터는 ai-domain-check-list 레포의 GitHub raw URL에서 가져옴.
//   - chrome.storage.local에 fetchedAt 타임스탬프와 함께 저장.
//   - 네트워크 오류 시 캐시 유지 (사용자 보호 우선).

import type {
  WhitelistEntry,
  BlacklistEntry,
  Cached,
} from './types';

const WHITELIST_URL =
  'https://raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/main/whitelist.json';
const BLACKLIST_URL =
  'https://raw.githubusercontent.com/ai-domain-check/ai-domain-check-list/main/blacklist.json';

const KEY_WHITELIST = 'whitelist';
const KEY_BLACKLIST = 'blacklist';

type StoredShape = {
  whitelist?: Cached<WhitelistEntry[]>;
  blacklist?: Cached<BlacklistEntry[]>;
};

/**
 * 화이트리스트·블랙리스트를 GitHub raw에서 fetch해 chrome.storage.local에 저장.
 *
 * @param bypassCdnCache true면 URL에 타임스탬프 query를 붙여 raw.githubusercontent.com의
 *   CDN(Fastly) 캐시를 강제 우회. 사용자가 popup의 "새로고침" 버튼을 눌렀을 때처럼
 *   즉시 반영이 필요한 경우에 사용. false(기본)이면 CDN 캐시를 정상 활용 — 자동 알람·
 *   설치·브라우저 시작 시에는 이 모드로 호출해 GitHub에 부하를 덜 줌.
 */
export async function refreshLists(bypassCdnCache = false): Promise<void> {
  try {
    const suffix = bypassCdnCache ? `?t=${Date.now()}` : '';
    const [wlRes, blRes] = await Promise.all([
      fetch(WHITELIST_URL + suffix, { cache: 'no-cache' }),
      fetch(BLACKLIST_URL + suffix, { cache: 'no-cache' }),
    ]);

    if (!wlRes.ok) throw new Error(`whitelist fetch failed (${wlRes.status})`);
    if (!blRes.ok) throw new Error(`blacklist fetch failed (${blRes.status})`);

    const whitelistRaw: unknown = await wlRes.json();
    const blacklistRaw: unknown = await blRes.json();

    if (!Array.isArray(whitelistRaw) || !Array.isArray(blacklistRaw)) {
      throw new Error('expected JSON arrays from raw.githubusercontent.com');
    }

    const now = Date.now();
    const payload: StoredShape = {
      whitelist: { data: whitelistRaw as WhitelistEntry[], fetchedAt: now },
      blacklist: { data: blacklistRaw as BlacklistEntry[], fetchedAt: now },
    };

    await chrome.storage.local.set(payload);

    console.log(
      `[ai-domain-check] refreshed lists: whitelist=${whitelistRaw.length}, blacklist=${blacklistRaw.length}`,
    );
  } catch (err) {
    // 캐시는 유지하고 다음 주기에 재시도.
    console.error('[ai-domain-check] refresh failed:', err);
  }
}

export async function getLists(): Promise<{
  whitelist: WhitelistEntry[];
  blacklist: BlacklistEntry[];
  fetchedAt: number | null;
}> {
  const stored = (await chrome.storage.local.get([
    KEY_WHITELIST,
    KEY_BLACKLIST,
  ])) as StoredShape;

  return {
    whitelist: stored.whitelist?.data ?? [],
    blacklist: stored.blacklist?.data ?? [],
    fetchedAt: stored.whitelist?.fetchedAt ?? null,
  };
}
