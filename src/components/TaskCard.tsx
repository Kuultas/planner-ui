import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { useDraggable } from "@dnd-kit/core";
import { Urgency, WorkItem } from "../types";

const useStyles = makeStyles({
  root: {
    padding: "4px 8px",
    marginBottom: "2px",
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "4px",
    cursor: "grab",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    userSelect: "none",
    touchAction: "none",
    minHeight: "26px",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  dragging: {
    opacity: 0.3
  },
  overdue: {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: "#d13438"
  },
  today: {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: "#ca5010"
  },
  thisWeek: {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: "#0f6cbd"
  },
  later: {
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorNeutralStroke1
  },
  title: {
    fontSize: "11px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    flex: 1,
    minWidth: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  id: {
    fontSize: "9px",
    color: tokens.colorNeutralForeground3,
    flexShrink: 0
  },
  team: {
    fontSize: "9px",
    color: tokens.colorNeutralForeground3,
    paddingTop: "1px",
    paddingBottom: "1px",
    paddingLeft: "5px",
    paddingRight: "5px",
    borderRadius: "3px",
    backgroundColor: tokens.colorNeutralBackground3,
    whiteSpace: "nowrap",
    flexShrink: 0
  },
  due: {
    fontSize: "9px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    flexShrink: 0
  },
  dueOverdue: { color: "#d13438" },
  dueToday: { color: "#ca5010" },
  dueWeek: { color: "#0f6cbd" },
  dueLater: { color: tokens.colorNeutralForeground3 },
  ghost: {
    cursor: "grabbing",
    boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
    backgroundColor: tokens.colorNeutralBackground1
  }
});

const urgencyBorderMap = {
  overdue: "overdue",
  today: "today",
  thisWeek: "thisWeek",
  later: "later"
} as const;

const urgencyDueMap = {
  overdue: "dueOverdue",
  today: "dueToday",
  thisWeek: "dueWeek",
  later: "dueLater"
} as const;

interface Props {
  workItem: WorkItem;
  urgency: Urgency;
}

export function TaskCard({ workItem, urgency }: Props) {
  const styles = useStyles();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `card-${workItem.id}`,
    data: { kind: "card", workItem }
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={mergeClasses(
        styles.root,
        styles[urgencyBorderMap[urgency]],
        isDragging ? styles.dragging : undefined
      )}
    >
      <div className={styles.title}>{workItem.title}</div>
      <span className={styles.team}>{workItem.teamName}</span>
      <span className={styles.id}>#{workItem.id}</span>
      {workItem.dueDate && (
        <span className={mergeClasses(styles.due, styles[urgencyDueMap[urgency]])}>
          {formatShortDate(workItem.dueDate)}
        </span>
      )}
    </div>
  );
}

export function TaskCardGhost({
  workItem,
  urgency = "today"
}: {
  workItem: WorkItem;
  urgency?: Urgency;
}) {
  const styles = useStyles();
  return (
    <div
      className={mergeClasses(
        styles.root,
        styles[urgencyBorderMap[urgency]],
        styles.ghost
      )}
      style={{ width: "280px" }}
    >
      <div className={styles.title}>{workItem.title}</div>
      <span className={styles.team}>{workItem.teamName}</span>
      <span className={styles.id}>#{workItem.id}</span>
    </div>
  );
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
