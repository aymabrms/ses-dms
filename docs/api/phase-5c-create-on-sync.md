# Phase 5C Create-On-Sync API

Phase 5C extends `POST /sync/interviews` so a mobile client can upload an offline-created interview graph using client-generated UUIDs. Existing Phase 4E/5B module sync remains supported.

## Ownership

Client-owned records may be created on sync with preserved UUIDs:

- `Person`
- `Interview`
- `InterviewModule`
- `Household`
- `HouseholdMembership`
- `Business`
- `BusinessEmployee`
- `LandParcel`
- `Structure`
- `QuestionnaireRepeatInstance`
- `QuestionnaireResponse`

Server-owned records must already exist and cannot be created by mobile sync:

- `Project`
- `SurveyArea`
- `User` / enumerator
- `QuestionnaireVersion`
- lookup/reference data

## Payload Shape

Existing modules continue to use the compact shape:

```json
{
  "syncRequestId": "...",
  "interviews": [
    {
      "interviewId": "existing-interview-id",
      "modules": [
        { "moduleId": "existing-module-id", "expectedRevision": 3, "repeatInstances": [], "responses": [] }
      ]
    }
  ]
}
```

Offline-created graphs use an `interview` object plus dependency arrays:

```json
{
  "syncRequestId": "...",
  "interviews": [
    {
      "interview": {
        "id": "client-interview-id",
        "projectId": "existing-project-id",
        "surveyAreaId": "existing-area-id",
        "enumeratorUserId": "existing-user-id",
        "surveyDate": "2026-01-01T00:00:00.000Z",
        "startedAt": "2026-01-01T00:00:00.000Z"
      },
      "persons": [],
      "households": [],
      "householdMemberships": [],
      "businesses": [],
      "businessEmployees": [],
      "landParcels": [],
      "structures": [],
      "modules": []
    }
  ]
}
```

## Dependency Order

The server validates server-owned references first, then persists the graph in dependency order:

1. persons
2. interview
3. households, businesses, land parcels, structures
4. household memberships and business employees
5. interview modules
6. repeat instances
7. questionnaire responses and technical validation issues

## Transactions And Rollback

Each new interview graph is handled in its own database transaction. If a graph has an invalid project/survey-area relationship, missing questionnaire version, invalid module type/version pairing, or broken dependency, that graph rolls back and returns a `REJECTED` result.

Other interview bundles in the same `syncRequestId` are not intentionally rolled back by that rejected graph.

## UUID Preservation

The API preserves supplied client UUIDs for created records. No ID remapping is performed in Phase 5C.

## Idempotency

`syncRequestId` still uses `SyncRequest` receipts. A completed duplicate request returns the stored response without applying mutations again. This applies to both existing-module sync and create-on-sync graphs.

## Module Revisions

New modules are created at `revision = 1` and return `ACCEPTED` with that revision. Existing-module sync still uses `expectedRevision`; accepted updates increment once and stale revisions return `CONFLICT`.

## REJECTED Results

Create-on-sync validation failures return a result like:

```json
{ "interviewId": "client-interview-id", "status": "REJECTED", "message": "..." }
```

The HTTP request still succeeds so other bundles and the sync receipt can be completed.

## Limitations

- Assignment/download workflow is not implemented.
- Delete/tombstone sync is not implemented.
- Field-level merge is not implemented.
- Media/signature sync is not implemented.
- Background sync and automatic retry timers are not implemented.
