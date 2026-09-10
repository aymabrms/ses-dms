# Phase 6E Landowner Questionnaire

## Summary

Phase 6E adds the Landowner questionnaire to the same bundled definition registry and generic `QuestionnaireScreen` used by Household and Business.

Definition:

- `apps/mobile/src/questionnaires/definitions/landowner-20220525-v1.ts`
- `moduleType: LANDOWNER`
- `versionCode: INITIAL`

## Renderer And Persistence

No Landowner-specific renderer was created. Landowner uses:

- `QuestionnaireScreen`
- generic section rendering
- generic repeat-group rendering
- `local_questionnaire_responses`
- `local_repeat_instances`
- existing response states
- existing completion calculation
- existing module dirty/outbox path

## Coverage

Implemented major source areas:

- interview record
- respondent details
- landowner details
- spouse details
- affected land
- structures on land
- business presence
- rental/tenancy
- trees/crops
- project awareness
- project feedback
- certification metadata

## Verification

Pure tests cover:

- registry resolution and unknown-version failure
- unique question codes and generic definition integrity
- repeat-group code integrity
- branching behavior
- hidden source fields not counted as missing
- completion state behavior
- response mapping through the same path used by other modules

## Deferred

- signature/media capture
- tenant person records
- structured crop inventory
- automatic Business module creation
- taxonomy normalization
