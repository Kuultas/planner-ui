import { create } from "zustand";
import { BlockInstance, MeetingTimeEntry } from "../types";
import { fakePlacedBlocks } from "../data/fakePlacedBlocks";

interface DayState {
  currentDate: string;
  blocks: BlockInstance[];
  meetingEntries: MeetingTimeEntry[];
  selectedId: string | null;

  setCurrentDate: (date: string) => void;
  addBlock: (block: BlockInstance) => void;
  updateBlock: (instanceId: string, patch: Partial<BlockInstance>) => void;
  removeBlock: (instanceId: string) => void;
  setSelectedId: (id: string | null) => void;

  addMeetingEntry: (entry: MeetingTimeEntry) => void;
  updateMeetingEntry: (eventId: string, patch: Partial<MeetingTimeEntry>) => void;
  removeMeetingEntry: (eventId: string) => void;
}

export const useDayStore = create<DayState>()((set) => ({
  currentDate: "2026-04-14",
  blocks: fakePlacedBlocks,
  meetingEntries: [],
  selectedId: null,

  setCurrentDate: (date) => set({ currentDate: date }),
  addBlock: (block) => set((s) => ({ blocks: [...s.blocks, block] })),
  updateBlock: (instanceId, patch) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.instanceId === instanceId ? { ...b, ...patch } : b
      )
    })),
  removeBlock: (instanceId) =>
    set((s) => ({ blocks: s.blocks.filter((b) => b.instanceId !== instanceId) })),
  setSelectedId: (id) => set({ selectedId: id }),

  addMeetingEntry: (entry) =>
    set((s) => ({ meetingEntries: [...s.meetingEntries, entry] })),
  updateMeetingEntry: (eventId, patch) =>
    set((s) => ({
      meetingEntries: s.meetingEntries.map((e) =>
        e.eventId === eventId ? { ...e, ...patch } : e
      )
    })),
  removeMeetingEntry: (eventId) =>
    set((s) => ({
      meetingEntries: s.meetingEntries.filter((e) => e.eventId !== eventId)
    }))
}));
