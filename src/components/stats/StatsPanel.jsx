import { useMemo } from "react";
import { motion } from "framer-motion";
import useTaskStore, { selectVisibleTasks } from "../../stores/taskStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FiTrendingUp, FiTarget, FiClock, FiAlertTriangle } from "react-icons/fi";

export default function StatsPanel() {
  const tasks = useTaskStore(selectVisibleTasks);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const pending = tasks.filter((t) => t.status === "todo").length;
    const overdue = tasks.filter(
      (t) => t.date && new Date(t.date) < new Date() && t.status !== "done"
    ).length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, pending, overdue, completionRate };
  }, [tasks]);

  const priorityData = useMemo(() => {
    const high = tasks.filter((t) => t.priority === "High" && t.status !== "done").length;
    const medium = tasks.filter((t) => t.priority === "Medium" && t.status !== "done").length;
    const low = tasks.filter((t) => t.priority === "Low" && t.status !== "done").length;
    return [
      { name: "High", value: high, color: "#ef4444" },
      { name: "Medium", value: medium, color: "#f59e0b" },
      { name: "Low", value: low, color: "#10b981" },
    ];
  }, [tasks]);

  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const todayIndex = now.getDay();
    // Start of this week (Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - todayIndex);
    weekStart.setHours(0, 0, 0, 0);

    return days.map((day, i) => {
      const completed = tasks.filter((t) => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d >= weekStart && d.getDay() === i;
      }).length;
      return { name: day, completed };
    });
  }, [tasks]);

  return (
    <div className="stats-panel">
      <div className="stats-grid">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-icon" style={{ color: "#7c3aed" }}>
            <FiTarget />
          </div>
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <h1>{stats.total}</h1>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="stat-icon" style={{ color: "#10b981" }}>
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <h3>Completed</h3>
            <h1>{stats.done}</h1>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-icon" style={{ color: "#3b82f6" }}>
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>In Progress</h3>
            <h1>{stats.inProgress}</h1>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="stat-icon" style={{ color: "#ef4444" }}>
            <FiAlertTriangle />
          </div>
          <div className="stat-info">
            <h3>Overdue</h3>
            <h1>{stats.overdue}</h1>
          </div>
        </motion.div>
      </div>

      <div className="charts-grid">
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
              />
              <Bar dataKey="completed" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3>Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {priorityData.map((item) => (
              <span key={item.name} style={{ color: item.color }}>
                ● {item.name}: {item.value}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {stats.total > 0 && (
        <motion.div
          className="completion-bar-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="completion-header">
            <h3>Completion Rate</h3>
            <span>{stats.completionRate}%</span>
          </div>
          <div className="completion-bar">
            <motion.div
              className="completion-fill"
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionRate}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
