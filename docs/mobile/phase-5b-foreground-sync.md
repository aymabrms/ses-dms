# Phase 5B Foreground Sync

Phase 5B connects the mobile SQLite outbox to the backend Phase 4E sync API with a manual foreground sync flow. It does not implement background sync, automatic retry timers, delete/tombstone sync, field-level merge, authentication, real questionnaire UI, reviewer workflow, reporting, or media/signature sync.

## Sync Flow

Manual sync processes pending or failed `SYNC_MODULE` outbox rows:

1. Read pending/retryable outbox item.
2. Load the local interview/module, repeat instances, and responses.
3. Generate and persist `sync_request_id` if the outbox row does not already have one.
4. Mark outbox and module `SYNCING`.
5. POST a module bundle to `POST /sync/interviews`.
6. Apply the server result transactionally where practical.

No background worker or automatic timer is started.

## Payload Shape

`buildModuleSyncPayload(db, moduleId, syncRequestId)` creates:

```json
{
  "syncRequestId": "...",
  "interviews": [
    {
      "interviewId": "...",
      "modules": [
        {
          "moduleId": "...",
          "expectedRevision": 1,
          "repeatInstances": [],
          "responses": []
        }
      ]
    }
  ]
}
```

Only records belonging to the selected module are included. Local-only metadata and secrets are not sent.

## Idempotency

`sync_outbox.sync_request_id` stores the UUID used for a sync attempt.

Rules:

- Generate before first send.
- Persist before the network request.
- Reuse the same `sync_request_id` for retrying the same outbox row.
- Create a new ID only when a new outbox operation is created for a later local mutation.

This aligns with the server `SyncRequest` receipt model.

## Accepted Behavior

When the server returns `ACCEPTED`:

- `local_interview_modules.server_revision` is replaced with the returned revision.
- module `local_sync_status` becomes `SYNCED`.
- local repeat instances for the module become `SYNCED`.
- local responses for the module become `SYNCED`.
- interview `last_synced_at` is updated.
- outbox row becomes `COMPLETED`.
- `completed_at` and `server_revision_received` are stored on the outbox row.

Dirty state is cleared only after server confirmation.

## Conflict Behavior

When the server returns `CONFLICT`:

- local responses are preserved.
- local repeat instances are preserved.
- module `local_sync_status` becomes `CONFLICT`.
- outbox row becomes `CONFLICT`.
- `server_revision_received` stores the returned current server revision.
- no automatic retry or merge occurs.

## Network/Server Failure Behavior

For network errors, timeout, server errors, or malformed responses:

- local changes are preserved.
- module `local_sync_status` becomes `SYNC_FAILED`.
- outbox row becomes `SYNC_FAILED`.
- `attempt_count` increments.
- `last_error` and optional `last_http_status` are stored.

Manual retry can process failed rows later and reuses the existing `sync_request_id`.

## Outbox State Transitions

- `PENDING` to `SYNCING` before request.
- `SYNCING` to `COMPLETED` on accepted result.
- `SYNCING` to `CONFLICT` on conflict result.
- `SYNCING` to `SYNC_FAILED` on network/server failure.
- `SYNC_FAILED` can be manually retried.

Duplicate enqueue for a module refreshes one pending/failed/conflict row instead of creating redundant pending work. In-flight `SYNCING` rows are not silently mutated.

## Server Revision Semantics

`server_revision` means the last revision confirmed by the server.

Local dirty edits do not increment `server_revision`.

On accepted sync, the returned server revision replaces the local value. On conflict, the local `server_revision` is not treated as accepted; the returned remote revision is stored on the outbox row.

## Status Fetch

`refreshRemoteStatus(interviewId)` calls `GET /sync/interviews/:interviewId/status`.

It updates interview workflow status and flags modules as `NEEDS_RESYNC` if remote revision differs while local data should not be overwritten. It does not merge or replace local unsynced responses.

## Debug Screen

The existing offline debug screen now includes:

- `Sync Pending`
- `Retry Failed`
- `Refresh Sync Status`
- pending outbox count
- failed outbox count
- conflict outbox count
- synced module count
- last sync message

This remains a development/debug screen.

## Local SQLite Migration

Migration 2 adds:

- `sync_request_id`
- `completed_at`
- `server_revision_received`
- `last_http_status`

The migration runner guards column additions so existing local data is preserved.

## Emulator Networking

For Android Emulator, use the host alias when the API runs on the Windows host:

```bash
EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:3001"
```

For a physical device, use the host machine LAN IP and ensure firewall/network access.

## Limitations

- Local-only interviews/modules cannot be created on the server by this phase because the Phase 4E server sync endpoint accepts existing IDs only.
- No assignment/interview download exists yet.
- No background sync.
- No automatic retry timer.
- No delete/tombstone sync.
- No conflict merge UI.
- No media/signature sync.
