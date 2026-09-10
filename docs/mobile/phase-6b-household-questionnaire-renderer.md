# Phase 6B Household Questionnaire Renderer

Phase 6B introduces the first mobile dynamic questionnaire renderer. It is scoped to the Household questionnaire only and does not change backend APIs, Prisma schema, sync protocol, or mobile SQLite schema.

## Architecture

The renderer uses bundled versioned definition files under `apps/mobile/src/questionnaires/definitions`. A registry resolves definitions by `moduleType` and `versionCode`; unknown versions fail with an explicit error instead of silently loading the newest definition.

The Household screen loads:

- local `InterviewModule` metadata
- the bundled Household definition
- existing local responses from `local_questionnaire_responses`
- Household member repeat instances from `local_repeat_instances`

Rendering is generic: sections and questions are rendered from definitions, not from Household-specific screen code.

## Version

- Definition ID: `household-20220525-v1`
- Module type: `HOUSEHOLD`
- Version code: `INITIAL`
- Source file: `20220525-TLR-Census-and-DMS-Survey_Households.docx`

`INITIAL` matches the currently seeded/backend bootstrap questionnaire version code while the definition metadata preserves the source date/version.

## Included Sections

- Interview Record
- Respondent Details
- Household Head / Spouse
- Household Members
- Structure / Occupancy
- Project Awareness

## Deferred Sections

- full household expenditure matrix
- assets and debt
- utilities/services
- land ownership and crops
- livelihood and living survey
- relocation
- financial brackets
- certification/signature capture

## Field Types

Implemented renderer controls:

- `TEXT`
- `TEXTAREA`
- `INTEGER`
- `DECIMAL`
- `DATE`
- `TIME`
- `BOOLEAN`
- `SINGLE_SELECT`
- `MULTI_SELECT`
- `MONEY`
- `STATIC_TEXT`

UI is intentionally basic and phone-first.

## Repeat Group

`household.members` is implemented as the first repeat group. Each member uses one `QuestionnaireRepeatInstance` and responses scoped by `repeatInstanceId`.

The paper row count is not treated as a maximum.

Deletion is intentionally limited: only `LOCAL_ONLY` repeat instances can be removed. Already-synced repeat instances are blocked because delete/tombstone sync is not implemented.

## Branching And Requiredness

Implemented simple declarative rules:

- project awareness = `YES` shows and requires source of awareness
- owns occupied structure = `NO` shows and requires occupancy arrangement
- occupancy arrangement = `TENANT_RENTER` shows and requires monthly rent

Only explicit definition rules are enforced.

## Response States

The screen supports:

- `ANSWERED`
- `NO_RESPONSE`
- `NOT_APPLICABLE`
- `UNKNOWN`
- `REQUIRES_VALIDATION`

`MISSING` is system-derived for visible required unanswered fields. Blank values are not automatically converted to `NO_RESPONSE`.

## Completion Calculation

The runtime calculates:

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETE_WITH_WARNINGS`
- `COMPLETE`
- `BLOCKED`

This is separate from local sync state and server workflow status.

## Autosave And SQLite Integration

Responses are persisted to existing `local_questionnaire_responses`. Repeat rows are stored in existing `local_repeat_instances`.

Selection/date/boolean-style edits save immediately. Text, textarea, number, and money edits are saved with a short debounce and also save on blur.

Every successful edit marks the module dirty through existing repository behavior and ensures a sync outbox item exists through `enqueueModuleForSync`.

## Option Sources

Definitions support:

- `INLINE_OPTIONS`
- `LOOKUP_SET`

Lookup-set options are loaded from local SQLite lookup tables, so rendering remains offline-capable.

## Limitations

- Household only.
- No Business or Landowner renderer.
- No backend-driven definitions yet.
- No schema, migration, API, or sync protocol changes.
- No signature/media capture.
- No reviewer UI.
- No complex formulas or nested repeat groups.
- No cross-module auto-creation.
- Native emulator/device verification is optional and depends on environment availability.
