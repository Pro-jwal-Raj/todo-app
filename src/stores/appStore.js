import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAppStore = create(
  persist(
    (set, get) => ({
      // View state
      currentView: "list", // list, kanban, calendar, focus
      sidebarOpen: true,
      commandPaletteOpen: false,
      
      // Theme
      theme: "dark", // dark, light, oled
      accentColor: "#7c3aed", // purple default
      
      // Pomodoro
      pomodoroActive: false,
      pomodoroPaused: false,
      pomodoroTaskId: null,
      pomodoroEndTime: null, // timestamp when timer should end (drift-proof)
      pomodoroTimeLeft: 25 * 60,
      pomodoroMode: "work", // work, break, longBreak
      pomodoroSettings: {
        workDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        sessionsBeforeLongBreak: 4,
      },
      pomodoroSessions: 0,

      // Actions
      setView: (view) => set({ currentView: view }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),
      
      // Pomodoro actions
      startPomodoro: (taskId) => {
        const s = get();
        const duration = s.pomodoroSettings.workDuration * 60;
        set({
          pomodoroActive: true,
          pomodoroPaused: false,
          pomodoroTaskId: taskId,
          pomodoroTimeLeft: duration,
          pomodoroEndTime: Date.now() + duration * 1000,
          pomodoroMode: "work",
        });
      },

      pausePomodoro: () => {
        // Preserve remaining time but stop the countdown
        const state = get();
        const remaining = Math.max(0, Math.round((state.pomodoroEndTime - Date.now()) / 1000));
        set({
          pomodoroActive: false,
          pomodoroPaused: true,
          pomodoroTimeLeft: remaining,
          pomodoroEndTime: null,
        });
      },

      resumePomodoro: () => {
        const state = get();
        set({
          pomodoroActive: true,
          pomodoroPaused: false,
          pomodoroEndTime: Date.now() + state.pomodoroTimeLeft * 1000,
        });
      },

      dismissPomodoro: () =>
        set({
          pomodoroActive: false,
          pomodoroPaused: false,
          pomodoroTaskId: null,
          pomodoroTimeLeft: 0,
          pomodoroEndTime: null,
        }),

      // Drift-proof tick: compute remaining from endTime
      tickPomodoro: () => {
        const state = get();
        if (!state.pomodoroActive || !state.pomodoroEndTime) return;

        const remaining = Math.round((state.pomodoroEndTime - Date.now()) / 1000);

        if (remaining <= 0) {
          // Timer ended — transition modes
          if (state.pomodoroMode === "work") {
            const sessions = state.pomodoroSessions + 1;
            const isLongBreak =
              sessions % state.pomodoroSettings.sessionsBeforeLongBreak === 0;
            const nextDuration = isLongBreak
              ? state.pomodoroSettings.longBreakDuration * 60
              : state.pomodoroSettings.breakDuration * 60;
            set({
              pomodoroMode: isLongBreak ? "longBreak" : "break",
              pomodoroTimeLeft: nextDuration,
              pomodoroEndTime: Date.now() + nextDuration * 1000,
              pomodoroSessions: sessions,
            });
          } else {
            const nextDuration = state.pomodoroSettings.workDuration * 60;
            set({
              pomodoroMode: "work",
              pomodoroTimeLeft: nextDuration,
              pomodoroEndTime: Date.now() + nextDuration * 1000,
            });
          }
          return "session-ended"; // Signal for notification
        } else {
          set({ pomodoroTimeLeft: remaining });
        }
      },

      resetPomodoro: () =>
        set((s) => ({
          pomodoroTimeLeft: s.pomodoroSettings.workDuration * 60,
          pomodoroEndTime: null,
          pomodoroMode: "work",
          pomodoroActive: false,
          pomodoroPaused: false,
        })),
    }),
    {
      name: "todo-app-settings",
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        currentView: state.currentView,
        pomodoroSettings: state.pomodoroSettings,
        pomodoroSessions: state.pomodoroSessions,
      }),
    }
  )
);

export default useAppStore;
