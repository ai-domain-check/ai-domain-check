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

export async function refreshLists(): Promise<void> {
  try {
    const [wlRes, blRes] = await Promise.all([
      fetch(WHITELIST_URL, { cache: 'no-cache' }),
      fetch(BLACKLIST_URL, { cache: 'no-cache' }),
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
