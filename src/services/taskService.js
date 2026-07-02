const { createTask } = require("../models/task");

const tasks = new Map();

function listTasks({ status, assignee } = {}) {
  let all = Array.from(tasks.values());
  if (status) all = all.filter((t) => t.status === status);
  if (assignee) all = all.filter((t) => t.assignee === assignee);
  return all;
}

// Ranks matches by title hits before description hits so exact-ish results surface first.
function searchTasks(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const titleHits = [];
  const otherHits = [];

  for (const task of tasks.values()) {
    if (task.title.toLowerCase().includes(q)) {
      titleHits.push(task);
    } else if (
      task.description.toLowerCase().includes(q) ||
      task.tags.some((tag) => tag.toLowerCase().includes(q))
    ) {
      otherHits.push(task);
    }
  }

  return [...titleHits, ...otherHits];
}

function getTask(id) {
  return tasks.get(Number(id));
}

function addTask(input) {
  const task = createTask(input);
  tasks.set(task.id, task);
  return task;
}

function updateTaskStatus(id, status) {
  const task = tasks.get(Number(id));
  if (!task) return null;
  task.status = status;
  return task;
}

function assignTask(id, assignee) {
  const task = tasks.get(Number(id));
  if (!task) return null;
  task.assignee = assignee;
  return task;
}

function removeTask(id) {
  return tasks.delete(Number(id));
}

function updateTask(id, updates) {
  const task = tasks.get(Number(id));
  if (!task) return null;

  if (updates.title !== undefined) task.title = updates.title;
  if (updates.description !== undefined) task.description = updates.description;
  if (updates.priority !== undefined) task.priority = updates.priority;
  if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
  if (updates.tags !== undefined) task.tags = updates.tags;

  return task;
}


module.exports = {
  listTasks,
  getTask,
  addTask,
  updateTaskStatus,
  assignTask,
  searchTasks,
  removeTask,
  updateTask,
};
