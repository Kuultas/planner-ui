import { WorkItem } from "../types";

export const fakeWorkItems: WorkItem[] = [
  { id: 9012, title: "Auth refactor", teamName: "Project Alpha", dueDate: null, workItemType: "Task" },
  { id: 1234, title: "Fix login bug", teamName: "Project Alpha", dueDate: "2026-04-14", workItemType: "Bug" },
  { id: 5678, title: "Update API docs", teamName: "Project Beta", dueDate: "2026-04-12", workItemType: "Task" },
  { id: 2345, title: "DB migration script", teamName: "Project Alpha", dueDate: "2026-04-14", workItemType: "Task" },
  { id: 7890, title: "Review PR #42", teamName: "Project Gamma", dueDate: "2026-04-14", workItemType: "Task" },
  { id: 3456, title: "Implement caching layer", teamName: "Project Beta", dueDate: "2026-04-16", workItemType: "User Story" },
  { id: 4567, title: "Setup monitoring alerts", teamName: "Project Gamma", dueDate: "2026-04-18", workItemType: "Task" },
  { id: 5679, title: "Refactor notification service", teamName: "Project Alpha", dueDate: "2026-04-25", workItemType: "User Story" },
  { id: 6789, title: "Write integration tests", teamName: "Project Beta", dueDate: "2026-04-29", workItemType: "Task" },
  { id: 7891, title: "Upgrade Node runtime", teamName: "Project Alpha", dueDate: null, workItemType: "Task" },
  { id: 8901, title: "Customer escalation response", teamName: "Project Gamma", dueDate: "2026-04-15", workItemType: "Bug" },
  { id: 9013, title: "Weekly report", teamName: "Project Beta", dueDate: "2026-04-14", workItemType: "Task" }
];
