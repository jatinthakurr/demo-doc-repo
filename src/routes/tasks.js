const express = require("express");
const taskService = require("../services/taskService");
const { validateTaskInput, validateStatus } = require("../utils/validate");

const router = express.Router();

// GET /tasks?status=todo&assignee=alice
router.get("/", (req, res) => {
  res.json(taskService.listTasks({ status: req.query.status, assignee: req.query.assignee }));
});

// GET /tasks/search?q=keyword
router.get("/search", (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "q query parameter is required" });
  res.json(taskService.searchTasks(q));
});

// GET /tasks/:id
router.get("/:id", (req, res) => {
  const task = taskService.getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// POST /tasks
router.post("/", (req, res) => {
  const errors = validateTaskInput(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const task = taskService.addTask(req.body);
  res.status(201).json(task);
});

// PUT /tasks/:id
router.put("/:id", (req, res) => {
  const errors = validateTaskInput(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const task = taskService.updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// PATCH /tasks/:id/status
router.patch("/:id/status", (req, res) => {
  if (!validateStatus(req.body?.status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const task = taskService.updateTaskStatus(req.params.id, req.body.status);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// PATCH /tasks/:id/assignee
router.patch("/:id/assignee", (req, res) => {
  const task = taskService.assignTask(req.params.id, req.body?.assignee ?? null);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// DELETE /tasks/:id
router.delete("/:id", (req, res) => {
  const removed = taskService.removeTask(req.params.id);
  if (!removed) return res.status(404).json({ error: "Task not found" });
  res.status(204).send();
});

module.exports = router;
