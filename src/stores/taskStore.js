import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getNextRecurrence } from "../utils/dateHelpers";
import {
  fetchCloudTasks,
  createCloudTask,
  updateCloudTask,
  deleteCloudTask,
  assignTask as assignCloudTask,
  subscribeToGroupTasks,
  subscribeToPersonalTasks,
} from "../services/taskService";

const generateId = () => crypto.randomUUID();

// CSV cell escaping — prevents formula injection and handles commas/quotes
function escapeCSVCell(value) {
  const str = String(value ?? "");
  // Prevent CSV injection: prefix dangerous characters with a single quote
  const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  // Wrap in quotes if it contains comma, quote, or newline
  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

// Schema validation for imported data
function validateTaskSchema(task) {
  if (!task || typeof task !== "object") return false;
  if (typeof task.title !== "string" || task.title.length > 1000) return false;
  if (!["todo", "in-progress", "done"].includes(task.status)) return false;
  if (!["Low", "Medium", "High"].includes(task.priority)) return false;
  if (!Array.isArray(task.tags)) return false;
  if (!Array.isArray(task.subtasks)) return false;
  return true;
}

function validateTagSchema(tag) {
  if (!tag || typeof tag !== "object") return false;
  if (typeof tag.id !== "string") return false;
  if (typeof tag.name !== "string" || tag.name.length > 50) return false;
  if (typeof tag.color !== "string") return false;
  return true;
}

function validateProjectSchema(project) {
  if (!project || typeof project !== "object") return false;
  if (typeof project.id !== "string") return false;
  if (typeof project.name !== "string" || project.name.length > 100) return false;
  return true;
}

const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      _statusUndo: null, // { taskId, prevStatus, prevCompletedAt, createdTaskId? }
      tags: [
        { id: "tag-1", name: "Work", color: "#3b82f6" },
        { id: "tag-2", name: "Personal", color: "#8b5cf6" },
        { id: "tag-3", name: "Health", color: "#10b981" },
        { id: "tag-4", name: "Finance", color: "#f59e0b" },
      ],
      projects: [
        { id: "proj-default", name: "Inbox", icon: "📥" },
      ],

      // Task CRUD
      addTask: (taskData) => {
        const newTask = {
          id: taskData.id || generateId(),
          title: taskData.title || "",
          description: taskData.description || "",
          date: taskData.date || "",
          priority: taskData.priority || "Medium",
          status: taskData.status || "todo",
          tags: taskData.tags || [],
          projectId: taskData.projectId || "proj-default",
          subtasks: taskData.subtasks || [],
          estimatedTime: taskData.estimatedTime || 0,
          timeSpent: taskData.timeSpent || 0,
          recurrence: taskData.recurrence || null,
          createdAt: taskData.createdAt || new Date().toISOString(),
          completedAt: null,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        return newTask;
      },

      updateTask: (id, updates) => {
        const tasks = get().tasks;
        if (!tasks.some((t) => t.id === id)) return false;
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
        return true;
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      toggleTaskStatus: (id) => {
        const tasks = get().tasks;
        const task = tasks.find((t) => t.id === id);
        if (!task) return;

        const prevStatus = task.status;
        const prevCompletedAt = task.completedAt;
        const newStatus = task.status === "done" ? "todo" : "done";

        // If completing a recurring task, auto-create next occurrence
        if (newStatus === "done" && task.recurrence) {
          const nextDate = getNextRecurrence(task.date, task.recurrence);
          const nextTaskId = generateId();
          const nextTask = {
            id: nextTaskId,
            title: task.title,
            description: task.description,
            date: nextDate || "",
            priority: task.priority,
            status: "todo",
            tags: [...task.tags],
            projectId: task.projectId,
            subtasks: task.subtasks.map((st) => ({ ...st, id: generateId(), completed: false })),
            estimatedTime: task.estimatedTime,
            timeSpent: 0,
            recurrence: task.recurrence,
            createdAt: new Date().toISOString(),
            completedAt: null,
          };

          set((state) => ({
            _statusUndo: { taskId: id, prevStatus, prevCompletedAt, createdTaskId: nextTaskId },
            tasks: state.tasks.map((t) =>
              t.id === id
                ? { ...t, status: "done", completedAt: new Date().toISOString() }
                : t
            ).concat([nextTask]),
          }));
        } else {
          set((state) => ({
            _statusUndo: { taskId: id, prevStatus, prevCompletedAt, createdTaskId: null },
            tasks: state.tasks.map((t) => {
              if (t.id !== id) return t;
              return {
                ...t,
                status: newStatus,
                completedAt: newStatus === "done" ? new Date().toISOString() : null,
              };
            }),
          }));
        }
      },

      moveTaskStatus: (id, newStatus) => {
        if (!["todo", "in-progress", "done"].includes(newStatus)) return;
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const prevStatus = task.status;
        const prevCompletedAt = task.completedAt;

        // Handle recurring task completion via kanban
        if (newStatus === "done" && task.recurrence) {
          const nextDate = getNextRecurrence(task.date, task.recurrence);
          const nextTaskId = generateId();
          const nextTask = {
            id: nextTaskId,
            title: task.title,
            description: task.description,
            date: nextDate || "",
            priority: task.priority,
            status: "todo",
            tags: [...task.tags],
            projectId: task.projectId,
            subtasks: task.subtasks.map((st) => ({ ...st, id: generateId(), completed: false })),
            estimatedTime: task.estimatedTime,
            timeSpent: 0,
            recurrence: task.recurrence,
            createdAt: new Date().toISOString(),
            completedAt: null,
          };

          set((state) => ({
            _statusUndo: { taskId: id, prevStatus, prevCompletedAt, createdTaskId: nextTaskId },
            tasks: [
              nextTask,
              ...state.tasks.map((t) =>
                t.id === id ? { ...t, status: "done", completedAt: new Date().toISOString() } : t
              ),
            ],
          }));
        } else {
          set((state) => ({
            _statusUndo: { taskId: id, prevStatus, prevCompletedAt, createdTaskId: null },
            tasks: state.tasks.map((t) =>
              t.id === id
                ? { ...t, status: newStatus, completedAt: newStatus === "done" ? new Date().toISOString() : null }
                : t
            ),
          }));
        }
      },

      undoLastStatus: () => {
        const undo = get()._statusUndo;
        if (!undo) return;
        set((state) => ({
          _statusUndo: null,
          tasks: state.tasks
            .filter((t) => t.id !== undo.createdTaskId) // remove auto-created recurring task
            .map((t) =>
              t.id === undo.taskId
                ? { ...t, status: undo.prevStatus, completedAt: undo.prevCompletedAt }
                : t
            ),
        }));
      },

      reorderTasks: (reorderedTasks) => {
        set({ tasks: reorderedTasks });
      },

      // Subtasks
      addSubtask: (taskId, subtaskTitle) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: [
                    ...task.subtasks,
                    { id: generateId(), title: subtaskTitle, completed: false },
                  ],
                }
              : task
          ),
        }));
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((st) =>
                    st.id === subtaskId ? { ...st, completed: !st.completed } : st
                  ),
                }
              : task
          ),
        }));
      },

      // Tags
      addTag: (name, color) => {
        const tag = { id: generateId(), name, color };
        set((state) => ({ tags: [...state.tags, tag] }));
      },

      deleteTag: (id) => {
        const tagToDelete = get().tags.find((t) => t.id === id);
        if (!tagToDelete) return;
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
          // Remove the tag name from all tasks that reference it
          tasks: state.tasks.map((task) => ({
            ...task,
            tags: task.tags.filter((tagName) => tagName !== tagToDelete.name),
          })),
        }));
      },

      // Projects
      addProject: (name, icon) => {
        const project = { id: generateId(), name, icon: icon || "📁" };
        set((state) => ({ projects: [...state.projects, project] }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.map((t) =>
            t.projectId === id ? { ...t, projectId: "proj-default" } : t
          ),
        }));
      },

      // Time tracking
      addTimeSpent: (taskId, minutes) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, timeSpent: task.timeSpent + minutes }
              : task
          ),
        }));
      },

      // Stats
      getStats: () => {
        const tasks = get().tasks;
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === "done").length;
        const inProgress = tasks.filter((t) => t.status === "in-progress").length;
        const pending = tasks.filter((t) => t.status === "todo").length;
        const overdue = tasks.filter(
          (t) => t.date && new Date(t.date) < new Date() && t.status !== "done"
        ).length;
        return { total, done, inProgress, pending, overdue };
      },

      // Export
      exportJSON: () => {
        const { tasks, tags, projects } = get();
        return JSON.stringify({ tasks, tags, projects }, null, 2);
      },

      exportCSV: () => {
        const tasks = get().tasks;
        const headers = ["Title", "Status", "Priority", "Date", "Tags", "Project", "Created"];
        const rows = tasks.map((t) => [
          escapeCSVCell(t.title),
          escapeCSVCell(t.status),
          escapeCSVCell(t.priority),
          escapeCSVCell(t.date || "No date"),
          escapeCSVCell(t.tags.join("; ")),
          escapeCSVCell(t.projectId),
          escapeCSVCell(t.createdAt),
        ]);
        return [headers.map(escapeCSVCell), ...rows].map((r) => r.join(",")).join("\n");
      },

      importJSON: (jsonString) => {
        try {
          const data = JSON.parse(jsonString);
          if (!data || typeof data !== "object") return false;

          // Validate tasks
          if (data.tasks) {
            if (!Array.isArray(data.tasks)) return false;
            if (data.tasks.length > 10000) return false; // Prevent overflow
            const validTasks = data.tasks.filter(validateTaskSchema);
            if (validTasks.length !== data.tasks.length) return false;
          }

          // Validate tags
          if (data.tags) {
            if (!Array.isArray(data.tags)) return false;
            if (data.tags.length > 500) return false;
            const validTags = data.tags.filter(validateTagSchema);
            if (validTags.length !== data.tags.length) return false;
          }

          // Validate projects
          if (data.projects) {
            if (!Array.isArray(data.projects)) return false;
            if (data.projects.length > 500) return false;
            const validProjects = data.projects.filter(validateProjectSchema);
            if (validProjects.length !== data.projects.length) return false;
          }

          // Safe to import
          const updates = {};
          if (data.tasks) updates.tasks = data.tasks;
          if (data.tags) updates.tags = data.tags;
          if (data.projects) updates.projects = data.projects;
          set(updates);
          return true;
        } catch {
          return false;
        }
      },

      // ===== CLOUD SYNC =====
      cloudConnected: false,
      syncing: false,
      cloudTasks: [], // Separate from local tasks
      unsubscribe: null,

      // Load tasks from Supabase (stored separately, merged in selectors)
      loadCloudTasks: async (groupId = null) => {
        set({ syncing: true, cloudConnected: true });
        try {
          const tasks = await fetchCloudTasks(groupId);
          set({ cloudTasks: tasks, syncing: false });
        } catch (err) {
          console.error("Failed to load cloud tasks:", err);
          set({ syncing: false, cloudConnected: false });
        }
      },

      // Create task and sync to cloud
      addCloudTask: async (taskData, userId, groupId = null) => {
        const newTask = {
          id: taskData.id || generateId(),
          title: taskData.title || "",
          description: taskData.description || "",
          date: taskData.date || "",
          priority: taskData.priority || "Medium",
          status: taskData.status || "todo",
          tags: taskData.tags || [],
          subtasks: taskData.subtasks || [],
          estimatedTime: taskData.estimatedTime || 0,
          timeSpent: 0,
          recurrence: taskData.recurrence || null,
          assignedTo: taskData.assignedTo || null,
          createdAt: new Date().toISOString(),
          completedAt: null,
          ownerId: userId,
          groupId,
        };

        // Optimistic update
        set((state) => ({ cloudTasks: [newTask, ...state.cloudTasks] }));

        try {
          await createCloudTask(newTask, userId, groupId);
        } catch (err) {
          // Rollback on failure
          set((state) => ({ cloudTasks: state.cloudTasks.filter((t) => t.id !== newTask.id) }));
          throw err;
        }
        return newTask;
      },

      // Update task and sync to cloud
      updateCloudTask: async (id, updates) => {
        const cloudTasks = get().cloudTasks;
        const oldTask = cloudTasks.find((t) => t.id === id);
        if (!oldTask) return;

        // Optimistic update
        set((state) => ({
          cloudTasks: state.cloudTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));

        try {
          await updateCloudTask(id, updates);
        } catch (err) {
          // Rollback
          set((state) => ({
            cloudTasks: state.cloudTasks.map((t) => (t.id === id ? oldTask : t)),
          }));
          throw err;
        }
      },

      // Delete task from cloud
      deleteCloudTask: async (id) => {
        const cloudTasks = get().cloudTasks;
        const oldTask = cloudTasks.find((t) => t.id === id);

        // Optimistic
        set((state) => ({ cloudTasks: state.cloudTasks.filter((t) => t.id !== id) }));

        try {
          await deleteCloudTask(id);
        } catch (err) {
          // Rollback
          if (oldTask) {
            set((state) => ({ cloudTasks: [oldTask, ...state.cloudTasks] }));
          }
          throw err;
        }
      },

      // Assign a task to a group member
      assignTaskTo: async (taskId, userId) => {
        set((state) => ({
          cloudTasks: state.cloudTasks.map((t) =>
            t.id === taskId ? { ...t, assignedTo: userId } : t
          ),
        }));
        try {
          await assignCloudTask(taskId, userId);
        } catch {
          set((state) => ({
            cloudTasks: state.cloudTasks.map((t) =>
              t.id === taskId ? { ...t, assignedTo: null } : t
            ),
          }));
        }
      },

      // Subscribe to real-time updates
      subscribeToTasks: (userId, groupId = null) => {
        // Unsubscribe previous
        const prev = get().unsubscribe;
        if (prev) prev();

        const onInsert = (task) => {
          set((state) => {
            if (state.cloudTasks.some((t) => t.id === task.id)) return state;
            return { cloudTasks: [task, ...state.cloudTasks] };
          });
        };
        const onUpdate = (task) => {
          set((state) => ({
            cloudTasks: state.cloudTasks.map((t) => (t.id === task.id ? task : t)),
          }));
        };
        const onDelete = (taskId) => {
          set((state) => ({
            cloudTasks: state.cloudTasks.filter((t) => t.id !== taskId),
          }));
        };

        const unsub = groupId
          ? subscribeToGroupTasks(groupId, onInsert, onUpdate, onDelete)
          : subscribeToPersonalTasks(userId, onInsert, onUpdate, onDelete);

        set({ unsubscribe: unsub });
      },

      // Disconnect real-time (keeps cloudTasks for smooth transition)
      unsubscribeFromTasks: () => {
        const unsub = get().unsubscribe;
        if (unsub) unsub();
        set({ unsubscribe: null });
      },

      // Full disconnect — clears cloud state (use on logout)
      disconnectCloud: () => {
        const unsub = get().unsubscribe;
        if (unsub) unsub();
        set({ unsubscribe: null, cloudConnected: false, cloudTasks: [] });
      },
    }),
    {
      name: "todo-app-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        tags: state.tags,
        projects: state.projects,
      }),
    }
  )
);

// Selector: get the visible tasks — cloud tasks when in group, local when personal
export const selectVisibleTasks = (state) =>
  state.cloudConnected ? state.cloudTasks : state.tasks;

export default useTaskStore;
