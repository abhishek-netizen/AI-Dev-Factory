# ARCHITECTURE

## Overview
<!-- Brief description of the overall system design -->

---

## Backend Structure (NestJS)

```
src/
├── app.module.ts               ← root module
├── main.ts                     ← entry point, sets PORT from env
│
├── config/                     ← env config, validation schemas
│
├── common/                     ← shared across all modules
│   ├── decorators/
│   ├── filters/                ← exception filters
│   ├── guards/                 ← auth guards
│   ├── interceptors/
│   └── pipes/                  ← validation pipes
│
└── modules/
    └── <feature>/
        ├── <feature>.module.ts
        ├── <feature>.controller.ts   ← HTTP layer only, no business logic
        ├── <feature>.service.ts      ← all business logic lives here
        ├── <feature>.repository.ts   ← all DB queries live here
        ├── dto/
        │   ├── create-<feature>.dto.ts
        │   └── update-<feature>.dto.ts
        └── entities/
            └── <feature>.entity.ts
```

### Rules
- Controllers handle HTTP only — no business logic
- Services handle business logic — no DB queries
- Repositories handle DB queries — no business logic
- DTOs validate all incoming data using class-validator
- Never use `any` type

---

## Frontend Structure (React + Vite)

```
src/
├── main.tsx                    ← entry point
├── App.tsx                     ← router setup
│
├── components/                 ← reusable UI components
│   └── <ComponentName>/
│       ├── index.tsx
│       └── <ComponentName>.module.css
│
├── pages/                      ← one folder per route
│   └── <PageName>/
│       └── index.tsx
│
├── hooks/                      ← custom React hooks
├── store/                      ← Zustand global state
├── api/                        ← API client functions
├── types/                      ← shared TypeScript types
└── utils/                      ← helper functions
```

---

## Mobile Structure (React Native + Expo)

```
app/
├── _layout.tsx                 ← root layout
└── (tabs)/                     ← tab navigator
    └── index.tsx

components/                     ← reusable components
screens/                        ← full screens
hooks/                          ← custom hooks
store/                          ← Zustand state
constants/                      ← theme, colors, sizes
```

---

## Database
- **ORM:** TypeORM
- **Migrations:** always use migrations, never `synchronize: true` in production
- All tables use UUID primary keys
- All tables have `created_at` and `updated_at` timestamps

## API Design
- REST API
- All routes prefixed with `/api/v1`
- Authentication via Bearer JWT token
- Consistent response format:
```json
{
  "data": {},
  "message": "success",
  "statusCode": 200
}
```

## Caching Strategy
- Redis for session storage
- Redis for rate limiting
- Cache TTL defined per use case

## Environment Variables
- All config via environment variables
- Never hardcode secrets
- Validate all env vars on startup using Joi or class-validator
