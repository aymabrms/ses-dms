# Phase 5C Offline-Created Survey Sync

Phase 5C lets mobile upload locally-created survey data to `POST /sync/interviews` without server-side ID remapping.

## Local-Only Detection

Mobile treats `local_interview_modules.server_revision = 0` as never synced. For those modules, `buildModuleSyncPayload` sends a create-on-sync graph instead of the compact existing-module payload.

Existing modules with `server_revision > 0` continue to use the Phase 5B compact module sync payload.

## Graph Payload

For local-only modules, mobile includes:

- interview metadata
- referenced local persons
- local households and memberships in the same project/survey area
- local businesses and employees in the same project/survey area
- local land parcels and structures in the same project/survey area
- the local module with questionnaire version and context IDs
- repeat instances
- questionnaire responses, including client response UUIDs

Server-owned project, survey area, enumerator user, questionnaire version, and reference data IDs must already exist from server/bootstrap data.

## Reconciliation

On `ACCEPTED`, mobile:

- stores the returned server module revision in `local_interview_modules.server_revision`
- marks the module `SYNCED`
- marks module repeat instances and responses `SYNCED`
- for first sync of a create graph, marks the relevant local interview/domain graph records `SYNCED`
- completes the outbox row with `server_revision_received`

On `REJECTED`, mobile treats the result as a sync failure. Local data is preserved and can be corrected/retried with the persisted outbox `sync_request_id` behavior.

On `CONFLICT`, existing Phase 5B behavior is unchanged: the module/outbox become conflicted and local edits are preserved.

## Idempotency

Outbox rows persist `sync_request_id` before upload. Retries reuse that ID so the server can return the stored response without duplicating records or incrementing revisions again.

## Limitations

- No assignment/download workflow is implemented.
- No delete/tombstone sync is implemented.
- No field-level merge is implemented.
- No background worker or automatic retry timer is implemented.
- Node tests cover pure payload/reconciliation logic only.
- Android emulator/device verification was not run in Phase 5C because no emulator/device session was attached.
