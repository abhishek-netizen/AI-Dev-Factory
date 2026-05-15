# AI Dev Factory

A local AI development orchestration repository for building and testing agent-driven workflows.

This repo contains:

- `docker-compose.yml` — master service orchestration for the AI stack and project apps
- `agent/` — AI agent controller service that manages tasks, Docker, git, and orchestration
- `llm/` — router service for LLM providers (Ollama, Claude, Deepseek)
- `telegram-bot/` — Telegram bot interface for driving the agent
- `testing/` — Playwright and Android/iOS testing scaffolding
- `shared/` — shared architecture and coding rule artifacts
- `projects/hello-world/` — a minimal full-stack quick-start example project that runs in Docker and verifies the repo setup.


## Repository structure

- `docker-compose.yml`: orchestrates services including Ollama, Redis, agent controller, LLM router, Telegram bot, Playwright, and the local example project stack.
- `agent/`: Node.js service for task processing, Docker management, and Git operations.
- `llm/`: Node.js service that routes requests to local Ollama or external providers.
- `telegram-bot/`: Node.js service that connects a Telegram bot to the agent.
- `projects/hello-world/`: minimal full-stack example with separate backend and frontend folders.
- `testing/`: automated test scaffolding and screenshots.
- `shared/`: reusable docs and rules for architecture and coding conventions.

## Quick start

### Prerequisites

- Docker
- Docker Compose
- A local PostgreSQL instance (the repo currently expects Postgres on the host machine)
- A `.env` file in the workspace root containing your secret values

### Required environment variables

Create a `.env` file at the repository root with at least the following values:

```env
TELEGRAM_TOKEN=your_telegram_bot_token
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=your_postgres_db_name
POSTGRES_PORT=5432
JWT_SECRET=your_jwt_secret
```

Optional provider variables:

```env
OLLAMA_MODEL=qwen2.5-coder:7b
DEEPSEEK_API_KEY=your_deepseek_api_key
CLAUDE_API_KEY=your_claude_api_key
DEFAULT_MODEL=ollama
```

### Start the stack

From the repository root:

```bash
docker compose up -d --build
```

Run the quick-start hello world project only:

```bash
docker compose up -d --build hello-world-api hello-world-web
```

Then open:

```text
http://localhost:5174
```

Check running services:

```bash
docker compose ps
```

Follow logs:

```bash
docker compose logs -f agent-controller
```

### Stop the stack

```bash
docker compose down
```

## Service overview

- `ollama`: local Ollama LLM service.
- `ollama-init`: preloads the `qwen2.5-coder:7b` model.
- `agent-controller`: orchestrates AI tasks and communicates with Docker and project files.
- `llm-router`: routes LLM requests to Ollama or external APIs.
- `telegram-bot`: exposes a Telegram bot interface.
- `playwright`: optional test container for browser automation.
- `hello-world-api`: hello-world backend service.
- `hello-world-web`: hello-world frontend service.
- `redis`: caching backend.

## Telegram bot usage

The Telegram bot is the primary user interface for this repo. It forwards your commands to the `agent-controller`, which then runs tasks or returns status.

### Send a message to the bot

1. Start the bot in Telegram and send `/start` or `/help`.
2. Use one of the supported commands:
   - `/start_task <project> <task>` — run a task from a project's `tasks/` folder
   - `/status <project> <task>` — check a specific task status
   - `/tasks <project>` — list available tasks for a project
   - `/logs <container>` — fetch container logs
   - `/new_project <name>` — scaffold a new project from the template

### Natural language support

The bot also understands simple text messages like:
- `status`
- `help`
- `restart <container>`

### Free-text task creation

You can send a plain instruction directly to the bot and it will create and execute a task automatically.
For example:

- `Change the heading to "Batmans Dark night"`

When the bot receives a plain instruction it will:
- create a new file like `projects/<project>/tasks/.taskN.md`
- call the agent endpoint `/task-from-bot`
- mark the new task as `running`
- attempt a quick local update or run the task through the LLM
- notify you when the task is complete or failed

This makes Telegram a lightweight task authoring interface without manual task file creation.

### How task execution works

When you send `/start_task <project> <task>`:

1. The Telegram bot receives your command and calls `agent-controller` at `/task`.
2. `agent-controller` marks the task as `running` in Redis and reads the task file from `/projects/<project>/tasks/<task>`.
3. It loads project context from `PROJECT_SPEC.md`, `ARCHITECTURE.md`, and `CODING_RULES.md`.
4. The agent builds a prompt and sends it to the LLM router.
5. The LLM response must return JSON containing `summary`, `files`, and optional `commands`.
6. The agent writes files into the project, runs post-write commands, and commits the change to git.
7. Task status is updated to `complete` or `failed` in Redis.

You can check progress with `/status <project> <task>` or `/tasks <project>`.

## Working with the codebase

- Edit the agent controller in `agent/src/`.
- Edit the LLM router in `llm/src/`.
- Edit the Telegram interface in `telegram-bot/src/`.
- Keep local app code in `projects/hello-world/` or your own project folder private if you plan to open source the repo.

## Useful commands

```bash
# Build and run all services
docker compose up -d --build

# Tail logs for a single service
docker compose logs -f telegram-bot

# Stop and remove containers
docker compose down

# Remove cached project folder from git if tracked
git rm -r --cached projects/hello-world
```

## Licensing

Add a license file when you open source this repository.
