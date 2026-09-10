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

## ADR-011: First migration uses PostgreSQL CHECK constraints for safe relationship rules

**Status:** Accepted for Phase 3C

The initial migration adds database-level `CHECK` constraints for relationship rules that Prisma cannot express directly: business owner XOR person/organization, land owner XOR person/organization, structure occupancy XOR household/business/person, and preventing self-associated structures.

## ADR-012: Phase 3C seeds lookup families, not unresolved category values

**Status:** Accepted for Phase 3C

The seed script creates lookup-set shells and minimal questionnaire-version rows only. It does not seed authoritative civil status, employment status, education, relationship, structure, or land-use values while classification conflicts remain unresolved.

## ADR-013: Phase 4A exposes only core API backbone resources

**Status:** Accepted for Phase 4A

The first API layer exposes Projects, Survey Areas, Users, Questionnaire Versions, Persons, Interviews, and nested Interview Modules only. Household, Business, Land, Structure, ownership, membership, questionnaire response, reporting, synchronization, and review workflow APIs remain deferred.

## ADR-014: DTO validation rejects unknown fields

**Status:** Accepted for Phase 4A

The NestJS API uses a global validation pipe with whitelist, forbidden non-whitelisted fields, and transformation enabled. This keeps Phase 4A REST payloads explicit and prevents accidental acceptance of unsupported questionnaire or workflow data.

## ADR-015: Phase 4B relationship APIs validate domain links before persistence

**Status:** Accepted for Phase 4B

The Household, Business, Land, and Structure APIs validate required references, project boundaries, ownership XOR rules, occupancy XOR rules, and safe duplicate relationship cases at the service layer. No new database migrations or unique constraints are introduced in Phase 4B.

## ADR-016: Questionnaire responses use a hybrid storage model

**Status:** Accepted for Phase 4D

Stable SES/DMS domain entities remain normalized, while raw questionnaire responses are stored flexibly under `InterviewModule` using stable `questionCode` values, typed value columns, raw values, explicit response states, and optional repeat-instance context. Phase 4D does not introduce a full question/form-definition engine.

## ADR-017: Response writes use module-level optimistic concurrency

**Status:** Accepted for Phase 4D

`InterviewModule.revision` is the first server-side concurrency token. Bulk response writes require `expectedRevision`, update responses transactionally, increment the module revision on success, and return HTTP `409 Conflict` for stale revisions without automatic merge.

## ADR-018: Nullable repeat response uniqueness uses PostgreSQL partial indexes

**Status:** Accepted for Phase 4D

Questionnaire responses are logically unique by module, question code, and repeat instance. Because root-level responses have `NULL` repeat instance IDs and PostgreSQL normal unique constraints allow multiple nulls, Phase 4D uses partial unique indexes for root-level and repeated responses.

## ADR-019: Phase 4E sync uses module-level bundles and receipts

**Status:** Accepted for Phase 4E

The first sync contract accepts existing interview/module IDs only and applies each module bundle transactionally. `InterviewModule.revision` remains the conflict token, and one accepted module bundle increments revision exactly once.

## ADR-020: Sync retries use client-generated request receipts

**Status:** Accepted for Phase 4E

Sync clients send a UUID `syncRequestId`. The server stores a minimal `SyncRequest` receipt with request and response JSON; completed duplicate requests return the stored response without applying mutations again.

## ADR-021: Delete/tombstone sync is deferred

**Status:** Accepted for Phase 4E

Phase 4E does not implement hard delete or tombstone synchronization for questionnaire responses or repeat instances. The first mobile prototype should avoid deleting already-synced records until tombstone semantics are designed.

## ADR-022: Mobile offline storage uses direct Expo SQLite

**Status:** Accepted for Phase 5A

The first mobile offline foundation uses `expo-sqlite` directly with a small migration/repository layer. No heavy mobile ORM is introduced while the local schema and sync contract are still stabilizing.

## ADR-023: Mobile local sync state is separate from server workflow state

**Status:** Accepted for Phase 5A

The mobile app stores local network/sync status separately from server interview/module workflow status. Local states such as `LOCAL_ONLY`, `DIRTY`, `SYNCED`, and `CONFLICT` must not be overloaded with server workflow states such as `DRAFT`, `FOR_VALIDATION`, or `FINALIZED`.

## ADR-024: Phase 5A prepares outbox records but does not process them

**Status:** Accepted for Phase 5A

The mobile app can enqueue module-level sync work in `sync_outbox`, but no background worker, retry loop, or upload to `POST /sync/interviews` is implemented in Phase 5A.

## ADR-025: Phase 5B sync is foreground/manual only

**Status:** Accepted for Phase 5B

The first mobile-to-server synchronization flow processes `SYNC_MODULE` outbox rows only when explicitly triggered from the debug screen. No background worker, automatic retry timer, or hidden retry behavior is introduced.

## ADR-026: Mobile sync retries reuse persisted request IDs

**Status:** Accepted for Phase 5B

Each outbox sync operation stores a `sync_request_id` before the network request. Retries of the same operation reuse that ID so server-side sync receipts can prevent duplicate application.

## ADR-027: Mobile conflicts preserve local edits

**Status:** Accepted for Phase 5B

When the server returns a module revision conflict, the mobile app marks the module and outbox row as conflicted and stores the remote revision on the outbox row. It does not overwrite local responses, repeat instances, or attempt field-level merge.

## ADR-028: Phase 5C create-on-sync preserves client UUIDs

**Status:** Accepted for Phase 5C

Offline-created mobile interview graphs use client-generated UUIDs as the final server IDs. The server validates server-owned references, creates each new interview graph transactionally, initializes new modules at revision `1`, and returns per-graph `REJECTED` results for invalid create bundles without ID remapping.

## ADR-029: Phase 6B uses bundled versioned questionnaire definitions

**Status:** Accepted for Phase 6B

The first dynamic renderer loads versioned questionnaire definitions bundled with the mobile app and resolves them through a registry by `moduleType` and `versionCode`. Definitions drive rendering, simple rules, repeat groups, and completion calculation while existing SQLite response/repeat tables remain the persistence model.

## ADR-030: Phase 6C keeps Household expansion definition-only

**Status:** Accepted for Phase 6C

The fuller Household questionnaire coverage remains bundled in the mobile definition and persists through existing response/repeat tables. Repeat sections are selected through definition metadata, and cross-module cues such as Business recommendations are enumerator-facing only; no backend-driven definition service, new sync contract, new normalized models, or automatic module creation is introduced in Phase 6C.

## ADR-031: Phase 6D uses one generic mobile questionnaire screen

**Status:** Accepted for Phase 6D

Household and Business questionnaires use the same `QuestionnaireScreen`, which resolves the bundled definition from the local module type and version code. Module-specific screens may remain as thin wrappers only. Business is added as another versioned bundled definition and continues to persist through existing local response, repeat, dirty-module, and outbox paths without backend, schema, or sync-contract changes.
