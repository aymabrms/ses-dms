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

## ADR-004: Phase 2 documentation before database design

**Status:** Accepted for Phase 2

Phase 2 is limited to questionnaire analysis and conceptual domain modeling. Prisma models, migrations, authentication, questionnaire screens, API business logic, and synchronization implementation remain deferred.

## ADR-005: Questionnaires are overlapping modules

**Status:** Accepted for domain modeling

Household, Business, and Landowner questionnaires share interview, respondent, person, land, structure, livelihood, project awareness, and certification concepts. They should be modeled as overlapping modules rather than isolated systems.

## ADR-006: Respondent and subject are separate concepts

**Status:** Accepted for domain modeling

The source questionnaires separately capture respondent details and subject details such as household head, business owner, and landowner. The system must not assume the respondent is the subject unless the relationship is explicitly established.

## ADR-007: Repeatable records are not fixed numbered fields

**Status:** Accepted for domain modeling

Household members, business employees, associated structures, tenants/renters, and project feedback items are variable-length data. Fixed fields such as `member1`, `member2`, or `employee1` should be avoided in later design.

## ADR-008: Phase 3B Prisma schema backbone

**Status:** Accepted for Phase 3B

The first database schema implements only the stable domain backbone: projects, survey areas, users, questionnaire versions, interviews, interview modules, people, identity observations, households, memberships, businesses, organizations, ownership links, land parcels, structures, structure tags, structure associations, structure occupancy, and lookup sets/values.

## ADR-009: Raw questionnaire classifications are preserved

**Status:** Accepted for Phase 3B

Unresolved questionnaire classifications such as employment status, civil status, relationship to household head, structure type, and land use are not encoded as Prisma enums. Raw source values are preserved and configurable lookup tables are introduced for later normalization.

## ADR-010: Structure tags are not primary keys

**Status:** Accepted for Phase 3B

Structures use internal UUIDs as authoritative identifiers. Captured tag values are stored separately and are not globally unique until the confirmed uniqueness scope is known.
