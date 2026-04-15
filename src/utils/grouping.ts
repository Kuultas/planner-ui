import type { WorkItem } from "../types";

export type TaskGroup = "overdue" | "dueToday" | "thisWeek" | "later";

export const GROUP_LABELS: Record<TaskGroup, string> = {
  overdue: "Overdue",
  dueToday: "Due Today",
  thisWeek: "This Week",
  later: "Later"
};

export const GROUP_ORDER: TaskGroup[] = ["overdue", "dueToday", "thisWeek", "later"];

export function groupForWorkItem(item: WorkItem, today: string): TaskGroup {
  if (!item.dueDate) return "later";
  if (item.dueDate < today) return "overdue";
  if (item.dueDate === today) return "dueToday";
  const weekEnd = addDays(today, 7);
  if (item.dueDate <= weekEnd) return "thisWeek";
  return "later";
}

export function groupWorkItems(items: WorkItem[], today: string): Record<TaskGroup, WorkItem[]> {
  const result: Record<TaskGroup, WorkItem[]> = {
    overdue: [],
    dueToday: [],
    thisWeek: [],
    later: []
  };
  for (const item of items) {
    result[groupForWorkItem(item, today)].push(item);
  }
  for (const group of GROUP_ORDER) {
    result[group].sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  }
  return result;
}

export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "No due date";
  const [, month, day] = dueDate.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `Due ${monthNames[Number(month) - 1]} ${Number(day)}`;
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
