// AI Domain Check — 툴바 액션 아이콘 그리기.
//
// chrome.action.setIcon은 PNG 파일 경로 또는 ImageData를 받습니다.
// MVP 단계에서는 PNG 디자인 자산이 없으므로 OffscreenCanvas로
// 상태별 색상 원 + 의미 심볼(체크/느낌표/물음표)을 즉석에서 그려 ImageData로 넘깁니다.
// 색맹 사용자나 흑백 환경에서도 모양으로 의미가 전달되도록 색 + 심볼 이중 표현.
// 추후 디자인된 PNG가 도착하면 이 모듈을 PNG 로딩 방식으로 교체.

import type { DomainStatus } from '../lib/types';

export type IconStatus = DomainStatus | 'unsupported';

const ICON_COLORS: Record<IconStatus, string> = {
  official: '#059669',
  suspicious: '#dc2626',
  unverified: '#d97706',
  unsupported: '#94a3b8',
};

// Chrome의 toolbar 아이콘은 16/32 위주로 표시되지만,
// 고해상도 디스플레이를 위해 48/128도 함께 제공.
const ICON_SIZES = [16, 32, 48, 128] as const;

export async function setIconForTab(
  tabId: number,
  status: IconStatus,
): Promise<void> {
  const imageData: Record<number, ImageData> = {};
  for (const size of ICON_SIZES) {
    imageData[size] = drawStatusIcon(size, status);
  }

  try {
    await chrome.action.setIcon({ imageData, tabId });
  } catch (err) {
    // 탭이 막 닫혔거나 권한이 없는 페이지일 수 있음 — 조용히 무시.
    console.debug('[ai-domain-check] setIcon failed:', err);
  }
}

function drawStatusIcon(size: number, status: IconStatus): ImageData {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('OffscreenCanvas 2d context unavailable');
  }

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.44;

  // 채워진 원 (상태 색상)
  ctx.fillStyle = ICON_COLORS[status];
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 흰색 심볼 (의미 강화 — 색맹·흑백 환경 대응)
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (status) {
    case 'official':
      drawCheck(ctx, cx, cy, r);
      break;
    case 'suspicious':
      drawExclamation(ctx, cx, cy, r);
      break;
    case 'unverified':
      drawQuestion(ctx, cx, cy, r);
      break;
    case 'unsupported':
      // 회색 원만 — 추가 심볼 없음
      break;
  }

  return ctx.getImageData(0, 0, size, size);
}

// 체크 마크 — 공식 도메인용
function drawCheck(
  ctx: OffscreenCanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  const w = Math.max(1.5, r * 0.20);
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.42, cy + r * 0.04);
  ctx.lineTo(cx - r * 0.08, cy + r * 0.36);
  ctx.lineTo(cx + r * 0.48, cy - r * 0.28);
  ctx.stroke();
}

// 느낌표 — 사칭 의심용
function drawExclamation(
  ctx: OffscreenCanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  const w = Math.max(1.5, r * 0.22);
  ctx.lineWidth = w;
  // 수직선
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.50);
  ctx.lineTo(cx, cy + r * 0.10);
  ctx.stroke();
  // 아래쪽 점
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.45, w * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

// 물음표 — 미확인용
function drawQuestion(
  ctx: OffscreenCanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  // 16px 같은 작은 크기에서는 텍스트 렌더링이 흐려지므로 경로로 그림
  const w = Math.max(1.5, r * 0.20);
  ctx.lineWidth = w;
  // 위쪽 곡선부 (반원)
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.18, r * 0.30, Math.PI, Math.PI * 1.85, false);
  ctx.stroke();
  // 곡선 끝에서 중앙으로 내려오는 선
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.20, cy + r * 0.02);
  ctx.lineTo(cx, cy + r * 0.20);
  ctx.stroke();
  // 아래쪽 점
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.50, w * 0.55, 0, Math.PI * 2);
  ctx.fill();
}
