# Changelog

All notable changes to TaskFlow are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.0] - 2026-05-30

### Added

- **Core Task Management**
  - Create, edit, delete tasks with title, description, priority, tags, subtasks
  - Due dates with natural language parsing (NLP)
  - Task recurrence (daily, weekly, monthly)
  - Status workflow: To Do → In Progress → Done
  - Undo last status change with toast action
  - Import/Export tasks as JSON

- **Multiple Views**
  - List view with search and sorting
  - Kanban board with drag-and-drop (dnd-kit)
  - Calendar view (monthly grid)
  - Focus mode (single-task view)

- **Groups & Collaboration**
  - Create groups (Business, Family, Students, Custom types)
  - Join groups via invite code
  - Roles: Owner, Admin, Member
  - Task assignment within groups
  - Security: assignees restricted from privilege escalation

- **Real-time Group Chat**
  - Send/receive messages instantly via Supabase Realtime
  - Typing indicators (broadcast-based)
  - Emoji quick-picker (8 common emojis)
  - Link auto-detection and rendering
  - Unread message badges
  - Notification sound on new messages
  - Date separators in message history
  - Scroll-to-bottom button
  - Delete own messages
  - Floating chat widget on all task views

- **Pomodoro Timer**
  - 25/5/15 minute work/break/long-break cycles
  - Pause/resume with drift-proof timing
  - Auto time tracking on associated task
  - Configurable durations

- **Analytics Dashboard**
  - Completion rate, priority distribution, status breakdown
  - Time tracking summary
  - Overdue task alerts
  - Charts via Recharts

- **UX & Polish**
  - Dark and light theme with toggle
  - Profile editing (display name)
  - Command palette (Ctrl+K) for quick navigation
  - Animated transitions (Framer Motion)
  - Responsive layout
  - Code-split lazy loading for all views
  - Loading spinners and skeleton states

- **Authentication & Security**
  - Supabase Auth (email/password)
  - Auto profile creation on signup
  - Row-Level Security on all tables
  - SECURITY DEFINER helper functions to prevent policy recursion
  - Atomic group creation/join via RPC functions

- **Infrastructure**
  - Vite 8 build with Rolldown
  - Vendor code-splitting (charts, dnd, icons)
  - ESLint configuration
  - Environment variable validation
  - Complete SQL schema with indexes and realtime

---

## [Unreleased]

### Planned
- File attachments in chat
- Message reactions (emoji)
- Push notifications
- Task comments
- Mobile PWA support
- Activity feed per group
- Task templates
