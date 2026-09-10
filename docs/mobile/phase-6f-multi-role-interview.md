# Phase 6F Multi-Role Interview

## Summary

Phase 6F connects Household, Business, and Landowner questionnaires at the interview level without creating a new form engine or copying responses between modules.

One local interview can contain multiple `local_interview_modules`:

- Household
- Business
- Landowner

The debug/development screen can create a module for each type on the latest interview and shows modules grouped under their interview.

## Shared Concepts

Definition-level concepts shared across modules include:

- Interview Record
- Respondent Identity
- Person Identity
- Land
- Structure
- Ownership
- Occupancy
- Project Awareness
- Project Feedback
- Certification

These are shared conceptually, not forcibly normalized in questionnaire responses. The same concept can have different role meaning by module, such as respondent relationship target, rent context, ownership type, or livelihood preference subject.

## Respondent Handling

The existing schema allows an interview to reference one respondent person, and multiple modules can belong to that interview. Phase 6F does not prefill questionnaire responses from normalized person fields because that needs an explicit `PRE-FILLED` vs `CONFIRMED RESPONSE` UX.

## Status Separation

The launcher and questionnaire screen keep status concepts separate:

- Questionnaire completion: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETE_WITH_WARNINGS`, `COMPLETE`, `BLOCKED`
- Local sync: `LOCAL_ONLY`, `DIRTY`, `READY_TO_SYNC`, `SYNCED`, `SYNC_FAILED`, `CONFLICT`, `NEEDS_RESYNC`
- Server workflow: stored separately when available and not merged into local sync or completion status

## Verification

Pure tests verify:

- Household, Business, and Landowner definitions remain independent.
- One interview can conceptually contain all three modules.
- One respondent person ID can be shared.
- responses remain scoped to module-specific question codes.
- repeat instances remain scoped by repeat instance and question code.
- completion and local sync states remain independent.

## Deferred

- respondent prefill/confirmation workflow
- duplicate person matching or merge
- production navigation
- automatic module creation from triggers
