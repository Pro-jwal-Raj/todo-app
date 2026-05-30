# Agent Prompt: Build the Ultimate Todo Application (2026 Edition)

## Current State

I have a basic React + Vite todo app with:
- Add/delete/toggle tasks
- Priority levels (Low/Medium/High)
- Date scheduling
- LocalStorage persistence
- Search & filter
- CSV export
- Stats dashboard
- Glassmorphism UI with responsive design

## Goal

Transform this into a **production-grade, feature-rich task management app** using the latest 2026 web technologies and UX patterns. Keep it as a single-page React app (no backend required), but make it feel like a premium product.

---

## Tech Stack Upgrade

- **React 19** with Server Components patterns (where applicable in SPA)
- **Vite 6** for build tooling
- **Framer Motion 12** for animations and gesture support
- **Zustand** or **Jotai** for state management (replace useState sprawl)
- **date-fns** or **Temporal API** (if browser support allows) for date handling
- **IndexedDB** (via Dexie.js) for persistent storage with offline support
- **View Transitions API** for smooth page/section transitions
- **Web Share API** for native sharing
- **Notification API** for task reminders
- **PWA support** (service worker, manifest, installable)

---

## Features to Implement

### 1. Task Management (Enhanced)
- **Subtasks/Checklists** — nested items within a task
- **Tags/Labels** — color-coded, user-created labels
- **Categories/Projects** — group tasks into projects
- **Recurring tasks** — daily, weekly, monthly, custom recurrence
- **Task dependencies** — mark tasks that block other tasks
- **Drag-and-drop reordering** (use dnd-kit or similar)
- **Inline editing** — click to edit title, date, priority directly
- **Markdown support** in task descriptions/notes
- **File/image attachments** (stored in IndexedDB as blobs)
- **Time estimation** — estimated vs actual time tracking

### 2. Views & Organization
- **Kanban board view** — columns by status (To Do / In Progress / Done)
- **Calendar view** — see tasks on a monthly/weekly calendar
- **List view** (current, enhanced)
- **Timeline/Gantt view** — visualize task durations
- **Focus mode** — show only today's tasks, distraction-free
- **Eisenhower Matrix view** — 4-quadrant urgency/importance grid

### 3. Smart Features (2026 AI/ML-Enhanced)
- **AI task suggestions** — auto-suggest task breakdown from a goal (use local LLM or API)
- **Smart scheduling** — AI suggests optimal time slots based on priority and workload
- **Natural language input** — type "Buy groceries tomorrow at 5pm high priority" and auto-parse
- **Smart categories** — auto-categorize tasks using keyword analysis
- **Productivity insights** — AI-generated weekly reports on patterns and suggestions

### 4. Time & Productivity
- **Built-in Pomodoro timer** — start focus sessions tied to specific tasks
- **Time tracking** — log time spent on each task
- **Streaks & habits** — track daily completion streaks
- **Daily/weekly goals** — set targets (e.g., "complete 5 tasks/day")
- **Productivity score** — gamified metrics based on completion rate, consistency

### 5. Notifications & Reminders
- **Browser push notifications** for upcoming deadlines
- **Snooze reminders** — remind me in 15min/1hr/tomorrow
- **Overdue task alerts** — highlight and notify for missed deadlines
- **Daily digest** — morning summary of today's tasks

### 6. Collaboration (Optional/Local-first)
- **Share task lists** via link (export as JSON/URL)
- **Web Share API integration** — native OS share dialog
- **Import/export** — JSON, CSV, Markdown formats
- **Sync across tabs** using BroadcastChannel API

### 7. Customization & Theming
- **Multiple themes** — dark, light, OLED black, custom color schemes
- **Accent color picker** — personalize gradient colors
- **Font size/family settings**
- **Layout density** — compact, comfortable, spacious
- **Custom keyboard shortcuts**
- **Widget/dashboard customization** — drag-and-drop stat cards

### 8. Data & Analytics
- **Advanced statistics** — charts (completion rate over time, tasks by priority/category)
- **Heatmap** — GitHub-style contribution/activity heatmap
- **Weekly/monthly reports** — PDF or image export of productivity
- **Data visualization** using Chart.js or Recharts

### 9. Accessibility & Performance
- **Full keyboard navigation** with visible focus indicators
- **Screen reader friendly** (ARIA labels, live regions)
- **Reduced motion support** — respect `prefers-reduced-motion`
- **Skeleton loading states**
- **Virtual scrolling** for large task lists (TanStack Virtual)
- **< 100ms interaction latency**

### 10. Modern UX Patterns
- **Command palette** (Cmd+K) — search tasks, run actions, navigate
- **Undo/redo** with toast notifications ("Task deleted. Undo?")
- **Optimistic UI updates**
- **Haptic feedback patterns** (for mobile via Vibration API)
- **Smooth spring animations** on all interactions
- **Empty states** with illustrations and onboarding tips
- **Onboarding tour** for first-time users
- **Context menus** (right-click) on tasks

### 11. PWA & Offline
- **Installable** on desktop and mobile
- **Offline-first** — full functionality without internet
- **Background sync** when reconnected
- **App badges** showing pending task count

---

## UI/UX Design Direction

- Keep the current **glassmorphism** aesthetic but elevate it
- Add **micro-interactions** on every action (button press, task complete, delete)
- Use **spring physics** for natural-feeling animations
- **Gradient mesh backgrounds** that subtly shift
- **Blur layers** and **depth** to create visual hierarchy
- **Floating action button** on mobile for quick-add
- **Bottom sheet** pattern on mobile for task details
- **Smooth page transitions** using View Transitions API
- Typography: Inter for body, display font for headings
- Consistent **8px spacing grid**

---

## File Structure (Suggested)

```
src/
├── components/
│   ├── layout/        (Header, Sidebar, Container)
│   ├── tasks/         (TaskCard, TaskForm, TaskList, KanbanBoard)
│   ├── views/         (ListView, CalendarView, KanbanView, FocusView)
│   ├── stats/         (StatCard, Charts, Heatmap)
│   ├── common/        (Button, Input, Modal, CommandPalette, Toast)
│   └── timer/         (PomodoroTimer, TimeTracker)
├── stores/            (Zustand/Jotai stores)
├── hooks/             (useLocalStorage, useNotifications, useTimer, etc.)
├── utils/             (dateHelpers, nlpParser, csvExport, etc.)
├── styles/            (global CSS, theme variables, animations)
├── constants/         (priorities, categories, defaults)
└── types/             (TypeScript interfaces if using TS)
```

---

## Priority Order for Implementation

1. **State management refactor** (Zustand) + IndexedDB persistence
2. **Enhanced task model** (subtasks, tags, categories, notes)
3. **Multiple views** (List, Kanban, Calendar)
4. **Command palette** + keyboard shortcuts
5. **Pomodoro timer** + time tracking
6. **Animations** (Framer Motion throughout)
7. **Charts & analytics**
8. **Natural language input**
9. **PWA setup** + notifications
10. **Theming system**
11. **AI features** (suggestions, insights)

---

## Constraints

- Must remain a **client-side only** app (no backend server)
- All data stored locally (IndexedDB + localStorage fallback)
- Must be **fast** — no perceptible lag on any interaction
- Must work on **mobile** and **desktop**
- Accessibility is **not optional**
- Keep bundle size reasonable (code-split views)

---

## Example Natural Language Inputs to Support

- "Buy milk tomorrow morning high priority"
- "Finish report by Friday #work"
- "Call dentist every month"
- "Read 30 pages daily"
- "Team meeting at 3pm today"

---

Build this step by step, starting with the state management refactor and enhanced task model. After each major feature, ensure the app still works correctly and looks polished.
