import { BlockInstance } from "../types";

export const fakePlacedBlocks: BlockInstance[] = [
  {
    instanceId: "b1",
    workItemId: 9012,
    date: "2026-04-14",
    startMinutes: 10 * 60,
    durationMinutes: 90,
    description: "Migrated OAuth flow to MSAL v3",
    state: "logged",
    freshbooksEntryId: "fb-12345"
  },
  {
    instanceId: "b2",
    workItemId: 1234,
    date: "2026-04-14",
    startMinutes: 13 * 60,
    durationMinutes: 120,
    description: "",
    state: "planned"
  }
];
