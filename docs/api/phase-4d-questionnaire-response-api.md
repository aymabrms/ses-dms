# Phase 4D Questionnaire Response API

Phase 4D adds the first server-side questionnaire response persistence layer under interview modules. It does not implement mobile SQLite, full offline sync, dynamic questionnaire rendering, authentication, reporting, field-level merge conflict resolution, full review workflow, tenancy/rent/financial domain models, or final taxonomy mappings.

## Endpoints

- `GET /interviews/:interviewId/modules/:moduleId/responses`
- `PUT /interviews/:interviewId/modules/:moduleId/responses`
- `GET /interviews/:interviewId/modules/:moduleId/repeat-instances`
- `POST /interviews/:interviewId/modules/:moduleId/repeat-instances`
- `PATCH /interviews/:interviewId/modules/:moduleId/repeat-instances/:repeatInstanceId`
- `GET /interviews/:interviewId/modules/:moduleId/validation-issues`

All endpoints verify that the selected module belongs to the selected interview.

## Bulk Response Write

`PUT /interviews/:interviewId/modules/:moduleId/responses` accepts one batch rather than one HTTP call per field.

Request fields:

- `expectedRevision`: required integer.
- `responses`: required array.

Response item fields:

- `questionCode`: required stable human-readable field code.
- `repeatInstanceId`: optional UUID for repeated rows/groups.
- `responseState`: required `ANSWERED`, `NO_RESPONSE`, `NOT_APPLICABLE`, `UNKNOWN`, `MISSING`, or `REQUIRES_VALIDATION`.
- `valueText`: optional string.
- `valueNumber`: optional number.
- `valueBoolean`: optional boolean.
- `valueDate`: optional ISO date-time.
- `valueJson`: optional JSON object.
- `rawValue`: optional string.
- `capturedAt`: optional ISO date-time.

Successful response shape:

```json
{
  "moduleId": "...",
  "revision": 4,
  "responses": []
}
```

## Response-State Rules

- `ANSWERED` means a response was captured.
- `NO_RESPONSE` means the respondent declined or did not provide an answer.
- `NOT_APPLICABLE` means a field does not apply because of branch/domain context.
- `UNKNOWN` means the answer is unknown at collection time.
- `MISSING` means the field should have been answered but no usable response state/value was captured.
- `REQUIRES_VALIDATION` means a captured value may be inconsistent or incomplete.

The API does not require every response to have a value. It rejects conflicting typed values, such as sending both `valueText` and `valueNumber` for the same response item.

## Repeat Instances

Repeat instances represent one occurrence of a repeatable group, such as a household member row, business employee row, associated structure row, tenant/renter row, or feedback item group.

Create/update fields:

- `groupCode`: required on create, optional on update, non-empty when supplied.
- `parentRepeatInstanceId`: optional UUID.
- `sequenceNumber`: optional positive integer.
- `linkedPersonId`: optional UUID.
- `linkedHouseholdMembershipId`: optional UUID.
- `linkedBusinessEmployeeId`: optional UUID.
- `linkedStructureId`: optional UUID.

Rules:

- Repeat instances must belong to the selected module.
- Parent repeat instances must belong to the same module.
- A repeat instance cannot be its own parent.
- Linked domain records are optional.
- Linked household memberships, business employees, and structures must belong to the interview project where this can be checked.

## Revision And Conflict Behavior

`InterviewModule.revision` is the Phase 4D optimistic concurrency token.

Write flow:

1. Client reads the module and current `revision`.
2. Client sends `expectedRevision` with the response batch.
3. Server writes the batch in a transaction only if the revision still matches.
4. Server increments `revision` after a successful batch.
5. Server returns the new revision.

If `expectedRevision` is stale, the API returns HTTP `409 Conflict` and includes `currentRevision`. It does not silently overwrite or merge changes.

## Validation Issues

`GET /validation-issues` lists issues attached to the selected module. Phase 4D creates the data foundation and list endpoint only. Reviewer resolution, return-for-correction, approval, finalization, and validation workflow transitions remain deferred.

## Technical Validation

- Unknown DTO fields are rejected by the global validation pipe.
- `questionCode` and `groupCode` must be non-empty where required.
- Only one typed response value field may be supplied per response item.
- Referenced repeat instances must exist and belong to the selected module.
- The route module must belong to the route interview.
- Repeat parent references must stay within the same module.
- Self-parent repeat instances are rejected.

## Known Limitations

- No questionnaire-specific requiredness rules.
- No dynamic form-definition engine.
- No mobile/local sync implementation.
- No field-level merge conflict resolution.
- No review workflow beyond validation issue storage/listing.
- No final taxonomy/category mappings.
- No DELETE endpoints.
