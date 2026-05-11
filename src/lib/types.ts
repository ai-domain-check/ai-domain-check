// AI Domain Check — 공유 타입 정의
// background, content, popup 세 곳에서 같은 타입을 참조합니다.

export type DomainStatus = 'official' | 'suspicious' | 'unverified';

export type WhitelistCategory =
  | 'llm'
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
};

export type ForceRefreshMessage = {
  type: 'force-refresh';
};

export type ForceRefreshResponse = {
  ok: boolean;
};
