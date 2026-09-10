# Phase 4E Sync API

Phase 4E adds a minimal sync-oriented backend contract for a future offline mobile client. It does not implement mobile SQLite, mobile UI, background sync workers, authentication, full reviewer workflow, reporting, field-level conflict merge, tenancy/rent/financial domain models, questionnaire definitions, or automatic branching.

## Endpoints

- `GET /sync/bootstrap`
- `GET /sync/bootstrap?projectId=<uuid>`
- `POST /sync/interviews`
- `GET /sync/interviews/:interviewId/status`
- `GET /interviews/:interviewId/modules/:moduleId/validation-issues`
- `POST /interviews/:interviewId/modules/:moduleId/validation-issues`

## Bootstrap

`GET /sync/bootstrap` returns stable reference data needed by a future mobile client:

- `projects`
- `surveyAreas`
- active `questionnaireVersions`
- `lookupSets`
- `lookupValues`

It does not return PII, assigned interviews, people, household records, or mobile assignments.

## Sync Bundle

`POST /sync/interviews` accepts existing interview/module IDs only.

Request shape:

```json
{
  "syncRequestId": "...",
  "interviews": [
    {
      "interviewId": "...",
      "modules": [
        {
          "moduleId": "...",
          "expectedRevision": 4,
          "repeatInstances": [],
          "responses": []
        }
      ]
    }
  ]
}
```

Response shape:

```json
{
  "results": [
    {
      "interviewId": "...",
      "moduleId": "...",
      "status": "ACCEPTED",
      "revision": 5
    },
    {
      "interviewId": "...",
      "moduleId": "...",
      "status": "CONFLICT",
      "currentRevision": 8
    }
  ]
}
```

## Revision Behavior

`InterviewModule.revision` is the sync concurrency token.

These mutations increment module revision:

- `PUT /interviews/:interviewId/modules/:moduleId/responses`
- `POST /interviews/:interviewId/modules/:moduleId/repeat-instances`
- `PATCH /interviews/:interviewId/modules/:moduleId/repeat-instances/:repeatInstanceId`
- accepted module bundles in `POST /sync/interviews`

A sync module bundle increments revision exactly once, even if it contains multiple repeat instances and responses.

Stale sync module revisions return a per-module `CONFLICT` result with `currentRevision`. Stale direct response writes return HTTP `409 Conflict`.

## Idempotency

The sync endpoint requires client-generated `syncRequestId` UUIDs.

The server stores a `SyncRequest` receipt. If the same completed `syncRequestId` is submitted again, the stored response is returned and the module is not mutated again.

This is a minimal retry-safety mechanism, not a distributed idempotency framework.

## Validation Issues

The API can create and list validation issues for a module.

Manual/server-created issue request:

```json
{
  "questionnaireResponseId": "...",
  "severity": "WARNING",
  "code": "ANSWERED_WITHOUT_VALUE",
  "message": "Response is marked ANSWERED but no value was supplied."
}
```

`questionnaireResponseId` is optional. If supplied, the response must belong to the selected module.

Automatic technical issue generation currently covers only retainable suspicious response states:

- `ANSWERED_WITHOUT_VALUE`: `ANSWERED` with no typed value or raw value.
- `NO_RESPONSE_WITH_VALUE`: `NO_RESPONSE` with a typed value or raw value.

Structurally invalid payloads are still rejected instead of converted into validation issues.

## Status Endpoint

`GET /sync/interviews/:interviewId/status` returns:

- `interviewId`
- interview `status`
- module IDs
- module type
- module status
- module revision
- open validation issue count per module

This is not a full incremental change cursor.

## Unsupported Operations

- Creating a full interview graph through sync.
- Creating projects, users, persons, households, businesses, land, or structures through sync.
- Field-level conflict merging.
- Full reviewer resolution workflow.
- Assignment download.
- Incremental change cursor.
- Delete/tombstone sync.

## Delete/Tombstone Limitation

Phase 4E intentionally does not implement hard deletes or tombstones for repeat instances or responses. Phase 5 mobile should not support deleting already-synced repeat instances or responses until a tombstone strategy is designed.
