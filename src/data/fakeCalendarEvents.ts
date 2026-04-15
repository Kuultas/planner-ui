import { CalendarEvent } from "../types";

export const fakeCalendarEvents: CalendarEvent[] = [
  {
    id: "m1",
    subject: "Team Standup",
    start: "2026-04-14T09:00:00",
    end: "2026-04-14T09:30:00",
    category: "meeting"
  },
  {
    id: "m2",
    subject: "Client Review \u2014 Contoso",
    start: "2026-04-14T11:30:00",
    end: "2026-04-14T12:30:00",
    category: "meeting"
  },
  {
    id: "m3",
    subject: "Sprint Planning",
    start: "2026-04-14T15:00:00",
    end: "2026-04-14T16:00:00",
    category: "meeting"
  }
];
