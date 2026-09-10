# Initial Architecture

## System boundaries

The mobile application is an offline-first data-capture client. It persists drafts and queued operations locally, then synchronizes with the API when connectivity is available.

The web application is an online management portal for authorized users. It will manage assignments, review records, validation, finalization, reporting, and exports.

The API is the authoritative synchronized source. PostgreSQL will be introduced in Phase 3 after the domain model is reviewed. Local mobile SQLite data is a working copy, not the reporting source of truth.

## Survey lifecycle concept

The expected statuses are Draft, Ready to Sync, Synced, For Validation, Returned for Correction, Validated, and Finalized. The exact distinction between device-local synchronization status and server review status requires review before implementation.

Synchronization will use client-generated identifiers, immutable questionnaire-version references, idempotent operations, retries, and explicit acknowledgements. Initial scope avoids concurrent-edit merging; workflow and assignment controls will reduce conflicting edits.

## Domain direction

The system will model shared people and role relationships across interview, household, business, land, and structure modules. It will not begin as three disconnected questionnaire systems. Repeatable records such as household members, employees, tenants, and associated structures will be represented as repeatable records rather than fixed fields.

Blank values will not be treated as a single state. The domain-model phase will define explicit response states including answered, not applicable, no response, missing, and requires validation.
