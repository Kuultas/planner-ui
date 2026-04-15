import { makeStyles, mergeClasses, Text, tokens } from "@fluentui/react-components";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import {
  DAY_END_HOUR,
  DAY_END_MINUTES,
  DAY_START_HOUR,
  DAY_START_MINUTES,
  DEFAULT_DROP_DURATION_MINUTES,
  HOUR_HEIGHT,
  MINUTE_HEIGHT,
  SNAP_MINUTES,
  VISIBLE_PIXELS,
  formatClock,
  formatDuration,
  formatHourLabel,
  parseIsoToMinutes,
  pixelsToMinutes,
  snap
} from "../utils/timeGrid";
import { BlockInstance, CalendarEvent, MeetingTimeEntry, WorkItem } from "../types";
import { MeetingBlock } from "./MeetingBlock";
import { TaskBlock } from "./TaskBlock";
import { useDayStore } from "../state/useDayStore";
import { fakeCalendarEvents } from "../data/fakeCalendarEvents";
import { taskOverlaps } from "../utils/overlap";
import { fakeWorkItems } from "../data/fakeWorkItems";

const TIME_GUTTER_WIDTH = 56;
const TOP_PADDING = 12;
const BOTTOM_PADDING = 12;

interface DropPreview {
  startMin: number;
  durMin: number;
  valid: boolean;
  snappedToMeeting: boolean;
}

const useStyles = makeStyles({
  root: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    minWidth: 0,
    overflow: "hidden"
  },
  header: {
    padding: "10px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    position: "relative"
  },
  grid: {
    position: "relative",
    paddingLeft: `${TIME_GUTTER_WIDTH}px`,
    paddingRight: "16px"
  },
  hourLabel: {
    position: "absolute",
    left: "8px",
    width: `${TIME_GUTTER_WIDTH - 16}px`,
    textAlign: "right",
    color: tokens.colorNeutralForeground3,
    fontSize: "10px",
    userSelect: "none",
    pointerEvents: "none"
  },
  overlay: {
    position: "absolute",
    top: `${TOP_PADDING}px`,
    left: `${TIME_GUTTER_WIDTH}px`,
    right: "16px",
    height: `${VISIBLE_PIXELS}px`
  },
  overlayHover: {
    backgroundColor: "rgba(0,120,212,0.02)"
  },
  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 0,
    pointerEvents: "none"
  },
  dividerHour: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke2
  },
  dividerHalf: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke3,
    opacity: 0.6
  },
  dividerQuarter: {
    borderTopWidth: "1px",
    borderTopStyle: "dashed",
    borderTopColor: tokens.colorNeutralStroke3,
    opacity: 0.4
  },
  dropPreview: {
    position: "absolute",
    left: "6px",
    right: "6px",
    borderRadius: "4px",
    pointerEvents: "none",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box"
  },
  dropPreviewValid: {
    borderTopWidth: "2px",
    borderTopStyle: "dashed",
    borderTopColor: "#fb8c00",
    borderRightWidth: "2px",
    borderRightStyle: "dashed",
    borderRightColor: "#fb8c00",
    borderBottomWidth: "2px",
    borderBottomStyle: "dashed",
    borderBottomColor: "#fb8c00",
    borderLeftWidth: "2px",
    borderLeftStyle: "dashed",
    borderLeftColor: "#fb8c00",
    backgroundColor: "rgba(251,140,0,0.1)"
  },
  dropPreviewInvalid: {
    borderTopWidth: "2px",
    borderTopStyle: "dashed",
    borderTopColor: "#d13438",
    borderRightWidth: "2px",
    borderRightStyle: "dashed",
    borderRightColor: "#d13438",
    borderBottomWidth: "2px",
    borderBottomStyle: "dashed",
    borderBottomColor: "#d13438",
    borderLeftWidth: "2px",
    borderLeftStyle: "dashed",
    borderLeftColor: "#d13438",
    backgroundColor: "rgba(209,52,56,0.1)"
  },
  dropPreviewLabel: {
    fontSize: "10px",
    fontWeight: 600,
    padding: "4px 8px",
    lineHeight: 1.2
  },
  dropPreviewLabelValid: {
    color: "#c67100"
  },
  dropPreviewLabelInvalid: {
    color: "#a01217"
  }
});

interface Props {
  workItems: WorkItem[];
}

export function Timeline({ workItems }: Props) {
  const styles = useStyles();
  const currentDate = useDayStore((s) => s.currentDate);
  const allBlocks = useDayStore((s) => s.blocks);
  const meetingEntries = useDayStore((s) => s.meetingEntries);
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);

  const dateBlocks = allBlocks.filter((b) => b.date === currentDate);
  const events = fakeCalendarEvents.filter((e) => e.start.startsWith(currentDate));

  const linkedMeetingIds = new Set<string>();
  for (const b of dateBlocks) {
    if (b.sourceEventId) linkedMeetingIds.add(b.sourceEventId);
  }
  const visibleEvents = events.filter((e) => !linkedMeetingIds.has(e.id));

  const { setNodeRef, isOver } = useDroppable({ id: "timeline-overlay" });

  useDndMonitor({
    onDragMove(event) {
      const data = event.active.data.current;
      if (data?.kind !== "card") {
        if (dropPreview) setDropPreview(null);
        return;
      }
      if (!event.over || event.over.id !== "timeline-overlay") {
        if (dropPreview) setDropPreview(null);
        return;
      }
      const pointerEvent = event.activatorEvent as PointerEvent;
      const finalY = pointerEvent.clientY + event.delta.y;
      const relY = finalY - event.over.rect.top;
      const rawMinutes = DAY_START_MINUTES + pixelsToMinutes(relY);

      const meetingAt = visibleEvents.find((e) => {
        const mStart = parseIsoToMinutes(e.start);
        const mEnd = parseIsoToMinutes(e.end);
        return rawMinutes >= mStart && rawMinutes < mEnd;
      });

      let startMin: number;
      let durMin: number;
      let snappedToMeeting = false;
      if (meetingAt) {
        startMin = parseIsoToMinutes(meetingAt.start);
        durMin = parseIsoToMinutes(meetingAt.end) - startMin;
        snappedToMeeting = true;
      } else {
        startMin = snap(rawMinutes);
        durMin = DEFAULT_DROP_DURATION_MINUTES;
      }

      startMin = Math.max(DAY_START_MINUTES, startMin);
      if (startMin + durMin > DAY_END_MINUTES) {
        startMin = DAY_END_MINUTES - durMin;
      }

      const valid = !taskOverlaps(startMin, durMin, dateBlocks);

      if (
        !dropPreview ||
        dropPreview.startMin !== startMin ||
        dropPreview.durMin !== durMin ||
        dropPreview.valid !== valid ||
        dropPreview.snappedToMeeting !== snappedToMeeting
      ) {
        setDropPreview({ startMin, durMin, valid, snappedToMeeting });
      }
    },
    onDragEnd() {
      setDropPreview(null);
    },
    onDragCancel() {
      setDropPreview(null);
    }
  });

  const hours: number[] = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) hours.push(h);

  const workItemById = new Map(workItems.map((wi) => [wi.id, wi]));
  const loggedMinutes = dateBlocks
    .filter((b) => b.state === "logged")
    .reduce((sum, b) => sum + b.durationMinutes, 0);
  const plannedMinutes = dateBlocks
    .filter((b) => b.state === "planned")
    .reduce((sum, b) => sum + b.durationMinutes, 0);

  const meetingEntryByEventId = new Map<string, MeetingTimeEntry>();
  for (const me of meetingEntries) {
    meetingEntryByEventId.set(me.eventId, me);
  }
  const allWorkItemById = new Map(fakeWorkItems.map((wi) => [wi.id, wi]));

  const blocksOverlappingMeeting = new Set<string>();
  const associatedBlocksByEvent = new Map<string, BlockInstance[]>();
  const linkedMeetingByBlock = new Map<string, CalendarEvent>();

  for (const b of dateBlocks) {
    if (b.sourceEventId) {
      const linked = events.find((e) => e.id === b.sourceEventId);
      if (linked) linkedMeetingByBlock.set(b.instanceId, linked);
    }
  }

  for (const e of visibleEvents) {
    const mStart = parseIsoToMinutes(e.start);
    const mEnd = parseIsoToMinutes(e.end);
    const associated = dateBlocks.filter((b) => {
      if (b.sourceEventId) return false;
      const bEnd = b.startMinutes + b.durationMinutes;
      return !(bEnd <= mStart || b.startMinutes >= mEnd);
    });
    associatedBlocksByEvent.set(e.id, associated);
    for (const b of associated) {
      blocksOverlappingMeeting.add(b.instanceId);
    }
  }

  const totalSlots = (DAY_END_MINUTES - DAY_START_MINUTES) / SNAP_MINUTES;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Text weight="semibold" size={400}>
          Timeline
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {formatDuration(loggedMinutes)} logged · {formatDuration(plannedMinutes)} planned
        </Text>
      </div>
      <div className={styles.scroll}>
        <div
          className={styles.grid}
          style={{ height: `${TOP_PADDING + VISIBLE_PIXELS + BOTTOM_PADDING}px` }}
        >
          {hours.map((h, i) => (
            <span
              key={h}
              className={styles.hourLabel}
              style={{ top: `${TOP_PADDING + i * HOUR_HEIGHT - 7}px` }}
            >
              {formatHourLabel(h)}
            </span>
          ))}
          <div
            ref={setNodeRef}
            className={mergeClasses(
              styles.overlay,
              isOver ? styles.overlayHover : undefined
            )}
          >
            {Array.from({ length: totalSlots + 1 }).map((_, i) => {
              const minuteOffset = i * SNAP_MINUTES;
              const isHour = minuteOffset % 60 === 0;
              const isHalf = !isHour && minuteOffset % 30 === 0;
              return (
                <div
                  key={i}
                  className={mergeClasses(
                    styles.divider,
                    isHour
                      ? styles.dividerHour
                      : isHalf
                      ? styles.dividerHalf
                      : styles.dividerQuarter
                  )}
                  style={{ top: `${minuteOffset * MINUTE_HEIGHT}px` }}
                />
              );
            })}
            {visibleEvents.map((e) => {
              const me = meetingEntryByEventId.get(e.id);
              const linkedWi = me ? allWorkItemById.get(me.workItemId) : undefined;
              return (
                <MeetingBlock
                  key={e.id}
                  event={e}
                  dayStartMinutes={DAY_START_MINUTES}
                  associatedBlocks={associatedBlocksByEvent.get(e.id) ?? []}
                  linkedEntry={me}
                  linkedWorkItem={linkedWi}
                />
              );
            })}
            {dateBlocks.map((b) => {
              const wi = workItemById.get(b.workItemId);
              if (!wi) return null;
              return (
                <TaskBlock
                  key={b.instanceId}
                  block={b}
                  workItem={wi}
                  dayStartMinutes={DAY_START_MINUTES}
                  overlapsMeeting={blocksOverlappingMeeting.has(b.instanceId)}
                  linkedMeeting={linkedMeetingByBlock.get(b.instanceId)}
                />
              );
            })}
            {dropPreview && (
              <div
                className={mergeClasses(
                  styles.dropPreview,
                  dropPreview.valid
                    ? styles.dropPreviewValid
                    : styles.dropPreviewInvalid
                )}
                style={{
                  top: `${(dropPreview.startMin - DAY_START_MINUTES) * MINUTE_HEIGHT}px`,
                  height: `${dropPreview.durMin * MINUTE_HEIGHT}px`
                }}
              >
                <div
                  className={mergeClasses(
                    styles.dropPreviewLabel,
                    dropPreview.valid
                      ? styles.dropPreviewLabelValid
                      : styles.dropPreviewLabelInvalid
                  )}
                >
                  {formatClock(dropPreview.startMin)} –{" "}
                  {formatClock(dropPreview.startMin + dropPreview.durMin)}
                  {dropPreview.snappedToMeeting && " · meeting slot"}
                  {!dropPreview.valid && " · overlaps existing"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
