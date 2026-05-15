# GLOBAL CODING RULES
# These apply to ALL projects in the AI Dev Factory.
# Project-level CODING_RULES.md can extend but never contradict these.

---

## 1. Language & Types
- Use **TypeScript** everywhere — no plain `.js` files in any project
- No implicit `any` — all variables and function signatures must be typed
- Use `interface` for object shapes, `type` for unions and primitives
- Strict mode enabled in all `tsconfig.json` files

## 2. Code Style
- Use `async/await` — never raw `.then()` chains
- Keep functions under **40 lines** — extract if longer
- One responsibility per function
- Descriptive variable names — no single letters except loop counters
- No commented-out code — delete it
- No `console.log` in production code — use a proper logger

## 3. Error Handling
- Every `async` function must handle or propagate errors intentionally
- Never swallow errors silently — `catch (e) {}` is forbidden
- Always log errors with context (userId, requestId, relevant IDs)
- User-facing error messages must never expose internal details

## 4. Validation
- Validate ALL inputs at the API boundary before they touch business logic
- Sanitise all user input before writing to the database
- Fail fast — return validation errors immediately with clear messages

## 5. Security
- Never store plain-text passwords — bcrypt minimum 10 rounds
- Never log sensitive data: passwords, tokens, card numbers, PII
- Never hardcode secrets — all config via environment variables
- Always validate auth tokens on every protected route
- Rate limit all public-facing endpoints

## 6. Database
- Use migrations — never `synchronize: true` in production
- All tables use UUID primary keys
- All tables have `created_at` and `updated_at` timestamps
- Always index foreign keys and frequently queried columns
- Use transactions for multi-step writes
- Never do N+1 queries

## 7. Testing
- Unit tests for all service/business logic
- E2e tests for all user-facing flows
- Mock all external services and APIs in unit tests
- Tests must pass before a task is marked complete

## 8. Git
- Commit messages: `feat(module): description` / `fix(module): description`
- One logical change per commit
- Never commit `.env` files or secrets
- Generated code is committed automatically by the agent

## 9. File & Folder Naming
- Files:             `kebab-case.ts`
- Classes:           `PascalCase`
- Functions/vars:    `camelCase`
- Constants:         `UPPER_SNAKE_CASE`
- React components:  `PascalCase.tsx`

## 10. Dependencies
- Do not add a dependency if the standard library can do it
- Prefer well-maintained packages with >1M weekly downloads
- Always pin exact versions in `package.json` for reproducibility
