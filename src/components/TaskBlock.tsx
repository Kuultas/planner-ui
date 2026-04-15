import {
  makeStyles,
  mergeClasses
} from "@fluentui/react-components";
import { useDraggable } from "@dnd-kit/core";
import { useRef, useState } from "react";
import { BlockInstance, CalendarEvent, WorkItem } from "../types";
import {
  DAY_END_MINUTES,
  MIN_BLOCK_DURATION_MINUTES,
  MINUTE_HEIGHT,
  formatDuration,
  pixelsToMinutes,
  snap
} from "../utils/timeGrid";
import { useDayStore } from "../state/useDayStore";

const PLANNED_FILL = "#fff3e0";
const PLANNED_FILL_ALPHA = "rgba(255, 243, 224, 0.6)";
const PLANNED_BORDER = "#fb8c00";
const LOGGED_FILL = "#e8f5e9";
const LOGGED_FILL_ALPHA = "rgba(232, 245, 233, 0.6)";
const LOGGED_BORDER = "#43a047";

const useStyles = makeStyles({
  root: {
    position: "absolute",
    left: "6px",
    right: "6px",
    borderRadius: "4px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box",
    userSelect: "none"
  },
  planned: {
    backgroundColor: PLANNED_FILL,
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: PLANNED_BORDER
  },
  logged: {
    backgroundColor: LOGGED_FILL,
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: LOGGED_BORDER
  },
  plannedOverlap: {
    backgroundColor: PLANNED_FILL_ALPHA,
    borderTopWidth: "1px",
    borderTopStyle: "dashed",
    borderTopColor: PLANNED_BORDER,
    borderRightWidth: "1px",
    borderRightStyle: "dashed",
    borderRightColor: PLANNED_BORDER,
    borderBottomWidth: "1px",
    borderBottomStyle: "dashed",
    borderBottomColor: PLANNED_BORDER,
    boxShadow: "none"
  },
  loggedOverlap: {
    backgroundColor: LOGGED_FILL_ALPHA,
    borderTopWidth: "1px",
    borderTopStyle: "dashed",
    borderTopColor: LOGGED_BORDER,
    borderRightWidth: "1px",
    borderRightStyle: "dashed",
    borderRightColor: LOGGED_BORDER,
    borderBottomWidth: "1px",
    borderBottomStyle: "dashed",
    borderBottomColor: LOGGED_BORDER,
    boxShadow: "none"
  },
  body: {
    flex: 1,
    cursor: "grab",
    paddingTop: "6px",
    paddingRight: "8px",
    paddingBottom: "10px",
    paddingLeft: "8px",
    overflow: "hidden",
    touchAction: "none"
  },
  bodyCompact: {
    paddingTop: "3px",
    paddingBottom: "3px",
    display: "flex",
    alignItems: "center"
  },
  bodyTiny: {
    paddingTop: "1px",
    paddingBottom: "4px"
  },
  headerFull: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px",
    minWidth: 0
  },
  headerLeft: {
    flex: 1,
    minWidth: 0
  },
  title: {
    fontSize: "11px",
    fontWeight: 600,
    lineHeight: 1.2,
    color: "#222",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  subtitle: {
    fontSize: "10px",
    color: "#666",
    marginTop: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  description: {
    fontSize: "10px",
    color: "#555",
    fontStyle: "italic",
    marginTop: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  singleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    minWidth: 0
  },
  srText: {
    flex: 1,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "11px",
    lineHeight: 1.2
  },
  srTextTiny: {
    fontSize: "10px",
    lineHeight: 1.1
  },
  srTitle: {
    fontWeight: 600,
    color: "#222"
  },
  srSep: {
    color: "#bbb"
  },
  srSubtitle: {
    color: "#666"
  },
  srDesc: {
    color: "#555",
    fontStyle: "italic"
  },
  badge: {
    fontSize: "9px",
    fontWeight: 600,
    paddingTop: "2px",
    paddingRight: "6px",
    paddingBottom: "2px",
    paddingLeft: "6px",
    borderRadius: "10px",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
    flexShrink: 0
  },
  badgeTiny: {
    fontSize: "8px",
    paddingTop: "1px",
    paddingBottom: "1px",
    paddingLeft: "5px",
    paddingRight: "5px"
  },
  badgeLogged: {
    backgroundColor: LOGGED_BORDER,
    color: "#fff"
  },
  badgePlanned: {
    backgroundColor: "#fff",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: PLANNED_BORDER,
    borderRightWidth: "1px",
    borderRightStyle: "solid",
    borderRightColor: PLANNED_BORDER,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: PLANNED_BORDER,
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    borderLeftColor: PLANNED_BORDER,
    color: PLANNED_BORDER
  },
  resizeHandle: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "8px",
    cursor: "ns-resize",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    touchAction: "none",
    zIndex: 3
  },
  resizeHandleTiny: {
    height: "4px"
  },
  resizeGrip: {
    width: "30px",
    height: "3px",
    backgroundColor: "#bbb",
    borderRadius: "2px"
  },
  dragging: {
    opacity: 0.75,
    boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
    zIndex: 10
  }
});

interface Props {
  block: BlockInstance;
  workItem: WorkItem;
  dayStartMinutes: number;
  overlapsMeeting: boolean;
  linkedMeeting?: CalendarEvent;
}

export function TaskBlock({
  block,
  workItem,
  dayStartMinutes,
  overlapsMeeting,
  linkedMeeting
}: Props) {
  const styles = useStyles();

  const updateBlock = useDayStore((s) => s.updateBlock);
  const allBlocks = useDayStore((s) => s.blocks);
  const setSelectedId = useDayStore((s) => s.setSelectedId);
  const selectedId = useDayStore((s) => s.selectedId);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block-${block.instanceId}`,
    data: { kind: "block", block }
  });

  const resizeStartY = useRef(0);
  const resizeStartDuration = useRef(0);
  const [isResizing, setIsResizing] = useState(false);

  const top = (block.startMinutes - dayStartMinutes) * MINUTE_HEIGHT;
  const height = block.durationMinutes * MINUTE_HEIGHT;
  const isLogged = block.state === "logged";

  const duration = block.durationMinutes;
  const isFull = duration >= 60;
  const isMedium = duration >= 40 && duration < 60;
  const isCompact = duration < 40;
  const isTiny = duration < 25;

  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resizeStartY.current = e.clientY;
    resizeStartDuration.current = block.durationMinutes;
    setIsResizing(true);
  };

  const onResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    const deltaY = e.clientY - resizeStartY.current;
    const deltaMin = pixelsToMinutes(deltaY);
    let newDuration = snap(resizeStartDuration.current + deltaMin);
    newDuration = Math.max(MIN_BLOCK_DURATION_MINUTES, newDuration);

    const maxByDay = DAY_END_MINUTES - block.startMinutes;
    newDuration = Math.min(newDuration, maxByDay);

    const nextTask = allBlocks
      .filter(
        (b) =>
          b.instanceId !== block.instanceId &&
          b.date === block.date &&
          b.startMinutes >= block.startMinutes
      )
      .sort((a, b) => a.startMinutes - b.startMinutes)[0];

    if (nextTask) {
      const maxByNext = nextTask.startMinutes - block.startMinutes;
      newDuration = Math.min(newDuration, maxByNext);
    }

    if (newDuration < MIN_BLOCK_DURATION_MINUTES) return;
    if (newDuration !== block.durationMinutes) {
      updateBlock(block.instanceId, { durationMinutes: newDuration });
    }
  };

  const onResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsResizing(false);
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const transformStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const stateClass = isLogged ? styles.logged : styles.planned;
  const overlapClass = overlapsMeeting
    ? isLogged
      ? styles.loggedOverlap
      : styles.plannedOverlap
    : undefined;

  const badge = (
    <span
      className={mergeClasses(
        styles.badge,
        isLogged ? styles.badgeLogged : styles.badgePlanned,
        isTiny ? styles.badgeTiny : undefined
      )}
    >
      {formatDuration(block.durationMinutes)}{" "}
      {isLogged ? "logged" : "planned"}
    </span>
  );

  const isSelected = selectedId === block.instanceId;

  const handleClick = () => {
    setSelectedId(isSelected ? null : block.instanceId);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={mergeClasses(
        styles.root,
        stateClass,
        overlapClass,
        isDragging ? styles.dragging : undefined
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        cursor: "pointer",
        outline: isSelected ? "2px solid #0f6cbd" : undefined,
        outlineOffset: isSelected ? "-1px" : undefined,
        ...transformStyle
      }}
      onClick={handleClick}
    >
      <div
        {...listeners}
        className={mergeClasses(
          styles.body,
          isCompact ? styles.bodyCompact : undefined,
          isTiny ? styles.bodyTiny : undefined
        )}
      >
        {isCompact ? (
          <div className={styles.singleRow}>
            <div
              className={mergeClasses(
                styles.srText,
                isTiny ? styles.srTextTiny : undefined
              )}
            >
              <span className={styles.srTitle}>{workItem.title}</span>
              <span className={styles.srSep}> &middot; </span>
              <span className={styles.srSubtitle}>
                {workItem.teamName} #{workItem.id}
              </span>
              {block.description && (
                <>
                  <span className={styles.srSep}> &middot; </span>
                  <span className={styles.srDesc}>
                    &ldquo;{block.description}&rdquo;
                  </span>
                </>
              )}
            </div>
            {badge}
          </div>
        ) : (
          <>
            <div className={styles.headerFull}>
              <div className={styles.headerLeft}>
                <div className={styles.title}>{workItem.title}</div>
                <div className={styles.subtitle}>
                  {workItem.teamName} &middot; #{workItem.id}
                  {linkedMeeting && ` \u00B7 from ${linkedMeeting.subject}`}
                </div>
              </div>
              {badge}
            </div>
            {isFull && block.description && (
              <div className={styles.description}>
                &ldquo;{block.description}&rdquo;
              </div>
            )}
            {isMedium && null}
          </>
        )}
      </div>
      <div
        className={mergeClasses(
          styles.resizeHandle,
          isTiny ? styles.resizeHandleTiny : undefined
        )}
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
        onClick={(e) => e.stopPropagation()}
      >
        {!isTiny && <div className={styles.resizeGrip} />}
      </div>
    </div>
  );
}
