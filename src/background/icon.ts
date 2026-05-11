// AI Domain Check — 툴바 액션 아이콘 그리기.
//
// chrome.action.setIcon은 PNG 파일 경로 또는 ImageData를 받습니다.
// MVP 단계에서는 PNG 디자인 자산이 없으므로 OffscreenCanvas로
// 상태별 색상 원을 즉석에서 그려 ImageData로 넘깁니다.
// 추후 디자인된 PNG가 도착하면 이 모듈을 PNG 로딩 방식으로 교체.

import type { DomainStatus } from '../lib/types';

export type IconStatus = DomainStatus | 'unsupported';

const ICON_COLORS: Record<IconStatus, string> = {
  official: '#10b981',
  suspicious: '#ef4444',
  unverified: '#f59e0b',
  unsupported: '#9ca3af',
};

// Chrome의 toolbar 아이콘은 16/32 위주로 표시되지만,
// 고해상도 디스플레이를 위해 48/128도 함께 제공.
const ICON_SIZES = [16, 32, 48, 128] as const;

export async function setIconForTab(
  tabId: number,
  status: IconStatus,
): Promise<void> {
  const imageData: Record<number, ImageData> = {};
  const color = ICON_COLORS[status];
  for (const size of ICON_SIZES) {
    imageData[size] = drawStatusIcon(size, color);
  }

  try {
    await chrome.action.setIcon({ imageData, tabId });
  } catch (err) {
    // 탭이 막 닫혔거나 권한이 없는 페이지일 수 있음 — 조용히 무시.
    console.debug('[ai-domain-check] setIcon failed:', err);
  }
}

function drawStatusIcon(size: number, color: string): ImageData {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('OffscreenCanvas 2d context unavailable');
  }

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  // 채워진 원
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 흰색 테두리로 가독성 강화 (다크 모드 툴바에서도 또렷하게)
  ctx.lineWidth = Math.max(1, Math.floor(size * 0.08));
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  return ctx.getImageData(0, 0, size, size);
}
