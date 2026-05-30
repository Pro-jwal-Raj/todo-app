import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import useTaskStore, { selectVisibleTasks } from "../../stores/taskStore";
import { showToast } from "../common/Toast";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";

export default function CalendarView() {
  const tasks = useTaskStore(selectVisibleTasks);
  const addTask = useTaskStore((s) => s.addTask);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [quickAddDay, setQuickAddDay] = useState(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Pre-group tasks by date key in a single O(n) pass
  const tasksByDate = useMemo(() => {
    const map = {};
    for (const task of tasks) {
      if (!task.date) continue;
      const key = format(parseISO(task.date), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  const getTasksForDay = (day) => {
    const key = format(day, "yyyy-MM-dd");
    return tasksByDate[key] || [];
  };

  const isCurrentMonth = (day) => {
    return day.getMonth() === currentMonth.getMonth();
  };

  const handleDayClick = (day) => {
    setQuickAddDay(day);
    setQuickAddTitle("");
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!quickAddTitle.trim() || !quickAddDay) return;
    const taskDate = new Date(quickAddDay);
    taskDate.setHours(9, 0, 0, 0);
    addTask({
      title: quickAddTitle,
      date: taskDate.toISOString().slice(0, 16),
      priority: "Medium",
    });
    showToast("Task added!", "success");
    setQuickAddDay(null);
    setQuickAddTitle("");
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2>Calendar</h2>
        <div className="calendar-nav">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <FiChevronLeft />
          </button>
          <h3>{format(currentMonth, "MMMM yyyy")}</h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <FiChevronRight />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {days.map((day, i) => {
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, new Date());
          const isQuickAdd = quickAddDay && isSameDay(day, quickAddDay);
          return (
            <motion.div
              key={i}
              className={`calendar-day ${!isCurrentMonth(day) ? "other-month" : ""} ${isToday ? "today" : ""}`}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleDayClick(day)}
            >
              <div className="day-header-row">
                <span className="day-number">{format(day, "d")}</span>
                <button
                  className="day-add-btn"
                  onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                  title="Add task"
                >
                  <FiPlus />
                </button>
              </div>

              {isQuickAdd && (
                <form className="day-quick-add" onSubmit={handleQuickAdd} onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    placeholder="Task title..."
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    onBlur={() => { if (!quickAddTitle) setQuickAddDay(null); }}
                    onKeyDown={(e) => { if (e.key === "Escape") setQuickAddDay(null); }}
                  />
                </form>
              )}

              <div className="day-tasks">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`day-task-dot ${task.status === "done" ? "done" : ""}`}
                    style={{
                      borderLeftColor:
                        task.priority === "High"
                          ? "#ef4444"
                          : task.priority === "Medium"
                          ? "#f59e0b"
                          : "#10b981",
                    }}
                    title={task.title}
                  >
                    {task.title.slice(0, 12)}
                    {task.title.length > 12 ? "…" : ""}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <span className="day-more">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
