# ✨ TaskFlow

A full-featured, production-grade task management application built with React, Vite, and Supabase. Includes group collaboration, real-time chat, Kanban boards, Pomodoro timer, analytics, and more.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

| Category | Features |
|----------|----------|
| **Task Management** | Create, edit, delete tasks • Priority levels • Tags • Subtasks • Due dates • Recurrence • NLP natural-language input |
| **Views** | List view • Kanban board (drag & drop) • Calendar view • Focus mode |
| **Collaboration** | Groups (create/join via invite code) • Task assignment • Member roles (owner/admin/member) |
| **Real-time Chat** | Group messaging • Typing indicators • Emoji picker • Link detection • Notification sounds • Unread badges • Floating chat on all views |
| **Productivity** | Pomodoro timer • Time tracking • Analytics dashboard • Undo status changes |
| **UX/UI** | Dark & light themes • Animated transitions • Command palette (Ctrl+K) • Responsive design • Code-split lazy loading |
| **Auth & Cloud** | Supabase authentication • Row-level security • Real-time sync • Import/Export |

---

## Tech Stack

- **Frontend:** React 19, Vite 8, Framer Motion, Recharts, dnd-kit
- **State:** Zustand (persisted + cloud stores)
- **Backend:** Supabase (Auth, PostgreSQL, Realtime, RLS)
- **Styling:** Custom CSS with CSS variables (dark/light theme)
- **Build:** Vite with Rolldown, code-splitting

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- A free [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone https://github.com/Pro-jwal-Raj/todo-app.git
cd todo-app
npm install
```

### 2. Configure Environment

Copy the example env file and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: [Supabase Dashboard](https://app.supabase.com) → Project Settings → API

### 3. Setup Database

Run the SQL schema in your Supabase SQL Editor:

1. Open your Supabase project → **SQL Editor**
2. Copy the contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Click **Run**

This creates all tables, RLS policies, helper functions, and indexes.

### 4. Enable Realtime

In Supabase Dashboard → **Database** → **Replication**:
- Enable realtime for: `tasks`, `group_members`, `group_messages`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
todo-app/
├── public/                  # Static assets (favicon, icons)
├── supabase/
│   └── schema.sql           # Complete database schema
├── src/
│   ├── main.jsx             # App entry point
│   ├── App.jsx              # Root component + routing
│   ├── App.css              # All styles (themed)
│   ├── lib/
│   │   └── supabase.js      # Supabase client init
│   ├── stores/
│   │   ├── appStore.js      # UI state (view, theme, pomodoro)
│   │   ├── authStore.js     # Authentication state
│   │   ├── taskStore.js     # Tasks (local + cloud)
│   │   ├── groupStore.js    # Groups & members
│   │   └── chatStore.js     # Chat messages & realtime
│   ├── components/
│   │   ├── common/          # Toast, CommandPalette, ProfileModal
│   │   ├── layout/          # Sidebar
│   │   ├── groups/          # GroupsPanel, GroupChat, FloatingChat
│   │   ├── tasks/           # TaskCard, TaskForm
│   │   ├── timer/           # PomodoroTimer
│   │   ├── stats/           # StatsPanel
│   │   └── views/           # ListView, KanbanView, CalendarView, FocusView
│   └── utils/
│       ├── dateHelpers.js   # Date formatting utilities
│       └── nlpParser.js     # Natural language task parsing
├── .env.example             # Environment template
├── .gitignore
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## Deployment

### Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Deploy — Vercel auto-detects Vite

### Deploy to Netlify (Free)

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in site settings

---

## Documentation

- [User Guide](docs/USER_GUIDE.md) — How to use every feature
- [Contributing](CONTRIBUTING.md) — How to contribute
- [Changelog](CHANGELOG.md) — Version history

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [React](https://react.dev) — UI framework
- [Vite](https://vite.dev) — Build tool
- [Supabase](https://supabase.com) — Backend as a service
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [dnd-kit](https://dndkit.com/) — Drag and drop
- [Recharts](https://recharts.org/) — Charts
- [React Icons](https://react-icons.github.io/react-icons/) — Icon library
