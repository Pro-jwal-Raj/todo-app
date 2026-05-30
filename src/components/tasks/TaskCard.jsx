import { motion } from "framer-motion";
import useTaskStore from "../../stores/taskStore";
import useAppStore from "../../stores/appStore";
import useGroupStore from "../../stores/groupStore";
import useAuthStore from "../../stores/authStore";
import { formatTaskDate, isOverdue, formatRecurrence } from "../../utils/dateHelpers";
import { showToast } from "../common/Toast";
import {
  FiCheck,
  FiTrash2,
  FiClock,
  FiPlay,
  FiChevronDown,
  FiChevronRight,
  FiUserPlus,
} from "react-icons/fi";
import { useState, memo } from "react";

const priorityColors = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#10b981",
};

export default memo(function TaskCard({ task }) {
  const toggleTaskStatus = useTaskStore((s) => s.toggleTaskStatus);
  const undoLastStatus = useTaskStore((s) => s.undoLastStatus);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const assignTaskTo = useTaskStore((s) => s.assignTaskTo);
  const startPomodoro = useAppStore((s) => s.startPomodoro);
  const activeGroup = useGroupStore((s) => s.activeGroup);
  const members = useGroupStore((s) => s.members);
  const user = useAuthStore((s) => s.user);
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const overdue = isOverdue(task.date, task.status);
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const isCloudTask = Boolean(task.ownerId); // cloud tasks have ownerId from DB

  const handleDelete = () => {
    const deletedTask = { ...task };
    if (isCloudTask) {
      useTaskStore.getState().deleteCloudTask(task.id);
    } else {
      deleteTask(task.id);
    }
    showToast("Task deleted", "error", 4000, {
      label: "Undo",
      onClick: () => {
        if (isCloudTask) {
          useTaskStore.getState().addCloudTask(deletedTask, deletedTask.ownerId, deletedTask.groupId);
        } else {
          useTaskStore.getState().addTask(deletedTask);
        }
      },
    });
  };

  const handleToggleStatus = () => {
    if (isCloudTask) {
      const newStatus = task.status === "done" ? "todo" : "done";
      useTaskStore.getState().updateCloudTask(task.id, {
        status: newStatus,
        completedAt: newStatus === "done" ? new Date().toISOString() : null,
      }).catch(() => showToast("Failed to update task", "error"));
    } else {
      toggleTaskStatus(task.id);
      const label = task.status === "done" ? "Reopened" : "Completed";
      showToast(`${label}: ${task.title}`, "success", 5000, {
        label: "Undo",
        onClick: () => undoLastStatus(),
      });
    }
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    if (isCloudTask) {
      const updatedSubtasks = [...task.subtasks, { id: crypto.randomUUID(), title: newSubtask, completed: false }];
      useTaskStore.getState().updateCloudTask(task.id, { subtasks: updatedSubtasks });
    } else {
      addSubtask(task.id, newSubtask);
    }
    setNewSubtask("");
  };

  const handleTitleSave = () => {
    if (editTitle.trim()) {
      if (isCloudTask) {
        useTaskStore.getState().updateCloudTask(task.id, { title: editTitle });
      } else {
        updateTask(task.id, { title: editTitle });
      }
    }
    setEditing(false);
  };

  return (
    <motion.div
      className={`task-card ${task.status === "done" ? "completed" : ""} ${overdue ? "overdue" : ""}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="task-card-main">
        <div className="task-left">
          <motion.button
            className={`check-btn ${task.status === "done" ? "checked" : ""}`}
            onClick={handleToggleStatus}
            whileTap={{ scale: 0.8 }}
            style={{
              borderColor: task.status === "done" ? "#10b981" : priorityColors[task.priority],
            }}
          >
            {task.status === "done" && <FiCheck />}
          </motion.button>

          <div className="task-content">
            {editing ? (
              <input
                className="task-edit-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                autoFocus
              />
            ) : (
              <h3
                className="task-title"
                onDoubleClick={() => setEditing(true)}
              >
                {task.title}
              </h3>
            )}

            <div className="task-meta">
              {task.date && (
                <span className={`meta-item ${overdue ? "overdue-text" : ""}`}>
                  <FiClock /> {formatTaskDate(task.date)}
                </span>
              )}
              <span
                className="meta-item priority-badge"
                style={{ color: priorityColors[task.priority] }}
              >
                ⚡ {task.priority}
              </span>
              {task.tags.length > 0 &&
                task.tags.map((tag) => (
                  <span key={tag} className="meta-item tag-badge">
                    #{tag}
                  </span>
                ))}
              {task.subtasks.length > 0 && (
                <span className="meta-item subtask-count">
                  ✓ {completedSubtasks}/{task.subtasks.length}
                </span>
              )}
              {task.recurrence && (
                <span className="meta-item recurrence-badge">
                  🔄 {formatRecurrence(task.recurrence)}
                </span>
              )}
              {task.assignedTo && activeGroup && (
                <span className="meta-item assigned-badge">
                  👤 {(members[activeGroup.id] || []).find((m) => m.id === task.assignedTo)?.display_name || "Assigned"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="task-actions">
          <motion.button
            className="action-btn timer-btn"
            onClick={() => startPomodoro(task.id)}
            whileTap={{ scale: 0.9 }}
            title="Start Pomodoro"
            aria-label="Start Pomodoro timer"
          >
            <FiPlay />
          </motion.button>
          <motion.button
            className="action-btn expand-btn"
            onClick={() => setExpanded(!expanded)}
            whileTap={{ scale: 0.9 }}
            aria-label={expanded ? "Collapse task" : "Expand task"}
            aria-expanded={expanded}
          >
            {expanded ? <FiChevronDown /> : <FiChevronRight />}
          </motion.button>
          <motion.button
            className="action-btn delete-btn"
            onClick={handleDelete}
            whileTap={{ scale: 0.9 }}
            aria-label="Delete task"
          >
            <FiTrash2 />
          </motion.button>
        </div>
      </div>

      {expanded && (
        <motion.div
          className="task-expanded"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          <div className="subtasks-section">
            <h4>Subtasks</h4>
            {task.subtasks.map((st) => (
              <div key={st.id} className="subtask-item">
                <button
                  className={`subtask-check ${st.completed ? "checked" : ""}`}
                  onClick={() => {
                    if (isCloudTask) {
                      const updatedSubtasks = task.subtasks.map((s) =>
                        s.id === st.id ? { ...s, completed: !s.completed } : s
                      );
                      useTaskStore.getState().updateCloudTask(task.id, { subtasks: updatedSubtasks });
                    } else {
                      toggleSubtask(task.id, st.id);
                    }
                  }}
                >
                  {st.completed && <FiCheck />}
                </button>
                <span className={st.completed ? "subtask-done" : ""}>{st.title}</span>
              </div>
            ))}
            <form onSubmit={handleAddSubtask} className="subtask-form">
              <input
                placeholder="Add subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
              />
              <button type="submit">+</button>
            </form>
          </div>

          {/* Assignment (group tasks only — owners/admins or task creator) */}
          {activeGroup && (task.ownerId === user?.id || activeGroup.myRole === "owner" || activeGroup.myRole === "admin") && (
            <div className="assign-section">
              <h4><FiUserPlus /> Assign To</h4>
              <div className="assign-options">
                <button
                  className={`assign-chip ${!task.assignedTo ? "active" : ""}`}
                  onClick={() => assignTaskTo(task.id, null)}
                >
                  Unassigned
                </button>
                {(members[activeGroup.id] || []).map((member) => (
                  <button
                    key={member.id}
                    className={`assign-chip ${task.assignedTo === member.id ? "active" : ""}`}
                    onClick={() => assignTaskTo(task.id, member.id)}
                  >
                    <span className="assign-avatar">
                      {member.display_name?.[0]?.toUpperCase()}
                    </span>
                    {member.display_name}
                    {member.id === user?.id && " (You)"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
})
