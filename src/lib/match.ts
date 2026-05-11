// 도메인 매칭 로직 — 부수효과 없는 순수 함수.
// 정책:
//   1) 블랙리스트 완전 일치 → 'suspicious' (hostname만 검사, path 무관)
//   2) 화이트리스트 hostname 매칭 + paths가 지정된 경우 경로 prefix도 일치해야 함 → 'official'
//      - paths 미지정/빈 배열 → hostname만 검사 (대부분의 AI 도구 entry)
//      - paths 지정 → github.com처럼 사용자 콘텐츠 플랫폼의 일부만 신뢰할 때
//   3) allowSubdomains=true면 서브도메인도 hostname 매칭 통과 (paths 규칙은 그대로 적용)
//   4) 어디에도 없으면 'unverified'

import type {
  WhitelistEntry,
  BlacklistEntry,
  StatusResult,
} from './types';

export function matchDomain(
  hostname: string,
  pathname: string,
  whitelist: WhitelistEntry[],
  blacklist: BlacklistEntry[],
): StatusResult {
  const normalizedHost = hostname.toLowerCase();
  const normalizedPath = pathname || '/';

  // 블랙리스트 우선 — 호스트네임 완전 일치만 검사 (경로 무관, 도메인 전체 차단 의도)
  for (const entry of blacklist) {
    if (entry.domain.toLowerCase() === normalizedHost) {
      return {
        status: 'suspicious',
        hostname: normalizedHost,
        matchedEntry: entry,
      };
    }
  }

  // 화이트리스트 — hostname + (선택적) paths
  for (const entry of whitelist) {
    if (!hostnameMatches(entry, normalizedHost)) continue;

    // paths가 지정되어 있으면 pathname이 적어도 하나의 prefix로 시작해야 함
    if (entry.paths && entry.paths.length > 0) {
      if (!pathMatches(normalizedPath, entry.paths)) continue;
    }

    return {
      status: 'official',
      hostname: normalizedHost,
      matchedEntry: entry,
    };
  }

  return { status: 'unverified', hostname: normalizedHost };
}

function hostnameMatches(entry: WhitelistEntry, hostname: string): boolean {
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
