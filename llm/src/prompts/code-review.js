// Wraps code in a structured review prompt
// Returns structured feedback the agent can act on

export function codeReviewPrompt(prompt) {
  return `
You are a senior TypeScript engineer performing a thorough code review.
Review the code below and return ONLY a JSON response — no extra text.

=== CODE TO REVIEW ===
${prompt}

=== RESPONSE FORMAT ===
{
  "summary": "overall assessment in one sentence",
  "score": 8,
  "passed": true,
  "issues": [
    {
      "severity": "error | warning | suggestion",
      "file": "path/to/file.ts",
      "line": 42,
      "message": "clear description of the issue",
      "fix": "how to fix it"
    }
  ],
  "positives": [
    "what was done well"
  ],
  "blockers": [
    "list of must-fix issues before this can be merged"
  ]
}

=== REVIEW CRITERIA ===
Check for these issues (severity in brackets):

[error]
- Missing input validation
- SQL injection or security vulnerabilities
- Unhandled promise rejections
- Missing error handling in async functions
- Hardcoded secrets or credentials
- Memory leaks (unclosed connections, event listeners)

[warning]
- Functions longer than 40 lines
- Missing TypeScript types (implicit any)
- Business logic in controllers (should be in services)
- Missing unit test coverage for public methods
- N+1 database query patterns
- Missing database indexes on foreign keys

[suggestion]
- Naming improvements
- Code duplication that could be extracted
- Performance improvements
- Better TypeScript patterns

Set "passed" to false if there are ANY errors or more than 3 warnings.
Set "score" from 1-10 based on overall quality.
`.trim();
}
