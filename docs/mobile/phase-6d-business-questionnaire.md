# Phase 6D Business Questionnaire

## Scope

Phase 6D proves the mobile renderer is module-generic by adding the Business questionnaire through the same bundled definition, runtime, repeat-group, response-state, autosave, and outbox mechanisms used by Household.

Implemented definition:

- `apps/mobile/src/questionnaires/definitions/business-20220525-v1.ts`
- `moduleType: BUSINESS`
- `versionCode: INITIAL`
- Source: `20220525-TLR-Census-and-DMS-Survey_Business.pdf`

## Generic Renderer Changes

`HouseholdQuestionnaireScreen` was refactored into `QuestionnaireScreen`.

Thin wrappers remain for module naming convenience:

- `HouseholdQuestionnaireScreen`
- `BusinessQuestionnaireScreen`

The active app/debug path opens `QuestionnaireScreen` directly by module ID. The screen resolves the local module's `module_type` and `version_code`, then loads the matching bundled definition from the registry.

## Repeat Groups

Generic repeat rendering now supports Household and Business groups without hard-coded household member behavior:

- `household.members`
- `household.associated_structures`
- `household.land.trees_crops`
- `business.employees`
- `business.feedback.issues`
- `business.feedback.recommendations`
- `business.feedback.benefits`
- `business.feedback.livelihood_preferences`

Repeat rows still use `local_repeat_instances`; answers still use `local_questionnaire_responses`.

## Business Debug Flow

The debug screen can now:

- create a local Household interview/module
- create a local Business interview/module
- open latest Household questionnaire
- open latest Business questionnaire

Business edits use the same save path:

`question edit -> local QuestionnaireResponse upsert -> module DIRTY -> outbox refreshed`

Repeat additions follow the same local repeat path and enqueue sync work.

## Business Coverage

Implemented Business sections:

- Interview Record
- Respondent Details
- Business Owner Details
- Business Profile
- Employee Profile
- Employee Totals and Quarters
- Employee Skills
- Structure / Occupancy
- Land / Ownership
- Livelihood Rehabilitation for Business Owner
- Livelihood Rehabilitation for Employees
- Project Awareness
- Project Feedback
- Certification metadata excluding signature capture

## Response States And Completion

Business uses the existing response states:

- `ANSWERED`
- `NO_RESPONSE`
- `NOT_APPLICABLE`
- `UNKNOWN`
- `REQUIRES_VALIDATION`

`MISSING` remains system-derived.

Business completion uses the existing model:

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETE_WITH_WARNINGS`
- `COMPLETE`
- `BLOCKED`

No Business-specific completion logic was added.

## Verification

Pure tests cover:

- Business registry resolution and unknown-version failure.
- section and repeat-group presence.
- definition integrity across Household and Business.
- unique question codes.
- employee repeat scoping.
- salary amount/frequency separation.
- structure, land, and project-awareness branching.
- feedback repeat-item scoping.
- hidden required fields not counted as missing.
- Business completion states.
- generic response mapping and outbox payload shape.
- Household definition integrity after generic screen changes.

## Deferred

- Android emulator/device verification if no emulator is available.
- Landowner questionnaire.
- backend APIs, Prisma models, sync protocol changes, background sync.
- reviewer workflow and dashboard/reporting.
- signature/media capture.
- final taxonomy normalization.
- complex formulas and salary conversions.
- cross-module auto-creation.
