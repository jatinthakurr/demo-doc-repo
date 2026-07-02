let nextId = 1;

function createTask({ title, description = "", priority = "medium", assignee = null, dueDate = null, tags = [] }) {
  return {
    id: nextId++,
    title,
    description,
    priority,
    status: "todo",
    assignee,
    dueDate,
    tags,
    createdAt: new Date().toISOString(),
  };
}

module.exports = { createTask };
