# SES/DMS

Socio-Economic Survey (SES) and Detailed Measurement Survey (DMS) Data Collection and Management System.

## Phase 1 status

This repository currently provides runnable TypeScript shells only:

- `apps/mobile`: Expo and React Native field application shell.
- `apps/web`: Next.js management portal shell.
- `apps/api`: NestJS REST API shell with health and Swagger endpoints.

No database schema, Prisma models, business entities, authentication, questionnaire implementation, or survey data is included in this phase.

## Prerequisites

- Node.js 24 or later
- pnpm 12 or later
- Docker Desktop for the later PostgreSQL phase
- Android Studio and an Android Virtual Device or physical device for mobile testing

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

Run an application individually with `pnpm --filter @ses-dms/<app> dev`, where `<app>` is `api`, `mobile`, or `web`.

The API health endpoint is `http://localhost:3001/health`; Swagger is available at `http://localhost:3001/api/docs`.

## Documentation

- [Initial architecture](docs/architecture/initial-architecture.md)
- [Architecture decisions](docs/architecture/decisions.md)
- [Open questions](QUESTIONS.md)
