# Architecture Decisions

## ADR-001: TypeScript pnpm monorepo

**Status:** Accepted for Phase 1

The project uses pnpm workspaces with React Native/Expo, Next.js, NestJS, PostgreSQL, and Prisma as the agreed technical direction. Phase 1 uses pnpm recursive scripts rather than a separate build orchestrator to keep the foundation small.

## ADR-002: Database modeling follows documentation review

**Status:** Accepted for Phase 1

No Prisma schema, migrations, or database entities will be created until the reviewed domain documentation describes entities, relationships, role overlap, repeatable sections, validation, and questionnaire versioning.

## ADR-003: Offline-first source-of-truth model

**Status:** Proposed, pending workflow review

Mobile SQLite will safely hold local drafts and pending synchronization work. The centralized API and PostgreSQL database will be the authoritative source after successful synchronization.
