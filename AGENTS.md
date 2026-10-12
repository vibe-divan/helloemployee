# AGENTS.md

This file defines how AI agents should work in this repository.

## Language

- Write all code, comments, commit messages, and documentation in English.
- Use English for internal reasoning and planning.
- Respond to the user in the user's language.
- Be concise. Lead with the result; skip preamble and do not restate the request.

## Toolchain

- Runtime & package manager: **Bun** (not Node.js, not npm/pnpm/yarn)
- Frontend: **React** (not Vue, not Angular)
- Backend features: **Tanstack start** (not Next.js, not Solid Start)
- Database querying: **Kysely** (not Prisma, not Drizzle)
- Language: **TypeScript** in strict mode
- Test runner: **`bun:test`** (not Jest, not Vitest)

## Repository-wide rules

1. **Do not change anything unless explicitly asked.**
   Only act when the user asks for a change. Research, questions, and discussion are not requests to modify the project.

2. **Do not treat a problem description as a request to fix it.**
   If the user describes a bug, error, or odd behavior without asking to fix it, treat it as context. Ask first.

3. **Do not assume — verify.**
   Never claim "it works because...". Show real evidence: actual command output or actual code. This applies to code too — run `bun oxlint` and `bun run --workspaces typecheck`, and confirm you left no errors, including errors that were not yours before you touched the file.

4. **Do not touch what was not asked about.**
   Modify only files directly necessary for the task. Do not refactor, reformat, or "improve" neighboring code.

5. **State uncertainty explicitly.**
   If you cannot verify a claim, mark it as unverified. Do not present assumptions as facts.

6. **Stop before irreversible actions.**
   Before any command that deletes, overwrites, or reverts (`rm`, `git reset`, `git checkout`, `git clean`), stop and ask. Even if it seems like part of verification.

7. **Write comments that explain why, not what — and keep them terse.**
   Code should be self-explanatory about _what_ it does. Comments explain _why_ — the reasoning, the constraint, the workaround, the tradeoff.
   - Keep them telegraphic and article-free: one line, two at most. No multi-paragraph JSDoc.
   - On public APIs, state the contract briefly; skip `@example` unless usage is genuinely non-obvious.
   - Bad: `// Increment counter by one`, or a "guide" above a function.
   - Good: `// Retry once: upstream occasionally drops first request`
