# CODING RULES

These rules apply to ALL code written in this project.
The AI agent must follow every rule without exception.

---

## 1. Language & Types
- Use **TypeScript** everywhere — no plain `.js` files
- No implicit `any` — all variables and function signatures must be typed
- Use `interface` for object shapes, `type` for unions and primitives
- Enable strict mode in all `tsconfig.json` files

## 2. Code Style
- Use `async/await` — never raw `.then()` chains
- Keep functions under **40 lines** — extract if longer
- One responsibility per function
- Descriptive variable names — no single letters except loop counters
- No commented-out code — delete it

## 3. Error Handling
- Every `async` function must have try/catch or propagate errors intentionally
- Never swallow errors silently (`catch (e) {}` is forbidden)
- Use NestJS built-in `HttpException` classes for API errors
- Log errors with context: `this.logger.error('message', { userId, error })`

## 4. Validation
- All API inputs validated with `class-validator` DTOs
- All DTOs use `@IsString()`, `@IsEmail()`, `@IsNotEmpty()` etc.
- Use `ValidationPipe` globally in `main.ts`
- Sanitise all user input before DB writes

## 5. Security
- Never store plain-text passwords — always use bcrypt (min rounds: 10)
- Never expose internal error messages to API consumers
- Never log sensitive data (passwords, tokens, card numbers)
- Always validate JWT on protected routes
- Rate limit all public endpoints

## 6. Database
- Use TypeORM migrations — never `synchronize: true` in production
- All relations must have explicit `@JoinColumn` decorators
- Always add DB indexes on foreign keys and frequently queried columns
- Use transactions for multi-step DB operations
- Never do N+1 queries — use `queryBuilder` with joins

## 7. Testing
- Write **Jest** unit tests for all service methods
- Write **Playwright** e2e tests for all user-facing flows
- Test file lives next to the file it tests: `auth.service.spec.ts`
- Minimum coverage: 70% for services
- Mock all external dependencies in unit tests

## 8. Git
- Commit messages follow: `feat(module): description`
- One logical change per commit
- Never commit `.env` files
- Branch naming: `feature/task-id-description`

## 9. File Naming
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions and variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- React components: `PascalCase.tsx`

## 10. API Responses
Always use this consistent response shape:
```typescript
{
  data:       T,
  message:    string,
  statusCode: number
}
```
Use NestJS interceptors to enforce this globally — never manually construct responses in controllers.
