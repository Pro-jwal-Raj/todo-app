import { useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAppStore from "./stores/appStore";
import useAuthStore from "./stores/authStore";
import useGroupStore from "./stores/groupStore";
import useTaskStore from "./stores/taskStore";
import useChatStore from "./stores/chatStore";
import Sidebar from "./components/layout/Sidebar";
import PomodoroTimer from "./components/timer/PomodoroTimer";
import CommandPalette from "./components/common/CommandPalette";
import ToastContainer from "./components/common/Toast";
import FloatingChat from "./components/groups/FloatingChat";
import "./App.css";

// Lazy-load views for code splitting
const ListView = lazy(() => import("./components/views/ListView"));
const KanbanView = lazy(() => import("./components/views/KanbanView"));
const CalendarView = lazy(() => import("./components/views/CalendarView"));
const FocusView = lazy(() => import("./components/views/FocusView"));
const StatsPanel = lazy(() => import("./components/stats/StatsPanel"));
const GroupsPanel = lazy(() => import("./components/groups/GroupsPanel"));
const AuthPage = lazy(() => import("./components/auth/AuthPage"));

const views = {
  list: ListView,
  kanban: KanbanView,
  calendar: CalendarView,
  focus: FocusView,
  stats: StatsPanel,
  groups: GroupsPanel,
};

export default function App() {
  const currentView = useAppStore((s) => s.currentView);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const theme = useAppStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);
  const fetchGroups = useGroupStore((s) => s.fetchGroups);
  const activeGroup = useGroupStore((s) => s.activeGroup);
  const resetGroups = useGroupStore((s) => s.reset);
  const resetChat = useChatStore((s) => s.reset);
  const loadCloudTasks = useTaskStore((s) => s.loadCloudTasks);
  const subscribeToTasks = useTaskStore((s) => s.subscribeToTasks);
  const unsubscribeFromTasks = useTaskStore((s) => s.unsubscribeFromTasks);
  const disconnectCloud = useTaskStore((s) => s.disconnectCloud);
  const syncing = useTaskStore((s) => s.syncing);

  useEffect(() => {
    initialize();
  }, []);

  // Fetch groups when user logs in, reset on logout
  useEffect(() => {
    if (user) {
      fetchGroups();
    } else {
      disconnectCloud();
      resetGroups();
      resetChat();
    }
  }, [user]);

  // Load cloud tasks + subscribe to real-time when group/user changes
  useEffect(() => {
    let cancelled = false;
    async function setup() {
      if (user && activeGroup) {
        await loadCloudTasks(activeGroup.id);
        if (!cancelled) subscribeToTasks(user.id, activeGroup.id);
      } else if (user) {
        await loadCloudTasks(null);
        if (!cancelled) subscribeToTasks(user.id, null);
      }
    }
    setup();
    return () => {
      cancelled = true;
      unsubscribeFromTasks();
    };
  }, [user, activeGroup]);

  // Show loading spinner during auth init
  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading TaskFlow...</p>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return (
      <Suspense fallback={<div className="app-loading"><div className="loading-spinner" /></div>}>
        <AuthPage />
        <ToastContainer />
      </Suspense>
    );
  }

  const ViewComponent = views[currentView] || ListView;

  return (
    <div className={`app ${theme === "light" ? "theme-light" : ""}`}>
      <div className="app-bg">
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />
        <div className="bg-gradient-3" />
      </div>

      <Sidebar />

      <main className={`main-content ${sidebarOpen ? "with-sidebar" : "full"}`}>
        <div className="content-wrapper">
          <motion.div className="view-header" layout>
            <div className="header-badge">
              {currentView === "list" && "📋"}
              {currentView === "kanban" && "📊"}
              {currentView === "calendar" && "📅"}
              {currentView === "focus" && "🎯"}
              {currentView === "stats" && "📈"}
              {currentView === "groups" && "👥"}
            </div>
            <h1 className="app-title">
              {currentView === "list" && (activeGroup ? activeGroup.name : "My Tasks")}
              {currentView === "kanban" && "Kanban Board"}
              {currentView === "calendar" && "Calendar"}
              {currentView === "focus" && "Focus Mode"}
              {currentView === "stats" && "Analytics"}
              {currentView === "groups" && "Groups"}
            </h1>
            <p className="app-subtitle">
              {activeGroup
                ? `Group tasks • ${activeGroup.type}`
                : "Stay organized. Stay productive."}
              {syncing && <span className="sync-indicator"> ↻ Syncing...</span>}
            </p>
            <div className="header-accent-line" />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<div className="view-loading"><div className="loading-spinner" /></div>}>
                <ViewComponent />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating chat - visible on all views when a group is active */}
      {activeGroup && currentView !== "groups" && (
        <FloatingChat groupId={activeGroup.id} groupName={activeGroup.name} />
      )}

      <PomodoroTimer />
      <CommandPalette />
      <ToastContainer />
    </div>
  );
}