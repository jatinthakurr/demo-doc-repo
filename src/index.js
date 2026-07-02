const express = require("express");
const tasksRouter = require("./routes/tasks");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/tasks", tasksRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Task Manager API listening on http://localhost:${PORT}`);
});
