# Phase 3C Migration

Phase 3C hardens the Phase 3B Prisma schema, creates the first PostgreSQL migration, applies it locally, and adds minimal safe seed data.

## Migration

- Migration name: `20260910154201_init_domain_backbone`
- Prisma migration folder: `apps/api/prisma/migrations/20260910154201_init_domain_backbone/`

## Tables created

- `projects`
- `survey_areas`
- `users`
- `questionnaire_versions`
- `interviews`
- `interview_modules`
- `persons`
- `person_identity_observations`
- `households`
- `household_memberships`
- `businesses`
- `organizations`
- `business_ownerships`
- `business_employees`
- `land_parcels`
- `land_ownerships`
- `structures`
- `structure_tags`
- `structure_associations`
- `structure_occupancies`
- `lookup_sets`
- `lookup_values`

## PostgreSQL CHECK constraints

The following constraints are added directly in the generated migration SQL because Prisma schema syntax does not currently express these `CHECK` constraints directly:

- `business_ownerships_exactly_one_owner_check`: requires exactly one of `personId` or `organizationId`.
- `land_ownerships_exactly_one_owner_check`: requires exactly one of `personId` or `organizationId`.
- `structure_occupancies_exactly_one_occupant_check`: requires exactly one of `householdId`, `businessId`, or `personId`.
- `structure_associations_not_self_check`: prevents a structure from being associated with itself.

## Seed data

The seed script is `apps/api/prisma/seed.ts`.

It seeds lookup-set shells only, not authoritative questionnaire category values:

- `HOUSEHOLD_RELATIONSHIP`
- `EMPLOYMENT_STATUS`
- `CIVIL_STATUS`
- `EDUCATION`
- `STRUCTURE_TYPE`
- `LAND_USE`

It also seeds minimal reusable questionnaire-version rows:

- `HOUSEHOLD` / `INITIAL` / `Household Questionnaire`
- `BUSINESS` / `INITIAL` / `Business Questionnaire`
- `LANDOWNER` / `INITIAL` / `Landowner Questionnaire`

These are technical starter rows only. They do not encode full questionnaire definitions or source-category decisions.

## Unresolved constraints

- `InterviewModule.moduleType` is not yet constrained to require a specific context foreign key combination.
- `HouseholdMembership` does not enforce exactly one household head.
- `StructureTag.tagValue` is indexed but not unique because tag uniqueness scope is unresolved.
- Questionnaire classification values are not seeded until researcher/domain-expert review resolves category conflicts.

## Deferred areas

- CRUD endpoints.
- Authentication and authorization.
- Full questionnaire response engine.
- Mobile persistence and synchronization.
- Reporting/dashboard queries.
- Land occupancy.
- Structure ownership.
- Tenancy.
- Income, expense, rent, and savings records.
- Project awareness and feedback.
- Validation workflow.

## Verification commands

Use these commands from the repository root for local development verification:

```bash
docker compose up -d
pnpm install
pnpm --filter @ses-dms/api exec prisma format --schema prisma/schema.prisma
pnpm --filter @ses-dms/api exec prisma validate --schema prisma/schema.prisma
pnpm --filter @ses-dms/api exec prisma generate --schema prisma/schema.prisma
pnpm --filter @ses-dms/api exec prisma migrate status --schema prisma/schema.prisma
pnpm --filter @ses-dms/api exec prisma migrate dev --schema prisma/schema.prisma
pnpm --filter @ses-dms/api exec prisma db seed --schema prisma/schema.prisma
pnpm typecheck
pnpm lint
pnpm build
```

If no `.env` file exists locally, provide `DATABASE_URL` in the shell using the value shown in `.env.example`.

## Development reset notes

For local development only, the database can be reset with Prisma or Docker volume reset commands. Do not use these against production or shared data.

```bash
pnpm --filter @ses-dms/api exec prisma migrate reset --schema prisma/schema.prisma
```

or, if the local container data can be discarded:

```bash
docker compose down -v
docker compose up -d
```

After reset, rerun migrations and seed.
