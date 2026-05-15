# GLOBAL ARCHITECTURE GUIDELINES
# These apply to ALL projects in the AI Dev Factory.
# Project-level ARCHITECTURE.md can add detail but must follow this foundation.

---

## Stack

| Layer    | Technology              |
|----------|-------------------------|
| Backend  | NestJS + TypeScript      |
| Frontend | React + Vite + TypeScript|
| Mobile   | React Native + Expo      |
| Database | PostgreSQL + TypeORM     |
| Cache    | Redis                    |
| Auth     | JWT (Bearer token)       |

---

## Backend — NestJS Pattern

Every feature is a **self-contained NestJS module**:

```
src/modules/<feature>/
├── <feature>.module.ts       ← wires everything together
├── <feature>.controller.ts   ← HTTP only, no business logic
├── <feature>.service.ts      ← all business logic
├── <feature>.repository.ts   ← all DB queries
├── dto/
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
└── entities/
    └── <feature>.entity.ts
```

### Layer responsibilities
- **Controller** — parse request, call service, return response. Nothing else.
- **Service** — business logic, orchestration, calls repository
- **Repository** — all database interaction, no business logic
- **DTO** — input validation using `class-validator`
- **Entity** — TypeORM entity, maps to DB table

### Global setup in main.ts
```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.useGlobalInterceptors(new ResponseInterceptor());
app.useGlobalFilters(new HttpExceptionFilter());
app.setGlobalPrefix('api/v1');
```

---

## API Response Format

All endpoints return this consistent shape:

```json
{
  "data":       {},
  "message":    "success",
  "statusCode": 200
}
```

Enforced via a global `ResponseInterceptor` — never construct manually in controllers.

---

## Frontend — React Pattern

```
src/
├── components/     ← reusable UI, no API calls, receives props only
├── pages/          ← one per route, composes components, calls hooks
├── hooks/          ← data fetching, state, side effects
├── store/          ← Zustand global state (auth, user, UI)
├── api/            ← all API calls, typed with shared interfaces
├── types/          ← shared TypeScript interfaces
└── utils/          ← pure helper functions
```

### Rules
- Components are dumb — no direct API calls, no business logic
- Pages orchestrate — call hooks, pass data to components
- All API calls live in `src/api/` — never inline in components

---

## Mobile — React Native Pattern

```
app/            ← Expo Router file-based navigation
components/     ← reusable components
screens/        ← full screens (when not using file-based routing)
hooks/          ← same hooks pattern as frontend where possible
store/          ← Zustand (share store logic with frontend where possible)
constants/      ← theme, colors, font sizes
```

---

## Shared Types

Where frontend and mobile share the same API types, define them once:

```
shared-types/
└── index.ts    ← exported interfaces used by both web and mobile
```

---

## Environment Variables

Every project must validate env vars on startup:

```typescript
// config/env.validation.ts
import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsNumber()  PORT: number;
  @IsString()  DATABASE_URL: string;
  @IsString()  JWT_SECRET: string;
  @IsString()  REDIS_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated);
  if (errors.length > 0) throw new Error(errors.toString());
  return validated;
}
```

---

## Port Conventions

| Service          | Port  |
|-----------------|-------|
| NestJS API       | 4000  |
| React (Vite)     | 5173  |
| Expo Metro       | 8081  |
| Expo DevTools    | 19000 |
| PostgreSQL       | 5432  |
| Redis            | 6379  |
| Ollama           | 11434 |
| Agent Controller | 5000  |
| LLM Router       | 6000  |
