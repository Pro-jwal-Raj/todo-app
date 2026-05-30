import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import useAppStore from "../../stores/appStore";
import useTaskStore from "../../stores/taskStore";
import { FiPlay, FiPause, FiSquare, FiX } from "react-icons/fi";

// Play a short beep notification using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available — silent fallback
  }
}

export default function PomodoroTimer() {
  const pomodoroActive = useAppStore((s) => s.pomodoroActive);
  const pomodoroPaused = useAppStore((s) => s.pomodoroPaused);
  const pomodoroTaskId = useAppStore((s) => s.pomodoroTaskId);
  const pomodoroTimeLeft = useAppStore((s) => s.pomodoroTimeLeft);
  const pomodoroMode = useAppStore((s) => s.pomodoroMode);
  const pomodoroSessions = useAppStore((s) => s.pomodoroSessions);
  const startPomodoro = useAppStore((s) => s.startPomodoro);
  const pausePomodoro = useAppStore((s) => s.pausePomodoro);
  const resumePomodoro = useAppStore((s) => s.resumePomodoro);
  const dismissPomodoro = useAppStore((s) => s.dismissPomodoro);
  const tickPomodoro = useAppStore((s) => s.tickPomodoro);
  const resetPomodoro = useAppStore((s) => s.resetPomodoro);

  const tasks = useTaskStore((s) => s.tasks);
  const addTimeSpent = useTaskStore((s) => s.addTimeSpent);

  const intervalRef = useRef(null);
  const lastMinuteRef = useRef(0);

  const currentTask = tasks.find((t) => t.id === pomodoroTaskId);

  const tick = useCallback(() => {
    const result = tickPomodoro();
    if (result === "session-ended") {
      playNotificationSound();
      // Send browser notification if permitted
      if (Notification.permission === "granted") {
        new Notification("Pomodoro", {
          body: "Session complete! Time for a break.",
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><text y='32' font-size='32'>🍅</text></svg>",
        });
      }
    }
    // Track time spent per minute
    if (pomodoroTaskId && pomodoroMode === "work") {
      const now = Date.now();
      if (now - lastMinuteRef.current >= 60000) {
        addTimeSpent(pomodoroTaskId, 1);
        lastMinuteRef.current = now;
      }
    }
  }, [tickPomodoro, pomodoroTaskId, pomodoroMode, addTimeSpent]);

  useEffect(() => {
    if (pomodoroActive) {
      lastMinuteRef.current = Date.now();
      // Single interval — no overlapping due to stable dependency
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pomodoroActive, tick]);

  // Request notification permission on first mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const modeLabels = {
    work: "Focus Time",
    break: "Short Break",
    longBreak: "Long Break",
  };

  const modeColors = {
    work: "#7c3aed",
    break: "#10b981",
    longBreak: "#3b82f6",
  };

  const handlePlayPause = () => {
    if (pomodoroActive) {
      pausePomodoro();
    } else if (pomodoroPaused) {
      resumePomodoro();
    } else {
      startPomodoro(pomodoroTaskId);
    }
  };

  // Don't render if fully dismissed
  if (!pomodoroActive && !pomodoroPaused && !pomodoroTaskId) return null;

  return (
    <motion.div
      className="pomodoro-widget"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
    >
      <button className="pomodoro-close" onClick={dismissPomodoro} title="Close Timer">
        <FiX />
      </button>

      <div className="pomodoro-mode" style={{ color: modeColors[pomodoroMode] }}>
        {modeLabels[pomodoroMode]}
        {pomodoroPaused && <span className="paused-badge"> (Paused)</span>}
      </div>

      <div className="pomodoro-time">{formatTime(pomodoroTimeLeft)}</div>

      {currentTask && (
        <div className="pomodoro-task">🎯 {currentTask.title}</div>
      )}

      <div className="pomodoro-controls">
        <button onClick={handlePlayPause} title={pomodoroActive ? "Pause" : "Resume"}>
          {pomodoroActive ? <FiPause /> : <FiPlay />}
        </button>
        <button onClick={resetPomodoro} title="Reset Timer">
          <FiSquare />
        </button>
      </div>

      <div className="pomodoro-sessions">
        Sessions: {pomodoroSessions}
      </div>
    </motion.div>
  );
}
