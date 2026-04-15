export const HOUR_HEIGHT = 60;
export const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
export const SNAP_MINUTES = 15;
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 19;
export const DAY_START_MINUTES = DAY_START_HOUR * 60;
export const DAY_END_MINUTES = DAY_END_HOUR * 60;
export const VISIBLE_MINUTES = DAY_END_MINUTES - DAY_START_MINUTES;
export const VISIBLE_PIXELS = VISIBLE_MINUTES * MINUTE_HEIGHT;
export const DEFAULT_DROP_DURATION_MINUTES = 60;
export const MIN_BLOCK_DURATION_MINUTES = 15;

export function minutesToPixels(minutes: number): number {
  return minutes * MINUTE_HEIGHT;
}

export function pixelsToMinutes(pixels: number): number {
  return pixels / MINUTE_HEIGHT;
}

export function snap(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function parseIsoToMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${period}`;
}

export function formatDuration(minutes: number): string {
  if (minutes === 0) return "0h";
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
}
