import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import useTaskStore from "../../stores/taskStore";
import useAppStore from "../../stores/appStore";
import {
  FiSearch,
  FiCheckCircle,
  FiLayout,
  FiList,
  FiCalendar,
  FiTarget,
} from "react-icons/fi";

const commands = [
  { id: "view-list", label: "Switch to List View", icon: <FiList />, category: "Views" },
  { id: "view-kanban", label: "Switch to Kanban View", icon: <FiLayout />, category: "Views" },
  { id: "view-calendar", label: "Switch to Calendar View", icon: <FiCalendar />, category: "Views" },
  { id: "view-focus", label: "Switch to Focus Mode", icon: <FiTarget />, category: "Views" },
];

export default function CommandPalette() {
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const setView = useAppStore((s) => s.setView);
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTaskStatus = useTaskStore((s) => s.toggleTaskStatus);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  const taskCommands = tasks.slice(0, 10).map((t) => ({
    id: `task-${t.id}`,
    label: t.title,
    icon: <FiCheckCircle />,
    category: "Tasks",
    action: () => toggleTaskStatus(t.id),
  }));

  const allCommands = [...commands, ...taskCommands];

  const filtered = allCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeCommand = (cmd) => {
    if (cmd.id.startsWith("view-")) {
      setView(cmd.id.replace("view-", ""));
    } else if (cmd.action) {
      cmd.action();
    }
    setCommandPaletteOpen(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      executeCommand(filtered[selectedIndex]);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex];
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!commandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="command-palette-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setCommandPaletteOpen(false)}
      >
        <motion.div
          className="command-palette"
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="command-input-wrapper">
            <FiSearch className="command-search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="command-input"
            />
            <kbd className="command-kbd">ESC</kbd>
          </div>

          <div className="command-list" ref={listRef}>
            {filtered.length === 0 && (
              <div className="command-empty">No results found</div>
            )}
            {filtered.map((cmd, index) => (
              <button
                key={cmd.id}
                className={`command-item ${index === selectedIndex ? "selected" : ""}`}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="command-item-icon">{cmd.icon}</span>
                <span className="command-item-label">{cmd.label}</span>
                <span className="command-item-category">{cmd.category}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
