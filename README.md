# SwatchNet
<<<<<<< HEAD

SwatchNet is a community-driven civic cleanliness and reporting platform.

## Architecture

This project is organized as a monorepo using `pnpm` workspaces:

```text
swatchnet/
├── apps/
│   ├── web/       # Frontend: React + TypeScript + Vite + Tailwind CSS
│   └── api/       # Backend: Node.js + Express + TypeScript + Drizzle ORM
├── packages/
│   └── shared/    # Shared types, validation schemas (Zod), and utilities
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (v9+ recommended)

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Run development servers:**
   - Run both frontend and backend:
     ```bash
     pnpm dev
     ```
   - Run frontend only:
     ```bash
     pnpm dev:web
     ```
   - Run backend only:
     ```bash
     pnpm dev:api
     ```

4. **Type check:**
   ```bash
   pnpm typecheck
   ```
=======
Where Cleanliness Meets Technology
"Work in progress"
>>>>>>> origin/main
