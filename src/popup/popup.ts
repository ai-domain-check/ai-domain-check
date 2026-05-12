// AI Domain Check — Popup Script.
// 책임:
//   - 현재 활성 탭의 도메인 상태 조회 및 표시
//   - 화이트리스트/블랙리스트 매칭 시 publisher · 사유 · 증거 링크 노출
//   - 신고 버튼: ai-domain-check-list 레포에 사칭 신고 Issue 생성
//   - 새로고침 버튼: service worker에 force-refresh 요청 후 재조회
//   - 마지막 갱신 시각 표시

import type {
  CheckDomainMessage,
  ForceRefreshMessage,
  StatusResult,
  DomainStatus,
  WhitelistEntry,
  BlacklistEntry,
} from '../lib/types';

const ISSUE_URL_BASE =
  'https://github.com/ai-domain-check/ai-domain-check-list/issues/new';
const REPORT_TEMPLATE = 'domain-report.yml';
const WHITELIST_TEMPLATE = 'whitelist-request.yml';

const STATUS_LABELS: Record<DomainStatus | 'unsupported', string> = {
  official: '공식',
  unverified: '미확인',
  suspicious: '사칭 의심',
  unsupported: '확인 불가',
};

// 현재 활성 탭의 URL을 신고 폼에 prefill하기 위해 module-level에 보관.
// popup은 닫히면 인스턴스가 사라지므로 stale 위험 없음.
let currentTabUrl = '';

document.addEventListener('DOMContentLoaded', () => {
  void init();
  document
    .getElementById('refresh-btn')
    ?.addEventListener('click', () => void handleRefresh());
});

async function init(): Promise<void> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  const url = tab?.url ?? '';
  currentTabUrl = url;
  if (!url || /^(chrome|edge|about|chrome-extension|view-source|file):/i.test(url)) {
    renderUnsupported('확장프로그램이 동작할 수 있는 일반 웹페이지가 아닙니다.');
    return;
  }

  let hostname = '';
  let pathname = '/';
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname;
    pathname = parsed.pathname || '/';
  } catch {
    /* ignore */
  }

  if (!hostname) {
    renderUnsupported('도메인을 읽을 수 없습니다.');
    return;
  }

  const msg: CheckDomainMessage = { type: 'check-domain', hostname, pathname };
  try {
    const result = (await chrome.runtime.sendMessage(msg)) as StatusResult;
    renderResult(result);
  } catch (err) {
    console.error('[ai-domain-check] popup check failed:', err);
    renderUnsupported('서비스 워커 응답 실패. 잠시 후 다시 시도해주세요.');
  }
}

function renderUnsupported(message: string): void {
  setStatus('unsupported');
  setHostname('—');
  setBodyText(message);
  setNotice('', null);
  setMeta(null);
  disableReport();
}

function renderResult(result: StatusResult): void {
  setStatus(result.status);
  setHostname(result.hostname);
  setBody(buildBodyFor(result));
  setNotice(noticeFor(result.status), result.status);
  setMeta(result.fetchedAt ?? null);
  attachReportButton(result.hostname, result.status);
}

function buildBodyFor(result: StatusResult): HTMLElement[] {
  if (result.status === 'official' && isWhitelist(result.matchedEntry)) {
    const entry = result.matchedEntry;
    const rows: HTMLElement[] = [makeRow('운영 주체', entry.publisher)];
    if (entry.category) rows.push(makeChipRow('카테고리', entry.category));
    const evidence = makeEvidenceRow(entry.evidence);
    if (evidence) rows.push(evidence);
    return rows;
  }

  if (result.status === 'suspicious' && isBlacklist(result.matchedEntry)) {
    const entry = result.matchedEntry;
    const rows: HTMLElement[] = [makeChipRow('사유', entry.reasonCode)];
    if (entry.impersonates) rows.push(makeRow('사칭 대상', entry.impersonates));
    const evidence = makeEvidenceRow(entry.evidence);
    if (evidence) rows.push(evidence);
    return rows;
  }

  // unverified — 안내 텍스트 + 공식 등록 요청 인라인 링크
  const note = makeRow(
    '안내',
    '화이트리스트와 블랙리스트 어디에도 등록되지 않은 도메인입니다. 결제·로그인 시 한 번 더 확인해주세요.',
  );
  const requestLink = makeActionRow(
    '공식 사이트로 알고 계신가요?',
    '화이트리스트 등록 요청',
    () => {
      const url = buildWhitelistRequestUrl();
      void chrome.tabs.create({ url });
    },
  );
  return [note, requestLink];
}

function noticeFor(status: DomainStatus): string {
  if (status === 'suspicious') {
    return '이 도메인은 사칭으로 보고된 적이 있습니다. 결제·로그인하지 마세요.';
  }
  if (status === 'unverified') {
    return '본 도구는 사칭을 100% 막아주지 않습니다. "미확인"은 안전이 아니라 "확인 못 함"의 의미입니다.';
  }
  return '';
}

// ----- DOM helpers (innerHTML 미사용, textContent로 안전하게) -----

function setStatus(status: DomainStatus | 'unsupported'): void {
  const el = document.getElementById('status');
  if (!el) return;
  el.className = 'status ' + status;
  el.textContent = STATUS_LABELS[status];
}

function setHostname(hostname: string): void {
  const el = document.getElementById('hostname');
  if (el) el.textContent = hostname;
}

function setBody(children: HTMLElement[]): void {
  const el = document.getElementById('body');
  if (!el) return;
  el.replaceChildren(...children);
}

function setBodyText(text: string): void {
  const el = document.getElementById('body');
  if (!el) return;
  const row = makeRow('안내', text);
  el.replaceChildren(row);
}

function setNotice(text: string, status: DomainStatus | null): void {
  const el = document.getElementById('notice');
  if (!el) return;
  el.className = 'notice' + (status === 'suspicious' ? ' suspicious' : '');
  el.textContent = text;
}

function setMeta(fetchedAt: number | null): void {
  const el = document.getElementById('meta');
  if (!el) return;
  if (fetchedAt === null) {
    el.textContent = '데이터 없음';
    return;
  }
  const diffMs = Math.max(0, Date.now() - fetchedAt);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) el.textContent = '방금 갱신';
  else if (minutes < 60) el.textContent = `${minutes}분 전`;
  else el.textContent = `${Math.floor(minutes / 60)}시간 전`;
}

function makeRow(label: string, value: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'row';

  const lab = document.createElement('div');
  lab.className = 'row-label';
  lab.textContent = label;

  const val = document.createElement('div');
  val.className = 'row-value';
  val.textContent = value;

  row.append(lab, val);
  return row;
}

// 클릭 시 액션을 실행하는 인라인 링크가 있는 row. (예: "공식 등록 요청")
function makeActionRow(
  label: string,
  linkText: string,
  onClick: () => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'row';

  const lab = document.createElement('div');
  lab.className = 'row-label';
  lab.textContent = label;

  const val = document.createElement('div');
  val.className = 'row-value';

  const link = document.createElement('a');
  link.href = '#';
  link.className = 'action-link';
  link.textContent = linkText;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    onClick();
  });
  val.appendChild(link);

  row.append(lab, val);
  return row;
}

// 카테고리·reasonCode처럼 enum 값을 깔끔하게 chip으로 표시.
function makeChipRow(label: string, value: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'row';

  const lab = document.createElement('div');
  lab.className = 'row-label';
  lab.textContent = label;

  const val = document.createElement('div');
  val.className = 'row-value';

  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = value;
  val.appendChild(chip);

  row.append(lab, val);
  return row;
}

function makeEvidenceRow(urls: string[] | undefined): HTMLElement | null {
  const safe = (urls ?? []).filter(isHttpUrl);
  if (safe.length === 0) return null;

  const row = document.createElement('div');
  row.className = 'row';

  const lab = document.createElement('div');
  lab.className = 'row-label';
  lab.textContent = '증거';

  const val = document.createElement('div');
  val.className = 'row-value evidence';
  for (const url of safe) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = url;
    val.appendChild(a);
  }

  row.append(lab, val);
  return row;
}

// ----- 액션 -----

function attachReportButton(hostname: string, status: DomainStatus): void {
  const btn = document.getElementById('report-btn') as HTMLButtonElement | null;
  if (!btn) return;

  if (status === 'official') {
    btn.disabled = true;
    btn.title = '공식 도메인은 신고 대상이 아닙니다';
    btn.onclick = null;
    return;
  }

  btn.disabled = false;
  btn.title = '사칭 의심 신고 Issue 생성';
  btn.onclick = () => {
    const url = buildReportUrl(hostname);
    void chrome.tabs.create({ url });
  };
}

// GitHub Issue Template URL을 생성. domain 필드를 현재 탭의 전체 URL(경로 포함)로 prefill.
// 사용자가 직접 폼을 작성하기 전에 도메인이 미리 채워져 있어 정확한 신고가 됩니다.
function buildReportUrl(hostname: string): string {
  return buildTemplateUrl(REPORT_TEMPLATE, hostname);
}

// 미확인 상태에서 "공식 등록 요청"으로 화이트리스트 추가 요청 폼을 엽니다.
function buildWhitelistRequestUrl(): string {
  return buildTemplateUrl(WHITELIST_TEMPLATE, '');
}

function buildTemplateUrl(template: string, fallbackHostname: string): string {
  let domainValue = fallbackHostname;
  try {
    // 현재 탭 URL이 유효하면 경로 포함 형태로 — query/hash는 제거(추적 파라미터·민감정보 우려)
    const u = new URL(currentTabUrl);
    domainValue = `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    /* fallbackHostname 사용 */
  }

  const params = new URLSearchParams({
    template,
    domain: domainValue,
  });
  return `${ISSUE_URL_BASE}?${params.toString()}`;
}

function disableReport(): void {
  const btn = document.getElementById('report-btn') as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = true;
  btn.onclick = null;
}

async function handleRefresh(): Promise<void> {
  const btn = document.getElementById('refresh-btn') as HTMLButtonElement | null;
  if (btn) {
    btn.disabled = true;
    btn.textContent = '갱신 중…';
  }
  try {
    const msg: ForceRefreshMessage = { type: 'force-refresh' };
    await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.error('[ai-domain-check] force-refresh failed:', err);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '새로고침';
    }
    void init();
  }
}

// ----- type guards / 유틸 -----

function isWhitelist(
  entry: WhitelistEntry | BlacklistEntry | undefined,
): entry is WhitelistEntry {
  return !!entry && 'publisher' in entry;
}

function isBlacklist(
  entry: WhitelistEntry | BlacklistEntry | undefined,
): entry is BlacklistEntry {
  return !!entry && 'reasonCode' in entry;
}

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
