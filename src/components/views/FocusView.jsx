import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useTaskStore, { selectVisibleTasks } from "../../stores/taskStore";
import TaskCard from "../tasks/TaskCard";
import { isToday, parseISO } from "date-fns";
import { FiTarget, FiSun } from "react-icons/fi";

export default function FocusView() {
  const tasks = useTaskStore(selectVisibleTasks);

  const { todayTasks, highPriorityTasks } = useMemo(() => {
    const today = [];
    const todayIds = new Set();

    for (const task of tasks) {
      if (task.status === "done") continue;
      const isTaskToday = task.date
        ? isToday(parseISO(task.date))
        : task.priority === "High";
      if (isTaskToday) {
        today.push(task);
        todayIds.add(task.id);
      }
    }

    const highPri = tasks.filter(
      (t) => t.priority === "High" && t.status !== "done" && !todayIds.has(t.id)
    );

    return { todayTasks: today, highPriorityTasks: highPri };
  }, [tasks]);

  return (
    <div className="focus-view">
      <motion.div
        className="focus-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <FiTarget className="focus-icon" />
        <h1>Focus Mode</h1>
        <p>Concentrate on what matters today</p>
      </motion.div>

      <div className="focus-section">
        <h2><FiSun /> Today's Tasks</h2>
        <AnimatePresence mode="popLayout">
          {todayTasks.length === 0 ? (
            <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3>All clear for today! 🎉</h3>
              <p>No urgent tasks scheduled. Enjoy your day!</p>
            </motion.div>
          ) : (
            todayTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </AnimatePresence>
      </div>

      {highPriorityTasks.length > 0 && (
        <div className="focus-section">
          <h2>⚡ High Priority</h2>
          <AnimatePresence mode="popLayout">
            {highPriorityTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
