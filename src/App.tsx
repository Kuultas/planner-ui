import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  Modifier,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { makeStyles, Tab, TabList, tokens } from "@fluentui/react-components";
import { useState } from "react";
import { DayHeader } from "./components/DayHeader";
import { Timeline } from "./components/Timeline";
import { TaskList } from "./components/TaskList";
import { TimePanel } from "./components/TimePanel";
import { TaskCardGhost } from "./components/TaskCard";
import { fakeWorkItems } from "./data/fakeWorkItems";
import { fakeCalendarEvents } from "./data/fakeCalendarEvents";
import { useDayStore } from "./state/useDayStore";
import { BlockInstance, WorkItem } from "./types";
import {
  DAY_END_MINUTES,
  DAY_START_MINUTES,
  DEFAULT_DROP_DURATION_MINUTES,
  MINUTE_HEIGHT,
  SNAP_MINUTES,
  parseIsoToMinutes,
  pixelsToMinutes,
  snap
} from "./utils/timeGrid";
import { taskOverlaps } from "./utils/overlap";

const SNAP_STEP_PX = MINUTE_HEIGHT * SNAP_MINUTES;

const blockMoveConstraints: Modifier = ({ transform, active }) => {
  if (active?.data.current?.kind !== "block") return transform;
  return {
    ...transform,
    x: 0,
    y: Math.round(transform.y / SNAP_STEP_PX) * SNAP_STEP_PX
  };
};

const useStyles = makeStyles({
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground2
  },
  body: {
    flex: 1,
    display: "flex",
    minHeight: 0
  },
  rightColumn: {
    width: "360px",
    minWidth: "360px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 0,
    backgroundColor: tokens.colorNeutralBackground1
  },
  tabBar: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0
  },
  tabContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 0
  }
});

type ActiveDrag =
  | { kind: "card"; workItem: WorkItem }
  | { kind: "block"; block: BlockInstance }
  | null;

export function App() {
  const styles = useStyles();
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "time">("tasks");

  const addBlock = useDayStore((s) => s.addBlock);
  const updateBlock = useDayStore((s) => s.updateBlock);
  const blocks = useDayStore((s) => s.blocks);
  const currentDate = useDayStore((s) => s.currentDate);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (!data) return;
    if (data.kind === "card") {
      setActiveDrag({ kind: "card", workItem: data.workItem as WorkItem });
    } else if (data.kind === "block") {
      setActiveDrag({ kind: "block", block: data.block as BlockInstance });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over, delta, activatorEvent } = event;
    const data = active.data.current;
    if (!data) return;

    const dateBlocks = blocks.filter((b) => b.date === currentDate);

    if (data.kind === "card") {
      if (!over || over.id !== "timeline-overlay") return;
      const workItem = data.workItem as WorkItem;

      const pointerEvent = activatorEvent as PointerEvent;
      const finalY = pointerEvent.clientY + delta.y;
      const relY = finalY - over.rect.top;
      const rawMinutes = DAY_START_MINUTES + pixelsToMinutes(relY);

      const events = fakeCalendarEvents.filter((e) =>
        e.start.startsWith(currentDate)
      );
      const linkedMeetingIds = new Set(
        dateBlocks
          .filter((b) => b.sourceEventId)
          .map((b) => b.sourceEventId as string)
      );
      const visibleEvents = events.filter((e) => !linkedMeetingIds.has(e.id));
      const meetingAt = visibleEvents.find((e) => {
        const mStart = parseIsoToMinutes(e.start);
        const mEnd = parseIsoToMinutes(e.end);
        return rawMinutes >= mStart && rawMinutes < mEnd;
      });

      let finalStart: number;
      let finalDuration: number;
      if (meetingAt) {
        finalStart = parseIsoToMinutes(meetingAt.start);
        finalDuration =
          parseIsoToMinutes(meetingAt.end) - parseIsoToMinutes(meetingAt.start);
      } else {
        finalStart = snap(rawMinutes);
        finalDuration = DEFAULT_DROP_DURATION_MINUTES;
      }

      finalStart = Math.max(DAY_START_MINUTES, finalStart);
      if (finalStart + finalDuration > DAY_END_MINUTES) {
        finalStart = DAY_END_MINUTES - finalDuration;
      }

      if (taskOverlaps(finalStart, finalDuration, dateBlocks)) {
        return;
      }

      addBlock({
        instanceId: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        workItemId: workItem.id,
        date: currentDate,
        startMinutes: finalStart,
        durationMinutes: finalDuration,
        description: "",
        state: "planned",
        sourceEventId: meetingAt?.id
      });
      return;
    }

    if (data.kind === "block") {
      const block = data.block as BlockInstance;
      if (delta.y === 0) return;

      const deltaMin = pixelsToMinutes(delta.y);
      let newStart = snap(block.startMinutes + deltaMin);
      newStart = Math.max(DAY_START_MINUTES, newStart);
      if (newStart + block.durationMinutes > DAY_END_MINUTES) {
        newStart = DAY_END_MINUTES - block.durationMinutes;
      }

      if (newStart === block.startMinutes) return;

      if (taskOverlaps(newStart, block.durationMinutes, dateBlocks, block.instanceId)) {
        return;
      }

      updateBlock(block.instanceId, { startMinutes: newStart });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      modifiers={[blockMoveConstraints]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.root}>
        <DayHeader />
        <div className={styles.body}>
          <Timeline workItems={fakeWorkItems} />
          <div className={styles.rightColumn}>
            <div className={styles.tabBar}>
              <TabList
                selectedValue={activeTab}
                onTabSelect={(_, d) => setActiveTab(d.value as "tasks" | "time")}
                size="small"
              >
                <Tab value="tasks">Tasks</Tab>
                <Tab value="time">Time</Tab>
              </TabList>
            </div>
            <div className={styles.tabContent}>
              {activeTab === "tasks" ? (
                <TaskList workItems={fakeWorkItems} today={currentDate} />
              ) : (
                <TimePanel workItems={fakeWorkItems} />
              )}
            </div>
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDrag?.kind === "card" ? (
          <TaskCardGhost workItem={activeDrag.workItem} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
