# Phase 6 Questionnaire Engine

## Architecture

Phase 6 uses bundled, versioned questionnaire definitions resolved by `moduleType` and `versionCode`. Household, Business, and Landowner all use the same generic mobile renderer.

Key files:

- `apps/mobile/src/questionnaires/types.ts`
- `apps/mobile/src/questionnaires/registry.ts`
- `apps/mobile/src/questionnaires/runtime.ts`
- `apps/mobile/src/screens/QuestionnaireScreen.tsx`

## Definitions

Definitions contain:

- sections
- repeat groups
- question codes
- field types
- inline or lookup-backed options
- simple branching rules
- conditional requiredness
- source metadata
- domain/reporting metadata where safe
- declarative module triggers

Bundled definitions:

- `household-20220525-v1`
- `business-20220525-v1`
- `landowner-20220525-v1`

## Renderer

`QuestionnaireScreen` loads the local module, resolves its definition, renders sections, renders repeat groups, evaluates completion, displays triggers, and persists edits. Module-specific screens are thin wrappers only.

## Persistence

Responses persist to `local_questionnaire_responses` with typed value columns and `response_state`. Repeat rows persist to `local_repeat_instances`. Edits mark the module dirty and refresh the existing sync outbox.

## Repeat Groups

Supported Phase 6 repeat groups include:

- household members
- household associated structures
- household trees/crops
- business employees
- project feedback groups for all three modules

## Branching And Requiredness

Rules are evaluated by the generic runtime using `SHOW_IF`, `HIDE_IF`, and `REQUIRE_IF`. Hidden required fields do not count as missing.

## Triggers

Module triggers are declarative metadata. Phase 6 supports Business recommendations from source-backed Household and Landowner answers. The UI requires explicit user action to add or open a target module.

## Validation And Completion

Completion states are:

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETE_WITH_WARNINGS`
- `COMPLETE`
- `BLOCKED`

Warnings include age/birthdate mismatch and Business employee total mismatch. Warnings never overwrite source answers.

## Offline And Sync

Questionnaire editing works offline through SQLite. Existing foreground/manual sync and outbox behavior are preserved. Phase 6 does not add background sync, tombstones, or conflict merging.

## Multi-Role Interviews

One interview can contain Household, Business, and Landowner modules. Module completion, local sync status, and server workflow status remain separate concepts.

## Limitations

- no signature/media capture
- no server-driven questionnaire admin UI
- no final taxonomy normalization
- no respondent prefill confirmation flow
- no automatic module creation
- no delete/tombstone sync
- native device verification unavailable in the current environment
