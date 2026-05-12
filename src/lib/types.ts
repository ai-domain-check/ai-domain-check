// AI Domain Check — 공유 타입 정의
// background, content, popup 세 곳에서 같은 타입을 참조합니다.

export type DomainStatus = 'official' | 'suspicious' | 'unverified';

export type WhitelistCategory =
  | 'llm'
  | 'search'
  | 'translation'
  | 'image'
  | 'audio'
  | 'video'
  | 'code'
  | 'agent'
  | 'other';

export type WhitelistEntry = {
  domain: string;
  publisher: string;
  category?: WhitelistCategory;
  allowSubdomains?: boolean;
  // 경로 prefix 목록. 지정되면 hostname 매칭 후 URL pathname이 이 중 하나로 시작해야 official.
  // 비어 있거나 미지정이면 hostname-only 매칭 (대부분의 AI 도구는 이 모드).
  // 호스트 플랫폼(github.com, notion.so 등)이 사용자 콘텐츠를 임의로 호스팅하므로,
  // 그 안의 특정 경로만 신뢰하고 싶을 때 사용.
  paths?: string[];
  evidence: string[];
  addedAt: string;
  addedBy?: string;
};

export type BlacklistReasonCode =
  | 'typosquat'
  | 'clone'
  | 'phishing'
  | 'malware'
  | 'other';

export type BlacklistEntry = {
  domain: string;
  reasonCode: BlacklistReasonCode;
  impersonates?: string;
  // 같은 캠페인 운영자가 여러 서브도메인을 동시 운영하는 경우 true.
  // 기본 false — 명시적으로 허용해야만 *.domain.com이 잡힘.
  allowSubdomains?: boolean;
  // UGC 호스팅 위의 사칭 콘텐츠를 좁혀서 차단할 때 사용 (예: sites.google.com/view/xxx).
  // 미지정/빈 배열이면 hostname 단위 차단(도메인 전체 사칭으로 간주).
  // 정상 사용자 콘텐츠까지 사칭으로 잘못 잡지 않으려면 UGC 플랫폼에 반드시 paths를 지정.
  paths?: string[];
  evidence: string[];
  addedAt: string;
  addedBy?: string;
};

export type StatusResult = {
  status: DomainStatus;
  hostname: string;
  matchedEntry?: WhitelistEntry | BlacklistEntry;
  fetchedAt?: number | null; // 마지막 화이트리스트 갱신 시각 (popup용)
};

export type Cached<T> = {
  data: T;
  fetchedAt: number; // epoch ms
};

// content script · popup ↔ service worker 메시지 프로토콜
export type CheckDomainMessage = {
  type: 'check-domain';
  hostname: string;
  pathname?: string; // 경로 기반 매칭이 필요한 엔트리(예: github.com)를 위해 함께 전송
  isReload?: boolean; // 사용자가 페이지를 reload한 경우 true — 동기 refresh 트리거
};

export type ForceRefreshMessage = {
  type: 'force-refresh';
};

export type ForceRefreshResponse = {
  ok: boolean;
};
