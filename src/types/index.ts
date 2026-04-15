export type TeamName = "Project Alpha" | "Project Beta" | "Project Gamma";

export type WorkItemType = "Task" | "Bug" | "User Story";

export interface WorkItem {
  id: number;
  title: string;
  teamName: TeamName;
  dueDate: string | null;
  workItemType: WorkItemType;
}

export interface CalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  category: "meeting" | "focus";
}

export type BlockState = "planned" | "logged";

export interface BlockInstance {
  instanceId: string;
  workItemId: number;
  date: string;
  startMinutes: number;
  durationMinutes: number;
  description: string;
  state: BlockState;
  freshbooksEntryId?: string;
  sourceEventId?: string;
}

export type Urgency = "overdue" | "today" | "thisWeek" | "later";

export interface MeetingTimeEntry {
  eventId: string;
  workItemId: number;
  durationMinutes: number;
  description: string;
  state: BlockState;
}
