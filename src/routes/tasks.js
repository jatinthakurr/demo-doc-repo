const express = require("express");
const taskService = require("../services/taskService");
const { validateTaskInput, validateStatus } = require("../utils/validate");

const router = express.Router();

// GET /tasks?status=todo
router.get("/", (req, res) => {
  res.json(taskService.listTasks({ status: req.query.status }));
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

// PATCH /tasks/:id/status
router.patch("/:id/status", (req, res) => {
  if (!validateStatus(req.body?.status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const task = taskService.updateTaskStatus(req.params.id, req.body.status);
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
