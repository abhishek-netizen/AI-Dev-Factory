# Task: [Short Title of What to Build]

## Context
<!--
Why does this task exist?
What does the user experience before and after this is implemented?
-->

## Requirements

### Backend
<!--
List every API endpoint, service method, or DB change needed.

- [ ] POST /api/v1/example — create a thing
- [ ] GET  /api/v1/example/:id — get a thing by id
- [ ] Create `example` table with columns: id, name, created_at
- [ ] ExampleModule, ExampleController, ExampleService, ExampleRepository
- [ ] CreateExampleDto with validation
-->

### Frontend
<!--
List every page, component, or state change needed.

- [ ] ExamplePage at route /example
- [ ] ExampleForm component with controlled inputs
- [ ] Connect to POST /api/v1/example on submit
- [ ] Show success/error toast on response
-->

### Mobile
<!--
List every screen, component, or navigation change needed.

- [ ] ExampleScreen in (tabs)/example.tsx
- [ ] Connect to API
- [ ] Handle loading and error states
-->

## Data Models

```typescript
// Example entity shape
interface Example {
  id:         string;   // UUID
  name:       string;
  createdAt:  Date;
  updatedAt:  Date;
}

// Example DTO
interface CreateExampleDto {
  name: string;   // required, min 2 chars, max 100 chars
}
```

## Acceptance Criteria
<!--
These are the pass/fail conditions the AI checks after writing code.
Be specific — the AI will write tests based on these.

- [ ] User can submit the form and see a success message
- [ ] Empty name shows validation error "Name is required"
- [ ] API returns 201 on success with the created object
- [ ] API returns 400 if name is missing
- [ ] Data persists in PostgreSQL after creation
-->

## Notes
<!--
Any edge cases, gotchas, or extra context the AI should know.

- Reuse the existing AuthGuard for protected routes
- Follow the same pattern as the users module
-->
