# Phase 3B Schema Foundation

Phase 3B introduces the first Prisma/PostgreSQL schema foundation for SES/DMS. This is the stable domain backbone only. It does not implement questionnaire screens, API CRUD endpoints, authentication, synchronization, reporting, review workflow, financial records, or migrations beyond schema validation/generation.

## Implemented models

- `Project`: infrastructure/resettlement project.
- `SurveyArea`: barangay or survey geography within a project.
- `User`: initial system account record without authentication implementation.
- `QuestionnaireVersion`: version metadata for Household, Business, and Landowner modules.
- `Interview`: survey encounter with respondent and enumerator references.
- `InterviewModule`: activated/completed questionnaire module within an interview.
- `Person`: shared human identity anchor.
- `PersonIdentityObservation`: captured identity details from questionnaire occurrences.
- `Household`: household domain anchor.
- `HouseholdMembership`: relationship between a person and household.
- `Business`: business domain anchor.
- `Organization`: non-person legal/community/institutional owner.
- `BusinessOwnership`: relationship between business and person/organization owner.
- `BusinessEmployee`: relationship between business and person employee.
- `LandParcel`: affected land or claim anchor.
- `LandOwnership`: relationship between land parcel and person/organization owner.
- `Structure`: internal structure identity anchor.
- `StructureTag`: captured external structure tag values.
- `StructureAssociation`: main/associated structure relationship.
- `StructureOccupancy`: household/business/person occupancy of a structure.
- `LookupSet`: configurable classification family.
- `LookupValue`: configurable classification value.

## Relationships

- `Project` has many `SurveyArea`, `Interview`, `Household`, `Business`, `LandParcel`, `Structure`, and `QuestionnaireVersion` records.
- `Interview` belongs to one project, one survey area, one enumerator user, and optionally one respondent person.
- `Interview` has many `InterviewModule` records.
- `InterviewModule` belongs to one questionnaire version and may explicitly reference a household, business, land parcel, or structure context.
- `Person` can participate in many roles through memberships, ownerships, employment, occupancy, interview respondent references, and identity observations.
- `HouseholdMembership` is the authoritative household-person relationship. Household head and spouse are represented by relationship classification rather than hard-coded booleans.
- `BusinessOwnership` and `LandOwnership` allow person owners or organization owners and do not assume a single owner.
- `Structure` uses an internal UUID. Captured structure tags are stored separately in `StructureTag`; tag values are indexed but not globally unique.
- `StructureOccupancy` separates occupancy from ownership and tenancy.

## Intentionally deferred entities

- Land occupancy.
- Structure ownership.
- Tenancy.
- Income, expense, rent, and savings records.
- Skills and skill selections.
- Household assets.
- Utilities and services.
- Tree/crop records.
- Project awareness, feedback, issues, recommendations, and benefits.
- Survey submission/revision records.
- Survey review records.
- Validation issues.
- Response metadata and full response-state handling.
- Full questionnaire response engine.
- Synchronization implementation.
- Reporting SQL and dashboards.

## Unresolved constraints

Some constraints are documented but not yet enforced in Prisma because they require SQL `CHECK` constraints, application validation, or confirmed business rules:

- `BusinessOwnership`: exactly one of `personId` or `organizationId` should be populated.
- `LandOwnership`: exactly one of `personId` or `organizationId` should be populated.
- `StructureOccupancy`: exactly one of `householdId`, `businessId`, or `personId` should identify the occupant.
- `StructureAssociation`: `parentStructureId` and `childStructureId` should not be the same structure.
- `InterviewModule`: module type should determine which optional context foreign keys are appropriate.
- `HouseholdMembership`: exactly one household head is not enforced until the household counting/reporting rule is confirmed.
- `StructureTag`: no global uniqueness is enforced on `tagValue` until the authoritative scope is confirmed.

## Design decisions

- UUID primary keys are used to remain compatible with future offline/client-generated IDs.
- Raw questionnaire classification values are preserved in `*Raw` fields instead of being prematurely converted into Prisma enums.
- Prisma enums are limited to stable technical concepts: questionnaire module type and basic record/module/interview statuses.
- No cascade deletes are used for survey-domain history. Relations use `Restrict` or `SetNull` where appropriate.
- Lookup sets and values provide configurable classifications without forcing unresolved questionnaire categories into code.

## Phase 3C candidates

Phase 3C should review and implement only the next small vertical slice, likely one of:

- Prisma migration creation and local database application.
- NestJS Prisma service/module integration without domain CRUD endpoints.
- Minimal seed data for questionnaire versions and lookup sets.
- Response-state metadata and validation issue foundation.

Financial records, tenancy, reporting, and full questionnaire response storage should remain deferred until the schema foundation is reviewed.
