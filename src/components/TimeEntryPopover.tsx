import {
  Button,
  Field,
  makeStyles,
  PopoverSurface,
  Text,
  Textarea,
  tokens
} from "@fluentui/react-components";
import {
  Checkmark20Regular,
  Clock20Regular,
  Delete20Regular,
  Dismiss20Regular
} from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { BlockInstance, CalendarEvent, WorkItem } from "../types";
import { formatClock, formatDuration, parseIsoToMinutes } from "../utils/timeGrid";

const useStyles = makeStyles({
  surface: {
    minWidth: "340px",
    maxWidth: "360px"
  },
  title: {
    display: "block",
    marginBottom: "12px"
  },
  row: {
    marginBottom: "10px"
  },
  label: {
    display: "block",
    fontSize: "11px",
    color: tokens.colorNeutralForeground3,
    marginBottom: "2px",
    textTransform: "uppercase",
    letterSpacing: "0.4px"
  },
  value: {
    fontSize: "13px",
    color: tokens.colorNeutralForeground1,
    fontWeight: 500
  },
  twoCol: {
    display: "flex",
    gap: "16px",
    marginBottom: "10px"
  },
  twoColItem: {
    flex: 1
  },
  durationBox: {
    display: "inline-block",
    fontSize: "13px",
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: "4px",
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1
  },
  textarea: {
    width: "100%"
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "6px",
    marginTop: "14px",
    alignItems: "center"
  },
  dangerLeft: {
    marginRight: "auto"
  }
});

interface Props {
  block: BlockInstance;
  workItem: WorkItem;
  linkedMeeting?: CalendarEvent;
  onClose: () => void;
  onLogTime: (description: string) => void;
  onUpdate: (description: string) => void;
  onDelete: () => void;
}

export function TimeEntryPopover({
  block,
  workItem,
  linkedMeeting,
  onClose,
  onLogTime,
  onUpdate,
  onDelete
}: Props) {
  const styles = useStyles();
  const [description, setDescription] = useState(block.description);
  const isLogged = block.state === "logged";
  const endMinutes = block.startMinutes + block.durationMinutes;

  useEffect(() => {
    setDescription(block.description);
  }, [block.instanceId, block.description]);

  return (
    <PopoverSurface className={styles.surface}>
      <Text className={styles.title} weight="semibold" size={400}>
        {isLogged ? "Time Entry" : "Log Time Entry"}
      </Text>

      <div className={styles.row}>
        <span className={styles.label}>Work Item</span>
        <div className={styles.value}>
          #{workItem.id} — {workItem.title}
        </div>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.twoColItem}>
          <span className={styles.label}>Team</span>
          <div className={styles.value}>{workItem.teamName}</div>
        </div>
        <div>
          <span className={styles.label}>Duration</span>
          <div className={styles.durationBox}>
            {formatDuration(block.durationMinutes)}
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Time</span>
        <div className={styles.value}>
          {formatClock(block.startMinutes)} – {formatClock(endMinutes)}
        </div>
      </div>

      {linkedMeeting && (
        <div className={styles.row}>
          <span className={styles.label}>Linked Meeting</span>
          <div className={styles.value}>
            {linkedMeeting.subject} ({formatClock(parseIsoToMinutes(linkedMeeting.start))} –{" "}
            {formatClock(parseIsoToMinutes(linkedMeeting.end))})
          </div>
        </div>
      )}

      <Field label="Description" className={styles.row}>
        <Textarea
          className={styles.textarea}
          value={description}
          onChange={(_, data) => setDescription(data.value)}
          placeholder="What did you work on?"
          rows={3}
        />
      </Field>

      <div className={styles.actions}>
        <Button
          className={styles.dangerLeft}
          icon={isLogged ? <Delete20Regular /> : <Dismiss20Regular />}
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          {isLogged ? "Delete" : "Remove"}
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        {isLogged ? (
          <Button
            appearance="primary"
            icon={<Checkmark20Regular />}
            onClick={() => {
              onUpdate(description);
              onClose();
            }}
          >
            Save
          </Button>
        ) : (
          <Button
            appearance="primary"
            icon={<Clock20Regular />}
            onClick={() => {
              onLogTime(description);
              onClose();
            }}
          >
            Log Time
          </Button>
        )}
      </div>
    </PopoverSurface>
  );
}
