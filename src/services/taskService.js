/**
 * Cloud task service — syncs tasks with Supabase
 * Works alongside the local Zustand store for offline-first support
 */
import { supabase } from "../lib/supabase";

// Fetch tasks for the current user (personal + group tasks)
export async function fetchCloudTasks(groupId = null) {
  let query = supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (groupId) {
    query = query.eq("group_id", groupId);
  } else {
    query = query.is("group_id", null);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Map DB columns to app format
  return (data || []).map(mapDbToTask);
}

// Create a task in the cloud
export async function createCloudTask(task, userId, groupId = null) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      id: task.id,
      title: task.title,
      description: task.description || "",
      date: task.date || null,
      priority: task.priority || "Medium",
      status: task.status || "todo",
      tags: task.tags || [],
      subtasks: task.subtasks || [],
      recurrence: task.recurrence || null,
      estimated_time: task.estimatedTime || 0,
      time_spent: task.timeSpent || 0,
      owner_id: userId,
      group_id: groupId,
      assigned_to: task.assignedTo || null,
      completed_at: task.completedAt || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToTask(data);
}

// Update a task in the cloud
export async function updateCloudTask(taskId, updates) {
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.date !== undefined) dbUpdates.date = updates.date || null;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.subtasks !== undefined) dbUpdates.subtasks = updates.subtasks;
  if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;
  if (updates.estimatedTime !== undefined) dbUpdates.estimated_time = updates.estimatedTime;
  if (updates.timeSpent !== undefined) dbUpdates.time_spent = updates.timeSpent;
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

  const { error } = await supabase
    .from("tasks")
    .update(dbUpdates)
    .eq("id", taskId);

  if (error) throw error;
}

// Delete a task from the cloud
export async function deleteCloudTask(taskId) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

// Assign a task to a user
export async function assignTask(taskId, userId) {
  const { error } = await supabase
    .from("tasks")
    .update({ assigned_to: userId })
    .eq("id", taskId);
  if (error) throw error;
}

// Subscribe to real-time task changes for a group
export function subscribeToGroupTasks(groupId, onInsert, onUpdate, onDelete) {
  const channel = supabase
    .channel(`group-tasks-${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tasks",
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => onInsert(mapDbToTask(payload.new))
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "tasks",
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => onUpdate(mapDbToTask(payload.new))
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "tasks",
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => onDelete(payload.old.id)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// Subscribe to personal task changes
export function subscribeToPersonalTasks(userId, onInsert, onUpdate, onDelete) {
  const channel = supabase
    .channel(`personal-tasks-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tasks",
        filter: `owner_id=eq.${userId}`,
      },
      (payload) => {
        if (!payload.new.group_id) onInsert(mapDbToTask(payload.new));
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "tasks",
        filter: `owner_id=eq.${userId}`,
      },
      (payload) => {
        if (!payload.new.group_id) onUpdate(mapDbToTask(payload.new));
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "tasks",
        filter: `owner_id=eq.${userId}`,
      },
      (payload) => onDelete(payload.old.id)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// Map Supabase row to app task format
function mapDbToTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    date: row.date || "",
    priority: row.priority,
    status: row.status,
    tags: row.tags || [],
    subtasks: row.subtasks || [],
    recurrence: row.recurrence || null,
    estimatedTime: row.estimated_time || 0,
    timeSpent: row.time_spent || 0,
    projectId: "proj-default",
    ownerId: row.owner_id,
    groupId: row.group_id,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}
