// 도메인 매칭 로직 — 부수효과 없는 순수 함수.
// 정책:
//   1) 블랙리스트 매칭 → 'suspicious' (whitelist보다 우선)
//   2) 화이트리스트 매칭 → 'official'
//   3) 어느 쪽도 매칭 안 되면 'unverified'
//
// 매칭 규칙 (whitelist·blacklist 공통):
//   - hostname 완전 일치 OR allowSubdomains=true + 서브도메인
//   - paths가 지정된 entry는 URL pathname이 prefix 중 하나로 시작해야 매칭
//   - paths 미지정 entry는 hostname 매칭만으로 충분
//
// paths가 필요한 케이스: 도메인이 임의의 사용자 콘텐츠를 호스팅하는 플랫폼.
//   - whitelist: github.com에서 /features/copilot만 공식
//   - blacklist: sites.google.com에서 /view/claudversion09만 사칭

import type {
  WhitelistEntry,
  BlacklistEntry,
  StatusResult,
} from './types';

// whitelist·blacklist 모두 갖는 매칭 필드.
type MatchableEntry = {
  domain: string;
  allowSubdomains?: boolean;
  paths?: string[];
};

export function matchDomain(
  hostname: string,
  pathname: string,
  whitelist: WhitelistEntry[],
  blacklist: BlacklistEntry[],
): StatusResult {
  const normalizedHost = hostname.toLowerCase();
  const normalizedPath = pathname || '/';

  // 블랙리스트가 우선 — 사칭으로 확인된 도메인은 화이트리스트보다 강함.
  for (const entry of blacklist) {
    if (matches(entry, normalizedHost, normalizedPath)) {
      return {
        status: 'suspicious',
        hostname: normalizedHost,
        matchedEntry: entry,
      };
    }
  }

  for (const entry of whitelist) {
    if (matches(entry, normalizedHost, normalizedPath)) {
      return {
        status: 'official',
        hostname: normalizedHost,
        matchedEntry: entry,
      };
    }
  }

  return { status: 'unverified', hostname: normalizedHost };
}

// entry 한 개에 대해 hostname + (선택적) pathname 매칭 검사.
function matches(
  entry: MatchableEntry,
  hostname: string,
  pathname: string,
): boolean {
  if (!hostnameMatches(entry, hostname)) return false;
  if (entry.paths && entry.paths.length > 0) {
    return pathMatches(pathname, entry.paths);
  }
  return true;
}

function hostnameMatches(entry: MatchableEntry, hostname: string): boolean {
  const domain = entry.domain.toLowerCase();
  if (domain === hostname) return true;
  if (entry.allowSubdomains && hostname.endsWith('.' + domain)) return true;
  return false;
}

// pathname이 paths 중 하나로 시작하는지 검사.
// "시작한다"의 정의: pathname === prefix, 또는 pathname이 (prefix + '/')로 시작.
// 이렇게 해야 '/features/copilot'은 매칭되지만 '/features/copilothelp'는 매칭 안 됨.
function pathMatches(pathname: string, paths: string[]): boolean {
  const normalized = pathname.toLowerCase();
  for (const p of paths) {
    const prefix = p.toLowerCase();
    if (normalized === prefix) return true;
    if (normalized.startsWith(prefix + '/')) return true;
  }
  return false;
}
