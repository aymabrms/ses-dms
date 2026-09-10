# Phase 5A Offline Mobile Foundation

Phase 5A establishes the first offline-capable data foundation in the Expo mobile app. It does not implement the real questionnaire UI, background sync worker, automatic retries, delete/tombstone sync, authentication, reviewer workflow, reporting, media uploads, assignments, or conflict-resolution UI.

## Local SQLite Architecture

The mobile app uses `expo-sqlite` directly. No mobile ORM is introduced.

Key files:

- `apps/mobile/src/db/database.ts`
- `apps/mobile/src/db/migrations/`
- `apps/mobile/src/db/repositories/`
- `apps/mobile/src/api/client.ts`
- `apps/mobile/src/sync/bootstrap.ts`
- `apps/mobile/src/screens/OfflineDebugScreen.tsx`

## Schema Versioning

The database keeps applied migrations in `schema_migrations`.

Startup calls `initializeDatabase()`, which:

- opens `ses_dms_mobile.db`
- enables foreign keys
- creates `schema_migrations` if needed
- applies migrations sequentially
- inserts the migration version after successful application

Migrations are guarded with `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` so startup does not depend on deleting/recreating SQLite.

## Local Tables

Reference/bootstrap tables:

- `local_projects`
- `local_survey_areas`
- `local_questionnaire_versions`
- `local_lookup_sets`
- `local_lookup_values`

Survey working tables:

- `local_interviews`
- `local_interview_modules`
- `local_persons`
- `local_households`
- `local_household_memberships`
- `local_businesses`
- `local_business_employees`
- `local_land_parcels`
- `local_structures`

Questionnaire tables:

- `local_repeat_instances`
- `local_questionnaire_responses`
- `local_validation_issues`

Sync tables:

- `sync_outbox`
- `sync_metadata`

## UUID Strategy

Local records use UUID strings generated with `expo-crypto`. The local UUID is intended to be the same ID later sent to the server where the API supports client-generated IDs.

No temporary integer IDs or remapping scheme is introduced.

## Module Revision Convention

`local_interview_modules.server_revision` mirrors the latest accepted server revision.

For never-synced local modules, `server_revision` starts at `0`. Server-backed modules currently start at revision `1`, so `0` is an explicit local-only convention.

## Local Sync States

Mobile network/sync state is separate from server workflow state.

Supported local states:

- `LOCAL_ONLY`
- `DIRTY`
- `READY_TO_SYNC`
- `SYNCING`
- `SYNCED`
- `SYNC_FAILED`
- `CONFLICT`
- `NEEDS_RESYNC`

Server workflow state, when known, is stored separately as `server_workflow_status` on local interviews.

## Response Storage

Local responses preserve Phase 4D response states:

- `ANSWERED`
- `NO_RESPONSE`
- `NOT_APPLICABLE`
- `UNKNOWN`
- `MISSING`
- `REQUIRES_VALIDATION`

Responses preserve typed values and raw values. Null values are not used to replace response-state semantics.

Root and repeated responses use partial unique indexes matching the backend approach:

- module/question uniqueness when `repeat_instance_id IS NULL`
- module/question/repeat uniqueness when `repeat_instance_id IS NOT NULL`

## Bootstrap Behavior

`downloadAndImportBootstrap()` calls `GET /sync/bootstrap` and imports:

- projects
- survey areas
- active questionnaire versions
- lookup sets
- lookup values

The import runs in a transaction and uses `INSERT OR REPLACE`, so it is safe to repeat. It updates `sync_metadata.last_bootstrap_at`.

Bootstrap does not delete local survey work.

## API Base URL

The mobile API client reads:

- `EXPO_PUBLIC_API_BASE_URL`

Example:

```bash
EXPO_PUBLIC_API_BASE_URL="http://localhost:3001"
```

For Android Emulator, `localhost` points to the emulator itself. Use the host alias when the API runs on the Windows host:

```bash
EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:3001"
```

Authentication headers are intentionally not implemented yet.

## Outbox Structure

`sync_outbox` stores future sync work.

Fields include:

- `id`
- `entity_type`
- `entity_id`
- `operation`
- `interview_id`
- `module_id`
- `payload_json`
- `status`
- `attempt_count`
- `last_error`
- timestamps

Phase 5A supports preparing `SYNC_MODULE` work. It does not process the outbox or send `POST /sync/interviews`.

## Repository Methods

Implemented repository/service methods include:

- `listLocalProjects()`
- `listLocalSurveyAreas(projectId)`
- `listActiveQuestionnaireVersions()`
- `createLocalInterview()`
- `getLocalInterview()`
- `listLocalInterviews()`
- `updateLocalInterview()`
- `createLocalInterviewModule()`
- `getLocalInterviewModule()`
- `updateLocalInterviewModuleRevision()`
- `createLocalRepeatInstance()`
- `listLocalRepeatInstances()`
- `updateLocalRepeatInstance()`
- `upsertLocalResponse()`
- `listLocalResponsesForModule()`
- `enqueueModuleForSync()`
- `listPendingOutboxItems()`

Response and repeat mutations mark the module `DIRTY` in the same SQLite transaction.

## Debug Screen

The temporary debug screen shows:

- database initialized state
- schema version
- local project count
- survey area count
- questionnaire version count
- local interview count
- pending outbox count
- bootstrap button
- create local test interview button
- add repeat/response button
- queue latest module button
- local interview list

This is only a development/debug screen, not the final questionnaire UI.

## Testing Notes

The Expo SQLite native module is not exercised in Node tests. Phase 5A includes lightweight Node-runnable checks for shared constants and outbox payload shape. Full SQLite behavior must be verified in Expo/Android/iOS runtime.

## Deferred

- Real questionnaire UI.
- Dynamic branching UI.
- Background sync worker.
- Upload to `POST /sync/interviews`.
- Automatic retries.
- Delete/tombstone sync.
- Auth/login.
- Conflict-resolution UI.
- Assignments.
- Media/signature uploads.
