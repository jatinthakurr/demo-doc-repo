# TaskFlow — Lightweight Task Orchestration for Small Teams

TaskFlow is a minimal task-tracking backend built for small, fast-moving teams (5-20 people) who find tools like Jira and Asana too heavy for day-to-day work. Instead of boards, sprints, and configuration screens, TaskFlow exposes a single clean API for creating tasks, tracking their status, and prioritizing what matters — so teams can wire task tracking directly into the tools they already use (Slack bots, internal dashboards, CLI tools) instead of context-switching into a separate app.

## The problem

Small teams default to general-purpose project management tools that were designed for large organizations. The result: hours lost per week on ceremony — updating boards, triaging backlogs, navigating nested menus — for teams that just need to know "what's next" and "who's blocked."

## The approach

TaskFlow strips task tracking down to three primitives — **create, prioritize, resolve** — and exposes them as a fast, predictable REST API rather than a UI-first product. Every task carries a priority (`low` / `medium` / `high`) and a status (`todo` / `in_progress` / `done`), which is enough state to drive standups, dashboards, and automated nudges without the overhead of a full project-management suite.

Because the surface area is intentionally small, TaskFlow is easy to embed: a Slack `/task` command, an internal ops dashboard, or a CI pipeline can all read and write the same task list through one consistent contract.

## Who it's for

- **Engineering teams** who want lightweight task tracking wired directly into Slack or their internal tools instead of a heavyweight PM suite.
- **Ops and support teams** running short-lived, high-churn task lists (incident follow-ups, onboarding checklists) where board-based tools add friction.
- **Platform teams** building an internal tool or bot that needs a simple, embeddable task backend rather than a full product to integrate against.

## Endpoints
- `GET /health`
- `GET /tasks?status=todo|in_progress|done&assignee=alice`
- `GET /tasks/search?q=keyword` — matches title, description, and tags
- `GET /tasks/:id`
- `POST /tasks` — body: `{ title, description?, priority?, assignee?, dueDate?, tags? }`
- `PATCH /tasks/:id/status` — body: `{ status }`
- `PATCH /tasks/:id/assignee` — body: `{ assignee }`
- `DELETE /tasks/:id`

## Run locally
```bash
npm install
npm run dev
```

## Using this repo to test the doc pipeline

1. Connect it (run from this directory, using the URL/secret from your running OWN Documentation Agent instance):
   ```powershell
   irm -Headers @{"ngrok-skip-browser-warning"="true"} https://<your-ngrok-or-app-url>/api/connect-script `
     | node - --url https://<your-ngrok-or-app-url> --secret <your-webhook-secret>
   ```
   This writes `ai-docs.js` + `.github/workflows/ai-docs.yml` and pushes a setup commit — that push triggers **init mode** (all `src/**` files sent, full doc generated).

2. To test **update mode**, change a file under `src/` (e.g. add a field to `Task`, add a new route) and push:
   ```bash
   git add -A
   git commit -m "feat: add due date to tasks"
   git push
   ```
   Only the changed files are sent, and the pipeline patches the affected doc sections.

3. To force a full re-init later:
   ```bash
   gh workflow run ai-docs.yml --ref main -f mode=init
   ```
