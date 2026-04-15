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
  Link16Regular,
  Timer16Regular
} from "@fluentui/react-icons";
import { useEffect, useRef } from "react";
import { useDayStore } from "../state/useDayStore";
import { CalendarEvent, MeetingTimeEntry, WorkItem } from "../types";
import { fakeCalendarEvents } from "../data/fakeCalendarEvents";
import { formatClock, formatDuration, parseIsoToMinutes } from "../utils/timeGrid";

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
  // Unlinked meetings
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
  // Linked meeting entries (nested under task)
  nestedMeeting: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "6px 8px",
    marginLeft: "8px",
    marginTop: "2px",
    borderRadius: "4px",
    borderLeftWidth: "2px",
    borderLeftStyle: "solid",
    borderLeftColor: MEETING_BORDER,
    backgroundColor: "#f5f5ff",
    fontSize: "11px"
  },
  nestedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "6px"
  },
  nestedSubject: {
    fontWeight: 600,
    color: "#444",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0
  },
  durationInput: {
    width: "70px"
  },
  nestedActions: {
    display: "flex",
    gap: "4px",
    alignItems: "center"
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

  // Figure out which meetings are linked via meetingEntries
  const linkedEventIds = new Set(meetingEntries.map((me) => me.eventId));
  const unlinkedEvents = events.filter((e) => !linkedEventIds.has(e.id));

  // Group meeting entries by workItemId
  const meetingEntriesByWorkItem = new Map<number, MeetingTimeEntry[]>();
  for (const me of meetingEntries) {
    const list = meetingEntriesByWorkItem.get(me.workItemId) ?? [];
    list.push(me);
    meetingEntriesByWorkItem.set(me.workItemId, list);
  }

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

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.stats}>
          {formatDuration(loggedMinutes)} logged · {formatDuration(plannedMinutes)} planned
        </span>
      </div>
      <div className={styles.list} ref={listRef}>
        {/* Time Entries (task blocks) */}
        {dateBlocks.length > 0 && (
          <>
            <div className={styles.sectionLabel}>Time Entries</div>
            {dateBlocks.map((block) => {
              const wi = workItemById.get(block.workItemId);
              if (!wi) return null;
              const isLogged = block.state === "logged";
              const isSelected = selectedId === block.instanceId;
              const linkedMeetings = meetingEntriesByWorkItem.get(block.workItemId) ?? [];

              return (
                <div key={block.instanceId}>
                  <div
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
                      {!isLogged && (
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
                      {isLogged && (
                        <Button
                          size="small"
                          appearance="primary"
                          icon={<Checkmark16Regular />}
                          onClick={() =>
                            updateBlock(block.instanceId, { description: block.description })
                          }
                        >
                          Update
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
                  {/* Nested linked meetings for this work item */}
                  {linkedMeetings.map((me) => {
                    const event = eventById.get(me.eventId);
                    if (!event) return null;
                    const meIsLogged = me.state === "logged";
                    return (
                      <div
                        key={me.eventId}
                        ref={setEntryRef(`meeting-${me.eventId}`)}
                        className={mergeClasses(
                          styles.nestedMeeting,
                          selectedId === `meeting-${me.eventId}` ? styles.entrySelected : undefined
                        )}
                      >
                        <div className={styles.nestedHeader}>
                          <span className={styles.nestedSubject}>
                            <Link16Regular style={{ verticalAlign: "middle", marginRight: 4 }} />
                            {event.subject}
                          </span>
                          <span style={{ fontSize: "10px", color: "#666" }}>
                            {formatClock(parseIsoToMinutes(event.start))} – {formatClock(parseIsoToMinutes(event.end))}
                          </span>
                        </div>
                        <Input
                          size="small"
                          placeholder="Description..."
                          value={me.description}
                          onChange={(_, data) => updateMeetingEntry(me.eventId, { description: data.value })}
                          style={{ width: "100%" }}
                        />
                        <div className={styles.nestedActions}>
                          <Input
                            className={styles.durationInput}
                            size="small"
                            type="number"
                            value={String(me.durationMinutes)}
                            contentAfter={<span style={{ fontSize: "10px" }}>min</span>}
                            onChange={(_, data) => {
                              const val = parseInt(data.value, 10);
                              if (!isNaN(val) && val > 0) {
                                updateMeetingEntry(me.eventId, { durationMinutes: val });
                              }
                            }}
                          />
                          <span
                            className={mergeClasses(
                              styles.entryBadge,
                              meIsLogged ? styles.badgeLogged : styles.badgePlanned
                            )}
                          >
                            {formatDuration(me.durationMinutes)}
                          </span>
                          {!meIsLogged && (
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Clock16Regular />}
                              onClick={() => updateMeetingEntry(me.eventId, { state: "logged" })}
                            >
                              Log
                            </Button>
                          )}
                          {meIsLogged && (
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<Checkmark16Regular />}
                              disabled
                            >
                              Logged
                            </Button>
                          )}
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Delete16Regular />}
                            onClick={() => removeMeetingEntry(me.eventId)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {/* Unlinked Meetings */}
        {unlinkedEvents.length > 0 && (
          <>
            <div className={styles.sectionLabel}>Unlinked Meetings</div>
            {unlinkedEvents.map((event) => {
              const start = parseIsoToMinutes(event.start);
              const end = parseIsoToMinutes(event.end);
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
                </div>
              );
            })}
          </>
        )}

        {dateBlocks.length === 0 && unlinkedEvents.length === 0 && (
          <div className={styles.empty}>
            No time entries yet. Drag tasks onto the timeline or link meetings to tasks.
          </div>
        )}
      </div>
    </div>
  );
}
