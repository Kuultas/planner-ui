import { BlockInstance } from "../types";

export function taskOverlaps(
  startMinutes: number,
  durationMinutes: number,
  otherBlocks: BlockInstance[],
  excludeInstanceId?: string
): boolean {
  const end = startMinutes + durationMinutes;
  return otherBlocks.some((b) => {
    if (b.instanceId === excludeInstanceId) return false;
    const bEnd = b.startMinutes + b.durationMinutes;
    return !(end <= b.startMinutes || startMinutes >= bEnd);
  });
}

export function shiftDateString(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
