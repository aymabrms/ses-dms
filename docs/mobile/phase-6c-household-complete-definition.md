# Phase 6C Household Complete Definition

## Scope

Phase 6C expands the bundled mobile Household questionnaire definition for field testing while preserving the Phase 6B renderer and SQLite response persistence model.

Implemented in `apps/mobile/src/questionnaires/definitions/household-20220525-v1.ts`:

- Interview, respondent, household head/spouse, and household members.
- Expenditure matrix.
- Assets and debt.
- Utilities, services, transportation, and government programs.
- Structure occupancy and associated structures.
- Land, trees, and crops.
- Livelihood, skills, financial memberships, financial brackets, and relocation preferences.
- Project awareness, feedback repeat lists, and certification metadata.

## Renderer Changes

`HouseholdQuestionnaireScreen` now renders repeat sections through `SectionDefinition.repeatGroupCode` instead of a hard-coded member section. This supports:

- `household.members`
- `household.associated_structures`
- `household.land.trees_crops`
- `household.feedback.issues`
- `household.feedback.recommendations`
- `household.feedback.benefits`
- `household.feedback.livelihood_preferences`

Repeat rows are still stored in `local_repeat_instances`; answers are still stored in `local_questionnaire_responses`.

## Recommendations

The associated-structure business-use question includes a `BUSINESS` recommendation message. This is an enumerator-facing cue only. Phase 6C does not create Business modules, APIs, sync behavior, or backend automation.

## Verification

Pure mobile checks cover:

- unique question codes
- expected Household section and repeat-group codes
- source-supported branching requiredness
- response mapping for repeat fields
- repeat delete safety
- business recommendation metadata

Commands run:

- `pnpm --filter @ses-dms/mobile test`
- `pnpm --filter @ses-dms/mobile typecheck`

## Deferred

- Android emulator/device verification.
- Signature/media capture.
- Backend-driven questionnaire definitions.
- Business and Landowner questionnaires.
- Normalized tenancy/rent, tree/crop, and final taxonomy models.
- Advanced formulas and reporting/dashboard workflows.
