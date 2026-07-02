const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_STATUSES = ["todo", "in_progress", "done"];

function validateTaskInput(body) {
  const errors = [];

  if (!body || typeof body.title !== "string" || body.title.trim() === "") {
    errors.push("title is required and must be a non-empty string");
  }

  if (body?.priority && !VALID_PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
  }

  if (body?.dueDate && Number.isNaN(Date.parse(body.dueDate))) {
    errors.push("dueDate must be a valid ISO date string");
  }

  if (body?.tags && !Array.isArray(body.tags)) {
    errors.push("tags must be an array of strings");
  }

  return errors;
}

function validateStatus(status) {
  return VALID_STATUSES.includes(status);
}

module.exports = { validateTaskInput, validateStatus, VALID_PRIORITIES, VALID_STATUSES };
