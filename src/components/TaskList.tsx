import { Button, Dropdown, Input, makeStyles, mergeClasses, Option, tokens } from "@fluentui/react-components";
import { Search24Regular, Settings24Regular } from "@fluentui/react-icons";
import { useMemo, useState } from "react";
import { TeamName, Urgency, WorkItem } from "../types";
import { TaskCard } from "./TaskCard";

const useStyles = makeStyles({
  root: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: 0
  },
  header: {
    padding: "10px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0
  },
  filters: {
    padding: "6px 12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    gap: "6px",
    alignItems: "center",
    flexShrink: 0
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 12px 12px"
  },
  groupLabel: {
    fontSize: "10px",
    fontWeight: 600,
    padding: "8px 4px 3px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  groupOverdue: { color: "#d13438" },
  groupToday: { color: "#ca5010" },
  groupWeek: { color: "#0f6cbd" },
  groupLater: { color: tokens.colorNeutralForeground3 },
  footer: {
    padding: "8px 12px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    justifyContent: "flex-end",
    flexShrink: 0
  },
  count: {
    fontSize: "10px",
    fontWeight: 600,
    padding: "2px 10px",
    borderRadius: "10px",
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2
  }
});

interface Props {
  workItems: WorkItem[];
  today: string;
}

interface Grouped {
  overdue: WorkItem[];
  today: WorkItem[];
  thisWeek: WorkItem[];
  later: WorkItem[];
}

function groupByUrgency(items: WorkItem[], today: string): Grouped {
  const out: Grouped = { overdue: [], today: [], thisWeek: [], later: [] };
  const todayDate = new Date(today + "T00:00:00");
  const weekEnd = new Date(todayDate);
  weekEnd.setDate(weekEnd.getDate() + 7);
  for (const item of items) {
    if (!item.dueDate) {
      out.later.push(item);
      continue;
    }
    const due = new Date(item.dueDate + "T00:00:00");
    if (due < todayDate) out.overdue.push(item);
    else if (due.getTime() === todayDate.getTime()) out.today.push(item);
    else if (due <= weekEnd) out.thisWeek.push(item);
    else out.later.push(item);
  }
  return out;
}

export function TaskList({ workItems, today }: Props) {
  const styles = useStyles();
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamName | "">("");

  const teams = useMemo(
    () => Array.from(new Set(workItems.map((wi) => wi.teamName))).sort(),
    [workItems]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return workItems.filter((wi) => {
      if (selectedTeam && wi.teamName !== selectedTeam) return false;
      if (q && !wi.title.toLowerCase().includes(q) && !String(wi.id).includes(q))
        return false;
      return true;
    });
  }, [workItems, search, selectedTeam]);

  const grouped = groupByUrgency(filtered, today);

  const renderGroup = (label: string, labelClass: string, items: WorkItem[], urgency: Urgency) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className={mergeClasses(styles.groupLabel, labelClass)}>{label}</div>
        {items.map(wi => (
          <TaskCard key={wi.id} workItem={wi} urgency={urgency} />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.count}>{filtered.length} items</span>
      </div>
      <div className={styles.filters}>
        <Input
          contentBefore={<Search24Regular />}
          placeholder="Filter tasks..."
          size="small"
          style={{ flex: 1 }}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
        />
        <Dropdown
          size="small"
          placeholder="All projects"
          style={{ minWidth: "130px" }}
          value={selectedTeam || "All projects"}
          selectedOptions={selectedTeam ? [selectedTeam] : []}
          onOptionSelect={(_, data) => {
            setSelectedTeam(
              data.optionValue === selectedTeam ? "" : (data.optionValue as TeamName) ?? ""
            );
          }}
        >
          {teams.map((team) => (
            <Option key={team} value={team}>
              {team}
            </Option>
          ))}
        </Dropdown>
      </div>
      <div className={styles.list}>
        {renderGroup("Overdue", styles.groupOverdue, grouped.overdue, "overdue")}
        {renderGroup("Due Today", styles.groupToday, grouped.today, "today")}
        {renderGroup("This Week", styles.groupWeek, grouped.thisWeek, "thisWeek")}
        {renderGroup("Later", styles.groupLater, grouped.later, "later")}
      </div>
      <div className={styles.footer}>
        <Button size="small" appearance="subtle" icon={<Settings24Regular />}>
          Configure Query
        </Button>
      </div>
    </div>
  );
}
