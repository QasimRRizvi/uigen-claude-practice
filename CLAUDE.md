# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack (requires node-compat.cjs)
npm run dev:daemon   # Start dev server in background, logs to logs.txt

# Build & lint
npm run build
npm run lint

# Testing
npm run test         # Run all tests with Vitest
npx vitest run src/lib/__tests__/file-system.test.ts  # Run a single test file

# Database
npm run setup        # Install deps + generate Prisma client + run migrations (first-time setup)
npm run db:reset     # Reset database (destructive)
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev  # Apply new migrations
```

## Code Style

Use comments sparingly. Only comment complex code.

## Environment

Copy `.env` and set:
- `ANTHROPIC_API_KEY` — optional; falls back to mock provider that generates demo components
- `JWT_SECRET` — optional; defaults to a dev key (7-day session cookies)

## Architecture

UIGen is a Next.js 15 app where users describe React components in chat and Claude AI generates live-previewed code in a virtual file system.

### Data Flow

```
User Chat Input
  → ChatContext (useChat from Vercel AI SDK)
  → POST /api/chat/route.ts
  → Claude (Anthropic) with two tools: str_replace_editor, file_manager
  → tool calls processed by FileSystemContext (in-memory virtual FS)
  → PreviewFrame (iframe) transforms JSX via Babel Standalone → live preview
  → on completion, project state saved to SQLite via Prisma
```

### Key Modules

**`/src/app/api/chat/route.ts`** — Streaming chat endpoint. Passes the virtual file system state and system prompt to Claude. Two tools available to Claude: `str_replace_editor` (edit files) and `file_manager` (create/delete/rename). Saves project to DB on stream completion.

**`/src/lib/file-system.ts`** — In-memory virtual file system class. No disk writes. Serializable to/from JSON for DB persistence.

**`/src/lib/contexts/file-system-context.tsx`** — React context wrapping the virtual FS. Processes tool call results from Claude and updates state. Used by PreviewFrame and CodeEditor.

**`/src/lib/contexts/chat-context.tsx`** — React context wrapping Vercel AI SDK's `useChat`. Submits messages to `/api/chat`, exposes tool call state, tracks anonymous work.

**`/src/lib/transform/jsx-transformer.ts`** — Transforms virtual FS files into a renderable iframe document using Babel Standalone. Generates import maps pointing to `esm.sh` CDN for npm packages.

**`/src/lib/provider.ts`** — Returns either the real Anthropic Claude model or a mock provider. Mock generates static demo components and simulates tool calls — useful for development without an API key.

**`/src/lib/prompts/`** — System prompts sent to Claude for component generation.

**`/src/lib/tools/`** — Definitions for the `str_replace_editor` and `file_manager` tools that Claude uses to manipulate files.

### Authentication

JWT-based auth with httpOnly cookies (7-day sessions). Server actions in `/src/actions/index.ts` handle sign-up, sign-in, sign-out, and `getUser`. Passwords hashed with bcrypt. Anonymous users are supported — their work is tracked via localStorage and can be persisted on sign-up.

### Routing

- `/` — Home: redirects authenticated users to their latest project (creates one if none exists); shows anonymous UI otherwise
- `/[projectId]` — Project view: loads project from DB for authenticated users
- `/api/chat` — Streaming POST endpoint for AI generation

### Database

The database schema is defined in `prisma/schema.prisma` — reference it anytime you need to understand the structure of data stored in the database.

### UI Structure

`main-content.tsx` renders a resizable two-panel layout: chat (35%) on the left, code editor + live preview (65%) on the right. shadcn/ui components throughout with Tailwind CSS v4.
