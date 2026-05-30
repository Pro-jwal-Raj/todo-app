# TaskFlow User Guide

Welcome to TaskFlow! This guide covers every feature to help you get the most out of the app.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Tasks](#creating-tasks)
3. [Managing Tasks](#managing-tasks)
4. [Views](#views)
5. [Groups & Collaboration](#groups--collaboration)
6. [Group Chat](#group-chat)
7. [Pomodoro Timer](#pomodoro-timer)
8. [Analytics](#analytics)
9. [Command Palette](#command-palette)
10. [Theme & Profile](#theme--profile)
11. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### Sign Up / Sign In

1. Open the app — you'll see the login page
2. Click **Sign Up** to create an account with email + password
3. Enter a display name (this is visible to group members)
4. After signing up, you'll be logged in automatically

### Navigation

- The **sidebar** (left) shows all views, groups, projects, and tags
- Click the **hamburger menu** (☰) to collapse/expand the sidebar
- Use **Ctrl+K** (or ⌘K on Mac) to open the command palette for quick navigation

---

## Creating Tasks

### Quick Add (Natural Language)

Type naturally in the task input field:

| Input | Result |
|-------|--------|
| `Buy groceries tomorrow high` | Title: "Buy groceries", Due: tomorrow, Priority: High |
| `Meeting with team on Friday` | Title: "Meeting with team", Due: Friday |
| `Fix bug #urgent` | Title: "Fix bug", Tag: urgent |

The NLP parser detects:
- **Dates:** today, tomorrow, next Monday, Jan 15, etc.
- **Priority:** high, medium, low, urgent, important
- **Tags:** words starting with `#`

### Manual Task Creation

Click the **+ Add Task** button to open the full form:

- **Title** (required)
- **Description** — additional details
- **Date** — due date
- **Priority** — Low / Medium / High
- **Tags** — categorize tasks
- **Subtasks** — break into smaller steps
- **Estimated Time** — for Pomodoro integration
- **Recurrence** — daily, weekly, monthly repeats

---

## Managing Tasks

### Status Changes

Tasks have three statuses:
- **To Do** — not started
- **In Progress** — currently working on
- **Done** — completed

Click the status icon on a task card to cycle through statuses. An **Undo** toast appears for 3 seconds if you want to revert.

### Edit & Delete

- Click a task card to edit its details
- Use the trash icon to delete

### Import / Export

In List view:
- **Export** (↓) — downloads all tasks as JSON
- **Import** (↑) — upload a JSON file to restore tasks

---

## Views

### List View (📋)

The default view. Shows all tasks in a filterable, searchable list.
- **Search** — filter by title
- **Sort** — by date, priority, or status
- Tasks grouped by status sections

### Kanban Board (📊)

Drag-and-drop board with columns:
- **To Do** → **In Progress** → **Done**
- Drag a card between columns to update status
- Undo toast appears after each move

### Calendar View (📅)

Tasks displayed on a monthly calendar grid.
- Tasks appear on their due date
- Click a day to see tasks for that date
- Navigate between months with arrows

### Focus Mode (🎯)

Distraction-free view showing only your current task.
- Shows one task at a time
- Integrated with Pomodoro timer
- Progress indicator

---

## Groups & Collaboration

### Create a Group

1. Go to **Groups** view (sidebar → Manage Groups)
2. Click **Create**
3. Enter:
   - Group name
   - Description (optional)
   - Type: Business / Family / Students / Custom
4. You become the **Owner**

### Join a Group

1. Click **Join** in the Groups view
2. Enter the invite code (shared by an admin)
3. You join as a **Member**

### Invite Members

- Click the **copy icon** next to the invite code in group details
- Share the code with others

### Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full control, delete group, manage all members |
| **Admin** | Add/remove members, assign tasks |
| **Member** | View tasks, update assigned tasks, chat |

### Group Tasks

- When a group is active (selected in sidebar), all task views show group tasks
- You can assign tasks to other group members
- Click **Personal Tasks** to switch back to your own tasks

---

## Group Chat

### Access Chat

- **From Groups view:** Chat panel appears below the members list when a group is selected
- **From any view:** A floating chat button (💬) appears in the bottom-right corner when a group is active

### Features

- **Real-time messaging** — messages appear instantly for all members
- **Typing indicators** — see when others are typing
- **Emoji picker** — click the 😊 icon for quick emojis
- **Link detection** — URLs are automatically clickable
- **Unread badges** — shows count when chat is minimized
- **Notification sound** — subtle sound on new messages
- **Date separators** — visual day dividers
- **Delete messages** — remove your own messages
- **Scroll to bottom** — button appears when scrolled up

### Tips

- Press **Enter** to send, **Shift+Enter** for new line
- Press **Escape** to minimize the floating chat
- Links are auto-detected and truncated if too long

---

## Pomodoro Timer

### Start a Session

1. Click the timer icon on any task card, or
2. Use the Pomodoro Timer in the bottom bar

### How It Works

- **Work:** 25 minutes of focused work
- **Break:** 5 minutes rest
- **Long Break:** 15 minutes after 4 work sessions

### Controls

- **Start** — begin a work session
- **Pause** — pause the timer (preserves remaining time)
- **Resume** — continue from where you paused
- **Dismiss** — cancel the current session

Time spent is automatically tracked on the associated task.

### Customization

Default settings (configurable):
- Work duration: 25 min
- Break duration: 5 min
- Long break: 15 min
- Sessions before long break: 4

---

## Analytics

The **Analytics** view (📈) shows:

- **Completion rate** — percentage of tasks done
- **Tasks by priority** — distribution chart
- **Tasks by status** — pie/bar chart
- **Time spent** — total tracked time
- **Productivity trends** — over time
- **Overdue tasks** — tasks past their due date

---

## Command Palette

Press **Ctrl+K** (Windows/Linux) or **⌘K** (Mac) to open.

Quick actions:
- Switch views (list, kanban, calendar, focus)
- Search tasks by title
- Mark tasks as done
- Navigate to groups

Type to filter, use arrow keys to navigate, Enter to select.

---

## Theme & Profile

### Switch Theme

Click the **sun/moon** icon in the sidebar to toggle between:
- **Dark mode** — deep navy background (default)
- **Light mode** — clean white background

Your preference is saved automatically.

### Edit Profile

Click your **avatar** (the circle with your initial) in the sidebar to:
- Change your display name
- View your email

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `⌘K` | Open command palette |
| `Enter` | Send chat message |
| `Escape` | Close modals / minimize chat |

---

## Troubleshooting

### Tasks not syncing?
- Check your internet connection
- Verify Supabase credentials in environment variables
- Look for the "↻ Syncing..." indicator in the header

### Groups not working?
- Ensure the database schema SQL was run successfully
- Check that Realtime is enabled for `tasks`, `group_members`, `group_messages`
- Verify the RPC functions exist in Supabase → Database → Functions

### Chat messages not appearing in real-time?
- Enable Realtime for the `group_messages` table in Supabase
- Check browser console for WebSocket connection errors

### Can't log in?
- Ensure email confirmation is disabled in Supabase → Auth → Settings (for development)
- Check that your Supabase URL and anon key are correct

---

## Support

If you encounter any issues, please [open an issue](https://github.com/YOUR_USERNAME/todo-app/issues) on GitHub.
