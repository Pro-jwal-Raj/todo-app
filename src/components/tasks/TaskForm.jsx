import { useState } from "react";
import { motion } from "framer-motion";
import useTaskStore from "../../stores/taskStore";
import useAuthStore from "../../stores/authStore";
import useGroupStore from "../../stores/groupStore";
import { parseNaturalLanguage } from "../../utils/nlpParser";
import { showToast } from "../common/Toast";
import { FiPlus, FiZap, FiCalendar, FiTag, FiRepeat } from "react-icons/fi";

export default function TaskForm() {
  const addTask = useTaskStore((s) => s.addTask);
  const addCloudTask = useTaskStore((s) => s.addCloudTask);
  const tags = useTaskStore((s) => s.tags);
  const projects = useTaskStore((s) => s.projects);
  const user = useAuthStore((s) => s.user);
  const activeGroup = useGroupStore((s) => s.activeGroup);
  const [input, setInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [selectedTags, setSelectedTags] = useState([]);
  const [projectId, setProjectId] = useState("proj-default");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState("daily");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Parse natural language
    const parsed = parseNaturalLanguage(input);

    // Build recurrence object
    let recurrenceData = parsed.recurrence;
    if (recurrence !== "none") {
      if (recurrence === "custom") {
        recurrenceData = { type: customUnit, interval: customInterval };
      } else {
        recurrenceData = { type: recurrence, interval: 1 };
      }
    }

    const taskData = {
      title: parsed.title || input,
      description,
      date: date || parsed.date,
      priority: date ? priority : parsed.priority,
      tags: selectedTags.length > 0 ? selectedTags : parsed.tags,
      projectId,
      recurrence: recurrenceData,
    };

    // Use cloud task if user is authenticated
    if (user) {
      try {
        await addCloudTask(taskData, user.id, activeGroup?.id || null);
        showToast(activeGroup ? "Task added to group!" : "Task added!", "success");
      } catch {
        showToast("Failed to add task — check your connection", "error");
        return; // Don't reset form on failure
      }
    } else {
      addTask(taskData);
      showToast("Task added!", "success");
    }

    // Reset
    setInput("");
    setDate("");
    setPriority("Medium");
    setSelectedTags([]);
    setDescription("");
    setRecurrence("none");
    setCustomInterval(1);
    setCustomUnit("daily");
    setShowAdvanced(false);
  };

  const toggleTag = (tagName) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  return (
    <motion.div
      className="card task-form-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="task-form-header">
        <h2><FiPlus /> Add New Task</h2>
        <span className="nlp-hint">
          <FiZap /> Supports natural language: "Buy groceries tomorrow high priority #work"
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="task-form-main">
          <input
            type="text"
            placeholder="What do you need to do?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="task-input-main"
          />
          <motion.button
            type="submit"
            className="add-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiPlus /> Add
          </motion.button>
        </div>

        <div className="task-form-toggles">
          <button
            type="button"
            className={`toggle-btn ${showAdvanced ? "active" : ""}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <FiCalendar /> Details
          </button>
        </div>

        {showAdvanced && (
          <motion.div
            className="task-form-advanced"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="form-row">
              <div className="form-field">
                <label>Due Date</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="form-field">
                <label>Project</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label><FiRepeat /> Repeat</label>
                <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                  <option value="none">No Repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>
              {recurrence === "custom" && (
                <>
                  <div className="form-field">
                    <label>Every</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customInterval}
                      onChange={(e) => setCustomInterval(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-field">
                    <label>Unit</label>
                    <select value={customUnit} onChange={(e) => setCustomUnit(e.target.value)}>
                      <option value="daily">Day(s)</option>
                      <option value="weekly">Week(s)</option>
                      <option value="monthly">Month(s)</option>
                      <option value="yearly">Year(s)</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="form-field">
              <label>Description</label>
              <textarea
                placeholder="Add notes or details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="form-field">
              <label><FiTag /> Tags</label>
              <div className="tag-selector">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`tag-chip ${selectedTags.includes(tag.name) ? "active" : ""}`}
                    style={{ "--tag-color": tag.color }}
                    onClick={() => toggleTag(tag.name)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
}
