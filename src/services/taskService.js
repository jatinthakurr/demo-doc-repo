const { createTask } = require("../models/task");

const tasks = new Map();

function listTasks({ status } = {}) {
  const all = Array.from(tasks.values());
  return status ? all.filter((t) => t.status === status) : all;
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

function removeTask(id) {
  return tasks.delete(Number(id));
}

module.exports = { listTasks, getTask, addTask, updateTaskStatus, removeTask };
