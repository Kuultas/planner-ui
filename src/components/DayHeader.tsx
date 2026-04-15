import { Button, makeStyles, Text, tokens } from "@fluentui/react-components";
import {
  ChevronLeft24Regular,
  ChevronRight24Regular
} from "@fluentui/react-icons";
import { useDayStore } from "../state/useDayStore";
import { formatDuration } from "../utils/timeGrid";
import { shiftDateString } from "../utils/overlap";

const TODAY = "2026-04-10";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexShrink: 0
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  dateLabel: {
    minWidth: "220px",
    textAlign: "center"
  },
  loggedBadge: {
    marginLeft: "16px",
    color: tokens.colorNeutralForeground3
  }
});

export function DayHeader() {
  const styles = useStyles();
  const currentDate = useDayStore((s) => s.currentDate);
  const setCurrentDate = useDayStore((s) => s.setCurrentDate);
  const blocks = useDayStore((s) => s.blocks);

  const loggedMinutesToday = blocks
    .filter((b) => b.date === currentDate && b.state === "logged")
    .reduce((sum, b) => sum + b.durationMinutes, 0);

  const formatted = formatLongDate(currentDate);

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <Text size={500} weight="semibold">
          Daily Planner
        </Text>
        <Text size={200} className={styles.loggedBadge}>
          {formatDuration(loggedMinutesToday)} logged today
        </Text>
      </div>
      <div className={styles.right}>
        <Button
          appearance="subtle"
          icon={<ChevronLeft24Regular />}
          onClick={() => setCurrentDate(shiftDateString(currentDate, -1))}
          aria-label="Previous day"
        />
        <Button
          appearance="subtle"
          onClick={() => setCurrentDate(TODAY)}
        >
          Today
        </Button>
        <Button
          appearance="subtle"
          icon={<ChevronRight24Regular />}
          onClick={() => setCurrentDate(shiftDateString(currentDate, 1))}
          aria-label="Next day"
        />
        <Text className={styles.dateLabel} weight="medium">
          {formatted}
        </Text>
      </div>
    </div>
  );
}

function formatLongDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}
