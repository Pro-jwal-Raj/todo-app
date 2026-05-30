import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useTaskStore, { selectVisibleTasks } from "../../stores/taskStore";
import TaskCard from "../tasks/TaskCard";
import TaskForm from "../tasks/TaskForm";
import { showToast } from "../common/Toast";
import { FiSearch, FiDownload, FiUpload } from "react-icons/fi";

// Debounce hook
function useDebouncedValue(value, delay = 150) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function ListView() {
  const tasks = useTaskStore(selectVisibleTasks);
  const exportCSV = useTaskStore((s) => s.exportCSV);
  const exportJSON = useTaskStore((s) => s.exportJSON);
  const importJSON = useTaskStore((s) => s.importJSON);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created"); // created, priority, date
  const fileInputRef = useRef(null);

  const debouncedSearch = useDebouncedValue(search, 150);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" ? true : task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === "priority") {
        const order = { High: 0, Medium: 1, Low: 2 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === "date") {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [tasks, debouncedSearch, statusFilter, priorityFilter, sortBy]);

  const handleExport = (format) => {
    const content = format === "csv" ? exportCSV() : exportJSON();
    const type = format === "csv" ? "text/csv" : "application/json";
    const ext = format === "csv" ? "csv" : "json";
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasks.${ext}`;
    link.click();
    // Delay revocation to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importJSON(event.target.result);
      if (result) {
        showToast("Tasks imported successfully!", "success");
      } else {
        showToast("Invalid file format. Please use a valid JSON export.", "error");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = "";
  };

  return (
    <div className="list-view">
      <TaskForm />

      <motion.div
        className="card filter-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="filter-bar">
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created">Newest First</option>
            <option value="priority">Priority</option>
            <option value="date">Due Date</option>
          </select>

          <div className="export-buttons">
            <button className="export-btn" onClick={() => handleExport("csv")}>
              <FiDownload /> CSV
            </button>
            <button className="export-btn" onClick={() => handleExport("json")}>
              <FiDownload /> JSON
            </button>
            <button className="export-btn import-btn" onClick={() => fileInputRef.current?.click()}>
              <FiUpload /> Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: "none" }}
            />
          </div>
        </div>
      </motion.div>

      <div className="tasks-header">
        <h2>Your Tasks</h2>
        <span className="task-count">{filteredTasks.length} task(s)</span>
      </div>

      <div className="tasks-list">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="empty-icon">📋</div>
              <h3>No tasks yet</h3>
              <p>Add your first task above or try natural language input!</p>
            </motion.div>
          ) : (
            filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
