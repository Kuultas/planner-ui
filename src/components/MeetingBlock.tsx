import { makeStyles, mergeClasses } from "@fluentui/react-components";
import { Link16Regular } from "@fluentui/react-icons";
import { BlockInstance, CalendarEvent, MeetingTimeEntry, WorkItem } from "../types";
import {
  MINUTE_HEIGHT,
  formatClock,
  formatDuration,
  parseIsoToMinutes
} from "../utils/timeGrid";

const MEETING_BORDER = "#5c6bc0";
const MEETING_FILL = "#e8eaf6";
const PLANNED_COLOR = "#fb8c00";
const LOGGED_COLOR = "#43a047";

const useStyles = makeStyles({
  root: {
    position: "absolute",
    left: "6px",
    right: "6px",
    borderRadius: "4px",
    paddingTop: "3px",
    paddingRight: "8px",
    paddingBottom: "3px",
    paddingLeft: "8px",
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: MEETING_BORDER,
    backgroundColor: MEETING_FILL,
    opacity: 0.9,
    overflow: "hidden",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxSizing: "border-box"
  },
  compact: {
    paddingTop: "1px",
    paddingBottom: "1px"
  },
  subjectRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "8px",
    minWidth: 0
  },
  subject: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#333",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0
  },
  timeRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "2px",
    minWidth: 0
  },
  time: {
    fontSize: "10px",
    color: "#666",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flexShrink: 1,
    minWidth: 0
  },
  compactRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    minWidth: 0
  },
  compactSubject: {
    fontSize: "10px",
    fontWeight: 600,
    color: "#333",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0,
    lineHeight: 1.15
  },
  compactTime: {
    fontSize: "9px",
    color: "#666",
    whiteSpace: "nowrap",
    flexShrink: 0,
    lineHeight: 1.15
  },
  badgeGroup: {
    display: "flex",
    gap: "4px",
    flexShrink: 0
  },
  badge: {
    fontSize: "9px",
    fontWeight: 600,
    paddingTop: "1px",
    paddingRight: "6px",
    paddingBottom: "1px",
    paddingLeft: "6px",
    borderRadius: "10px",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
    color: "#fff"
  },
  badgeCompact: {
    fontSize: "8px",
    paddingTop: "0px",
    paddingRight: "5px",
    paddingBottom: "0px",
    paddingLeft: "5px"
  },
  badgeLogged: {
    backgroundColor: LOGGED_COLOR
  },
  badgePlanned: {
    backgroundColor: PLANNED_COLOR
  },
  linkedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    fontSize: "9px",
    fontWeight: 600,
    paddingTop: "1px",
    paddingRight: "6px",
    paddingBottom: "1px",
    paddingLeft: "5px",
    borderRadius: "10px",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
    backgroundColor: "#e8eaf6",
    color: MEETING_BORDER
  }
});

interface Props {
  event: CalendarEvent;
  dayStartMinutes: number;
  associatedBlocks: BlockInstance[];
  linkedEntry?: MeetingTimeEntry;
  linkedWorkItem?: WorkItem;
}

export function MeetingBlock({ event, dayStartMinutes, associatedBlocks, linkedEntry, linkedWorkItem }: Props) {
  const styles = useStyles();
  const start = parseIsoToMinutes(event.start);
  const end = parseIsoToMinutes(event.end);
  const duration = end - start;
  const top = (start - dayStartMinutes) * MINUTE_HEIGHT;
  const height = duration * MINUTE_HEIGHT;
  const isCompact = duration < 40;

  const loggedMin = associatedBlocks
    .filter((b) => b.state === "logged")
    .reduce((sum, b) => sum + b.durationMinutes, 0);
  const plannedMin = associatedBlocks
    .filter((b) => b.state === "planned")
    .reduce((sum, b) => sum + b.durationMinutes, 0);
  const hasAssociated = loggedMin > 0 || plannedMin > 0;

  const badges = (
    <div className={styles.badgeGroup}>
      {linkedEntry && linkedWorkItem && (
        <span className={styles.linkedBadge}>
          <Link16Regular style={{ fontSize: 12 }} />
          #{linkedWorkItem.id}
        </span>
      )}
      {loggedMin > 0 && (
        <span
          className={mergeClasses(
            styles.badge,
            styles.badgeLogged,
            isCompact ? styles.badgeCompact : undefined
          )}
        >
          {formatDuration(loggedMin)} logged
        </span>
      )}
      {plannedMin > 0 && (
        <span
          className={mergeClasses(
            styles.badge,
            styles.badgePlanned,
            isCompact ? styles.badgeCompact : undefined
          )}
        >
          {formatDuration(plannedMin)} planned
        </span>
      )}
    </div>
  );
  const hasAnything = hasAssociated || !!linkedEntry;

  return (
    <div
      className={mergeClasses(styles.root, isCompact ? styles.compact : undefined)}
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      {isCompact ? (
        <div className={styles.compactRow}>
          <span className={styles.compactSubject}>{event.subject}</span>
          {hasAnything ? (
            badges
          ) : (
            <span className={styles.compactTime}>
              {formatClock(start)} – {formatClock(end)}
            </span>
          )}
        </div>
      ) : (
        <>
          <div className={styles.subjectRow}>
            <span className={styles.subject}>{event.subject}</span>
            {hasAnything && badges}
          </div>
          <div className={styles.timeRow}>
            <span className={styles.time}>
              {formatClock(start)} – {formatClock(end)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
