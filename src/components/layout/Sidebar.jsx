import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAppStore from "../../stores/appStore";
import useTaskStore from "../../stores/taskStore";
import useAuthStore from "../../stores/authStore";
import useGroupStore from "../../stores/groupStore";
import ProfileModal from "../common/ProfileModal";
import {
  FiList,
  FiLayout,
  FiCalendar,
  FiTarget,
  FiBarChart2,
  FiCommand,
  FiMenu,
  FiTag,
  FiFolder,
  FiUsers,
  FiLogOut,
  FiSun,
  FiMoon,
} from "react-icons/fi";

const navItems = [
  { id: "list", label: "List", icon: <FiList /> },
  { id: "kanban", label: "Kanban", icon: <FiLayout /> },
  { id: "calendar", label: "Calendar", icon: <FiCalendar /> },
  { id: "focus", label: "Focus", icon: <FiTarget /> },
  { id: "stats", label: "Analytics", icon: <FiBarChart2 /> },
];

export default function Sidebar() {
  const currentView = useAppStore((s) => s.currentView);
  const setView = useAppStore((s) => s.setView);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const projects = useTaskStore((s) => s.projects);
  const tags = useTaskStore((s) => s.tags);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const groups = useGroupStore((s) => s.groups);
  const activeGroup = useGroupStore((s) => s.activeGroup);
  const setActiveGroup = useGroupStore((s) => s.setActiveGroup);

  const [showProfileEdit, setShowProfileEdit] = useState(false);

  return (
    <>
      <motion.button
        className={`sidebar-toggle ${sidebarOpen ? "inside-sidebar" : ""}`}
        onClick={toggleSidebar}
        whileTap={{ scale: 0.9 }}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <FiMenu />
      </motion.button>

      <motion.aside
        className={`sidebar ${sidebarOpen ? "open" : "closed"}`}
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="sidebar-content">
          {/* User Profile */}
          <div className="sidebar-user">
            <div className="user-avatar" onClick={() => setShowProfileEdit(true)} title="Edit profile">
              {profile?.display_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="user-info">
              <span className="user-name">{profile?.display_name || "User"}</span>
              <span className="user-email">{profile?.email}</span>
            </div>
            <div className="user-actions">
              <button
                className="theme-toggle"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
                title={theme === "dark" ? "Switch to light" : "Switch to dark"}
              >
                {theme === "dark" ? <FiSun /> : <FiMoon />}
              </button>
              <button className="user-logout" onClick={signOut} aria-label="Sign out">
                <FiLogOut />
              </button>
            </div>
          </div>

          <div className="sidebar-brand">
            <h2>✨ TaskFlow</h2>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">
              <span className="nav-section-label">Views</span>
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  className={`nav-item ${currentView === item.id ? "active" : ""}`}
                  onClick={() => setView(item.id)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Groups Section */}
            <div className="nav-section">
              <span className="nav-section-label"><FiUsers /> Groups</span>
              <motion.button
                className={`nav-item ${currentView === "groups" ? "active" : ""}`}
                onClick={() => setView("groups")}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiUsers />
                <span>Manage Groups</span>
              </motion.button>
              {groups.map((group) => (
                <motion.button
                  key={group.id}
                  className={`nav-item nav-group ${activeGroup?.id === group.id ? "active" : ""}`}
                  onClick={() => setActiveGroup(group)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="group-icon">
                    {group.type === "business" ? "💼" : group.type === "family" ? "👨‍👩‍👧‍👦" : group.type === "students" ? "🎓" : "👥"}
                  </span>
                  <span>{group.name}</span>
                </motion.button>
              ))}
              {activeGroup && (
                <motion.button
                  className="nav-item nav-group-clear"
                  onClick={() => setActiveGroup(null)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span>✕</span>
                  <span>Personal Tasks</span>
                </motion.button>
              )}
            </div>

            <div className="nav-section">
              <span className="nav-section-label"><FiFolder /> Projects</span>
              {projects.map((project) => (
                <button key={project.id} className="nav-item nav-project">
                  <span>{project.icon}</span>
                  <span>{project.name}</span>
                </button>
              ))}
            </div>

            <div className="nav-section">
              <span className="nav-section-label"><FiTag /> Tags</span>
              <div className="nav-tags">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="nav-tag"
                    style={{ background: `${tag.color}22`, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </nav>

          <div className="sidebar-footer">
            <button
              className="nav-item"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <FiCommand />
              <span>Command</span>
              <kbd>{navigator.platform?.includes("Mac") ? "⌘K" : "Ctrl+K"}</kbd>
            </button>
          </div>
        </div>
      </motion.aside>

      <AnimatePresence>
        {showProfileEdit && (
          <ProfileModal onClose={() => setShowProfileEdit(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
