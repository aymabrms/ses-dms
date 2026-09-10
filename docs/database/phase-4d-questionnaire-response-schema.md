# Phase 4D Questionnaire Response Schema

Phase 4D adds the minimum database foundation for questionnaire response persistence, repeatable response groups, response-state handling, validation issues, and module-level optimistic concurrency.

## Migrations

- `20260910163210_add_questionnaire_response_foundation`
- `20260910163320_add_questionnaire_response_partial_unique_indexes`

The second migration is PostgreSQL-specific because Prisma schema syntax does not express partial unique indexes.

## Enums Added

### ResponseState

- `ANSWERED`
- `NO_RESPONSE`
- `NOT_APPLICABLE`
- `UNKNOWN`
- `MISSING`
- `REQUIRES_VALIDATION`

### ValidationSeverity

- `INFORMATION`
- `WARNING`
- `ERROR`
- `BLOCKING_ERROR`

### ValidationIssueStatus

- `OPEN`
- `RESOLVED`
- `DISMISSED`

These are technical enums only. Unresolved questionnaire taxonomies remain outside Prisma enums.

## Tables Added

### questionnaire_repeat_instances

Represents one occurrence of a repeatable questionnaire group.

Important fields:

- `interviewModuleId`
- `groupCode`
- `parentRepeatInstanceId`
- `sequenceNumber`
- `linkedPersonId`
- `linkedHouseholdMembershipId`
- `linkedBusinessEmployeeId`
- `linkedStructureId`
- timestamps

Repeat instances can exist before normalization/linking to domain records.

### questionnaire_responses

Stores one response to one questionnaire field/question within an interview module.

Important fields:

- `interviewModuleId`
- `questionCode`
- `repeatInstanceId`
- `responseState`
- `valueText`
- `valueNumber`
- `valueBoolean`
- `valueDate`
- `valueJson`
- `rawValue`
- `capturedAt`
- timestamps

Responses do not require a value because response state can carry meaningful absence semantics such as `NO_RESPONSE`, `NOT_APPLICABLE`, `UNKNOWN`, or `MISSING`.

### validation_issues

Stores server-detected or reviewer-created data-quality issues.

Important fields:

- `interviewId`
- `interviewModuleId`
- `questionnaireResponseId`
- `severity`
- `code`
- `message`
- `status`
- `resolvedAt`
- `resolvedByUserId`
- timestamps

Phase 4D does not implement reviewer resolution endpoints or workflow transitions.

## Tables Changed

### interview_modules

Added:

- `revision Int @default(1)`

`revision` is incremented after each successful response batch write and is used for optimistic concurrency.

## Response Uniqueness

The safe logical response key is:

- `interviewModuleId`
- `questionCode`
- `repeatInstanceId`

Because PostgreSQL allows multiple `NULL` values in a normal unique constraint, root-level responses need a partial unique index. Phase 4D uses two indexes:

- `questionnaire_responses_module_question_root_key` on `(interviewModuleId, questionCode)` where `repeatInstanceId IS NULL`.
- `questionnaire_responses_module_question_repeat_key` on `(interviewModuleId, questionCode, repeatInstanceId)` where `repeatInstanceId IS NOT NULL`.

The API also performs application-level update-or-create behavior so duplicate writes replace the existing logical response rather than creating accidental duplicates.

## Revision Strategy

Phase 4D uses module-level optimistic concurrency only.

Flow:

1. Client reads `InterviewModule.revision`.
2. Client writes a response batch with `expectedRevision`.
3. Server updates only if the stored revision matches.
4. Server increments revision in the same transaction as response writes.
5. Stale writes return HTTP `409 Conflict`.

No interview-level revision and no revision-history table are introduced yet.

## Technical Validation Rules

- A response item may include at most one typed value field.
- Repeat-instance response references must belong to the same module.
- Repeat parent references must belong to the same module.
- Repeat instances cannot parent themselves.
- Linked household memberships, business employees, and structures are checked against the interview project where possible.
- DTO unknown fields are rejected at the API layer.

## Known Limitations

- No questionnaire-specific requiredness.
- No server-driven questionnaire definition tables.
- No mobile SQLite or full offline sync.
- No field-level merge conflict resolution.
- No validation workflow or reviewer resolution API.
- No tenancy/rent/financial domain models.
- No final taxonomy mappings.
