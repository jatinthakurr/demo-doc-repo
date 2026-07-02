# Task Manager API (Demo)

A tiny in-memory REST API for tasks. This repo exists purely as a **sandbox for testing the OWN Documentation Agent pipeline** — init and update runs.

## Endpoints
- `GET /health`
- `GET /tasks?status=todo|in_progress|done`
- `GET /tasks/:id`
- `POST /tasks` — body: `{ title, description?, priority? }`
- `PATCH /tasks/:id/status` — body: `{ status }`
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
