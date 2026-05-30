import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import useTaskStore, { selectVisibleTasks } from "../../stores/taskStore";
import { showToast } from "../common/Toast";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";

const columns = [
  { id: "todo", title: "To Do", emoji: "📋" },
  { id: "in-progress", title: "In Progress", emoji: "🔄" },
  { id: "done", title: "Done", emoji: "✅" },
];

function DraggableCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      className="kanban-card"
      style={style}
      layout
      whileHover={{ scale: 1.02 }}
      {...attributes}
      {...listeners}
    >
      <div
        className="kanban-card-priority"
        style={{
          background:
            task.priority === "High"
              ? "#ef4444"
              : task.priority === "Medium"
              ? "#f59e0b"
              : "#10b981",
        }}
      />
      <h4>{task.title}</h4>
      <div className="kanban-card-meta">
        {task.date && <span>📅 {new Date(task.date).toLocaleDateString()}</span>}
        <span>⚡ {task.priority}</span>
      </div>
      {task.tags.length > 0 && (
        <div className="kanban-card-tags">
          {task.tags.map((tag) => (
            <span key={tag} className="kanban-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
      {task.subtasks.length > 0 && (
        <div className="kanban-card-subtasks">
          ✓ {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
        </div>
      )}
    </motion.div>
  );
}

function DroppableColumn({ col, tasks: colTasks }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <motion.div
      key={col.id}
      className={`kanban-column ${isOver ? "drag-over" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="kanban-column-header">
        <span>
          {col.emoji} {col.title}
        </span>
        <span className="kanban-count">{colTasks.length}</span>
      </div>

      <div className="kanban-cards" ref={setNodeRef}>
        {colTasks.map((task) => (
          <DraggableCard key={task.id} task={task} />
        ))}

        {colTasks.length === 0 && (
          <div className="kanban-empty">Drop tasks here</div>
        )}
      </div>
    </motion.div>
  );
}

export default function KanbanView() {
  const tasks = useTaskStore(selectVisibleTasks);
  const moveTaskStatus = useTaskStore((s) => s.moveTaskStatus);
  const undoLastStatus = useTaskStore((s) => s.undoLastStatus);
  const cloudConnected = useTaskStore((s) => s.cloudConnected);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const grouped = useMemo(() => {
    const result = { todo: [], "in-progress": [], done: [] };
    tasks.forEach((task) => {
      if (result[task.status]) {
        result[task.status].push(task);
      }
    });
    return result;
  }, [tasks]);

  const handleDragStart = (event) => {
    setActiveTask(event.active.data.current?.task || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id;
    const targetStatus = over.id; // droppable id is the column status

    if (columns.some((c) => c.id === targetStatus)) {
      if (cloudConnected) {
        useTaskStore.getState().updateCloudTask(taskId, {
          status: targetStatus,
          completedAt: targetStatus === "done" ? new Date().toISOString() : null,
        });
      } else {
        const task = tasks.find((t) => t.id === taskId);
        if (task && task.status !== targetStatus) {
          moveTaskStatus(taskId, targetStatus);
          showToast(`Moved to ${targetStatus}`, "success", 5000, {
            label: "Undo",
            onClick: () => undoLastStatus(),
          });
        }
      }
    }
  };

  return (
    <div className="kanban-view">
      <div className="kanban-header">
        <h2>Kanban Board</h2>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          {columns.map((col) => (
            <DroppableColumn key={col.id} col={col} tasks={grouped[col.id]} />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="kanban-card kanban-card-overlay">
              <div
                className="kanban-card-priority"
                style={{
                  background:
                    activeTask.priority === "High"
                      ? "#ef4444"
                      : activeTask.priority === "Medium"
                      ? "#f59e0b"
                      : "#10b981",
                }}
              />
              <h4>{activeTask.title}</h4>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
