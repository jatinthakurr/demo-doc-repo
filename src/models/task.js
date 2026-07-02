let nextId = 1;

function createTask({ title, description = "", priority = "medium" }) {
  return {
    id: nextId++,
    title,
    description,
    priority,
    status: "todo",
    createdAt: new Date().toISOString(),
  };
}

module.exports = { createTask };
