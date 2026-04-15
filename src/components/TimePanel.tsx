import {
  Button,
  Combobox,
  Input,
  makeStyles,
  mergeClasses,
  Option,
  tokens
} from "@fluentui/react-components";
import {
  Checkmark16Regular,
  Clock16Regular,
  Delete16Regular,
  Dismiss16Regular,
  Link16Regular,
  Timer16Regular
} from "@fluentui/react-icons";
import { useEffect, useRef } from "react";
import { useDayStore } from "../state/useDayStore";
import { CalendarEvent, WorkItem } from "../types";
import { fakeCalendarEvents } from "../data/fakeCalendarEvents";
import { formatClock, formatDuration, parseIsoToMinutes, SNAP_MINUTES } from "../utils/timeGrid";

const PLANNED_BORDER = "#fb8c00";
const LOGGED_BORDER = "#43a047";
const MEETING_BORDER = "#5c6bc0";

const useStyles = makeStyles({
  root: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  header: {
    padding: "10px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0
  },
  stats: {
    fontSize: "11px",
    color: tokens.colorNeutralForeground3
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 12px"
  },
  sectionLabel: {
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: tokens.colorNeutralForeground3,
    padding: "8px 4px 4px"
  },
  // Task block entries
  entry: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px",
    marginBottom: "4px",
    borderRadius: "6px",
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    backgroundColor: tokens.colorNeutralBackground1,
    transitionProperty: "background-color, box-shadow",
    transitionDuration: "200ms",
    transitionTimingFunction: "ease"
  },
  entryPlanned: {
    borderLeftColor: PLANNED_BORDER
  },
  entryLogged: {
    borderLeftColor: LOGGED_BORDER
  },
  entrySelected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    boxShadow: `0 0 0 2px ${tokens.colorBrandStroke1}`
  },
  entryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "8px"
  },
  entryTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0
  },
  entryMeta: {
    fontSize: "10px",
    color: tokens.colorNeutralForeground3
  },
  entryBadge: {
    fontSize: "9px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "10px",
    whiteSpace: "nowrap",
    flexShrink: 0
  },
  badgePlanned: {
    backgroundColor: "#fff3e0",
    color: PLANNED_BORDER
  },
  badgeLogged: {
    backgroundColor: "#e8f5e9",
    color: LOGGED_BORDER
  },
  entryActions: {
    display: "flex",
    gap: "4px",
    marginTop: "4px"
  },
  linkedMeetingBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    color: MEETING_BORDER,
    fontWeight: 500
  },
  // Meeting entries
  meetingEntry: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "8px",
    marginBottom: "4px",
    borderRadius: "6px",
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: MEETING_BORDER,
    backgroundColor: "#f5f5ff"
  },
  meetingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px"
  },
  meetingSubject: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#333",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0
  },
  meetingTime: {
    fontSize: "10px",
    color: "#666",
    whiteSpace: "nowrap",
    flexShrink: 0
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  linkDropdown: {
    flex: 1,
    minWidth: 0
  },
  linkedTaskRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px"
  },
  linkedTaskLabel: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0
  },
  durationRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  durationInput: {
    width: "70px"
  },
  meetingActions: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  empty: {
    padding: "16px",
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    fontSize: "12px"
  }
});

interface Props {
  workItems: WorkItem[];
}

export function TimePanel({ workItems }: Props) {
  const styles = useStyles();
  const currentDate = useDayStore((s) => s.currentDate);
  const blocks = useDayStore((s) => s.blocks);
  const meetingEntries = useDayStore((s) => s.meetingEntries);
  const selectedId = useDayStore((s) => s.selectedId);
  const updateBlock = useDayStore((s) => s.updateBlock);
  const removeBlock = useDayStore((s) => s.removeBlock);
  const addMeetingEntry = useDayStore((s) => s.addMeetingEntry);
  const updateMeetingEntry = useDayStore((s) => s.updateMeetingEntry);
  const removeMeetingEntry = useDayStore((s) => s.removeMeetingEntry);

  const listRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const dateBlocks = blocks.filter((b) => b.date === currentDate);
  const events = fakeCalendarEvents.filter((e) => e.start.startsWith(currentDate));
  const workItemById = new Map(workItems.map((wi) => [wi.id, wi]));
  const eventById = new Map(events.map((e) => [e.id, e]));
  const meetingEntryByEventId = new Map(meetingEntries.map((me) => [me.eventId, me]));

  // Stats
  const loggedMinutes = dateBlocks
    .filter((b) => b.state === "logged")
    .reduce((sum, b) => sum + b.durationMinutes, 0)
    + meetingEntries
      .filter((me) => me.state === "logged")
      .reduce((sum, me) => sum + me.durationMinutes, 0);

  const plannedMinutes = dateBlocks
    .filter((b) => b.state === "planned")
    .reduce((sum, b) => sum + b.durationMinutes, 0)
    + meetingEntries
      .filter((me) => me.state === "planned")
      .reduce((sum, me) => sum + me.durationMinutes, 0);

  // Scroll to selected entry
  useEffect(() => {
    if (!selectedId) return;
    const el = entryRefs.current.get(selectedId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  const setEntryRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) entryRefs.current.set(id, el);
    else entryRefs.current.delete(id);
  };

  const handleLinkMeeting = (event: CalendarEvent, workItemId: number) => {
    const start = parseIsoToMinutes(event.start);
    const end = parseIsoToMinutes(event.end);
    addMeetingEntry({
      eventId: event.id,
      workItemId,
      durationMinutes: end - start,
      description: "",
      state: "planned"
    });
  };

  const handleRelinkMeeting = (eventId: string, newWorkItemId: number) => {
    updateMeetingEntry(eventId, { workItemId: newWorkItemId });
  };

  const stepDuration = (eventId: string, current: number, delta: number) => {
    const next = current + delta;
    if (next >= SNAP_MINUTES) {
      updateMeetingEntry(eventId, { durationMinutes: next });
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.stats}>
          {formatDuration(loggedMinutes)} logged · {formatDuration(plannedMinutes)} planned
        </span>
      </div>
      <div className={styles.list} ref={listRef}>
        {/* Task block entries */}
        {dateBlocks.length > 0 && (
          <>
            <div className={styles.sectionLabel}>Task Entries</div>
            {dateBlocks.map((block) => {
              const wi = workItemById.get(block.workItemId);
              if (!wi) return null;
              const isLogged = block.state === "logged";
              const isSelected = selectedId === block.instanceId;
              const needsUpdate = !isLogged && !!block.freshbooksEntryId;

              return (
                <div
                  key={block.instanceId}
                  ref={setEntryRef(block.instanceId)}
                  className={mergeClasses(
                    styles.entry,
                    isLogged ? styles.entryLogged : styles.entryPlanned,
                    isSelected ? styles.entrySelected : undefined
                  )}
                >
                  <div className={styles.entryHeader}>
                    <span className={styles.entryTitle}>
                      #{wi.id} — {wi.title}
                    </span>
                    <span
                      className={mergeClasses(
                        styles.entryBadge,
                        isLogged ? styles.badgeLogged : styles.badgePlanned
                      )}
                    >
                      {formatDuration(block.durationMinutes)}
                    </span>
                  </div>
                  <div className={styles.entryMeta}>
                    {wi.teamName} · {formatClock(block.startMinutes)} – {formatClock(block.startMinutes + block.durationMinutes)}
                  </div>
                  {block.sourceEventId && (
                    <div className={styles.linkedMeetingBadge}>
                      <Link16Regular />
                      {eventById.get(block.sourceEventId)?.subject ?? "Meeting"}
                    </div>
                  )}
                  <Input
                    size="small"
                    placeholder="Description..."
                    value={block.description}
                    onChange={(_, data) => updateBlock(block.instanceId, { description: data.value })}
                    style={{ width: "100%" }}
                  />
                  <div className={styles.entryActions}>
                    {!isLogged && !needsUpdate && (
                      <Button
                        size="small"
                        appearance="primary"
                        icon={<Clock16Regular />}
                        onClick={() =>
                          updateBlock(block.instanceId, {
                            state: "logged",
                            freshbooksEntryId: `fake-${Date.now()}`
                          })
                        }
                      >
                        Log
                      </Button>
                    )}
                    {needsUpdate && (
                      <Button
                        size="small"
                        appearance="primary"
                        icon={<Clock16Regular />}
                        onClick={() =>
                          updateBlock(block.instanceId, { state: "logged" })
                        }
                      >
                        Update Entry
                      </Button>
                    )}
                    {isLogged && (
                      <Button
                        size="small"
                        appearance="primary"
                        icon={<Checkmark16Regular />}
                        onClick={() =>
                          updateBlock(block.instanceId, { description: block.description })
                        }
                      >
                        Save
                      </Button>
                    )}
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<Delete16Regular />}
                      onClick={() => removeBlock(block.instanceId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Meetings section — every meeting on this day */}
        {events.length > 0 && (
          <>
            <div className={styles.sectionLabel}>Meetings</div>
            {events.map((event) => {
              const start = parseIsoToMinutes(event.start);
              const end = parseIsoToMinutes(event.end);
              const me = meetingEntryByEventId.get(event.id);
              const linkedWi = me ? workItemById.get(me.workItemId) : undefined;

              return (
                <div
                  key={event.id}
                  ref={setEntryRef(`meeting-${event.id}`)}
                  className={mergeClasses(
                    styles.meetingEntry,
                    selectedId === `meeting-${event.id}` ? styles.entrySelected : undefined
                  )}
                >
                  <div className={styles.meetingHeader}>
                    <span className={styles.meetingSubject}>{event.subject}</span>
                    <span className={styles.meetingTime}>
                      {formatClock(start)} – {formatClock(end)} · {formatDuration(end - start)}
                    </span>
                  </div>

                  {!me ? (
                    /* Unlinked — show link dropdown */
                    <div className={styles.linkRow}>
                      <Timer16Regular style={{ color: MEETING_BORDER, flexShrink: 0 }} />
                      <Combobox
                        className={styles.linkDropdown}
                        placeholder="Link to task..."
                        size="small"
                        freeform={false}
                        onOptionSelect={(_, data) => {
                          if (data.optionValue) {
                            handleLinkMeeting(event, parseInt(data.optionValue, 10));
                          }
                        }}
                      >
                        {workItems.map((wi) => (
                          <Option key={wi.id} value={String(wi.id)} text={`#${wi.id} - ${wi.title} (${wi.teamName})`}>
                            #{wi.id} - {wi.title} ({wi.teamName})
                          </Option>
                        ))}
                      </Combobox>
                    </div>
                  ) : (
                    /* Linked — show entry details */
                    <>
                      <div className={styles.linkedTaskRow}>
                        <Link16Regular style={{ color: MEETING_BORDER, flexShrink: 0 }} />
                        <Combobox
                          className={styles.linkDropdown}
                          size="small"
                          freeform={false}
                          value={linkedWi ? `#${linkedWi.id} - ${linkedWi.title}` : ""}
                          selectedOptions={[String(me.workItemId)]}
                          onOptionSelect={(_, data) => {
                            if (data.optionValue) {
                              handleRelinkMeeting(event.id, parseInt(data.optionValue, 10));
                            }
                          }}
                        >
                          {workItems.map((wi) => (
                            <Option key={wi.id} value={String(wi.id)} text={`#${wi.id} - ${wi.title} (${wi.teamName})`}>
                              #{wi.id} - {wi.title} ({wi.teamName})
                            </Option>
                          ))}
                        </Combobox>
                      </div>
                      <Input
                        size="small"
                        placeholder="Description..."
                        value={me.description}
                        onChange={(_, data) => updateMeetingEntry(me.eventId, { description: data.value })}
                        style={{ width: "100%" }}
                      />
                      <div className={styles.durationRow}>
                        <Button
                          size="small"
                          appearance="subtle"
                          onClick={() => stepDuration(me.eventId, me.durationMinutes, -SNAP_MINUTES)}
                          disabled={me.durationMinutes <= SNAP_MINUTES}
                        >
                          −
                        </Button>
                        <span
                          className={mergeClasses(
                            styles.entryBadge,
                            me.state === "logged" ? styles.badgeLogged : styles.badgePlanned
                          )}
                        >
                          {formatDuration(me.durationMinutes)} {me.state}
                        </span>
                        <Button
                          size="small"
                          appearance="subtle"
                          onClick={() => stepDuration(me.eventId, me.durationMinutes, SNAP_MINUTES)}
                        >
                          +
                        </Button>
                      </div>
                      <div className={styles.meetingActions}>
                        {me.state !== "logged" ? (
                          <Button
                            size="small"
                            appearance="primary"
                            icon={<Clock16Regular />}
                            onClick={() => updateMeetingEntry(me.eventId, { state: "logged" })}
                          >
                            Log
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            appearance="primary"
                            icon={<Checkmark16Regular />}
                            onClick={() => updateMeetingEntry(me.eventId, { state: "logged" })}
                          >
                            Save
                          </Button>
                        )}
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Dismiss16Regular />}
                          onClick={() => removeMeetingEntry(me.eventId)}
                        >
                          Unlink
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}

        {dateBlocks.length === 0 && events.length === 0 && (
          <div className={styles.empty}>
            No time entries yet. Drag tasks onto the timeline or link meetings to tasks.
          </div>
        )}
      </div>
    </div>
  );
}
