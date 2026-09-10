# Phase 4E Sync Schema

Phase 4E adds only the database support required for minimal sync idempotency tracking.

## Migration

- `20260910164540_add_sync_request_receipts`

## Enum Added

### SyncRequestStatus

- `PENDING`
- `COMPLETED`
- `FAILED`

## Table Added

### sync_requests

Purpose: store minimal server receipts for client-generated sync requests so mobile retries do not apply the same accepted bundle twice.

Fields:

- `id`: UUID primary key.
- `clientRequestId`: unique client-generated UUID.
- `status`: `PENDING`, `COMPLETED`, or `FAILED`.
- `requestJson`: stored request payload.
- `responseJson`: stored completed response.
- `receivedAt`: first receipt timestamp.
- `completedAt`: completed timestamp.
- `createdAt`, `updatedAt`: technical timestamps.

## Revision Metadata

No new revision columns were added in Phase 4E. Phase 4D `InterviewModule.revision` remains the module-level optimistic concurrency token.

## Deferred Schema Areas

- No sync event history table.
- No assignment table.
- No tombstone/delete table.
- No device registration table.
- No full offline change cursor table.
