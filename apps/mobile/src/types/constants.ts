import { LocalSyncStatus, OutboxStatus, ResponseState } from "./offline";

export const LOCAL_SYNC_STATUSES: LocalSyncStatus[] = ["LOCAL_ONLY", "DIRTY", "READY_TO_SYNC", "SYNCING", "SYNCED", "SYNC_FAILED", "CONFLICT", "NEEDS_RESYNC"];

export const RESPONSE_STATES: ResponseState[] = ["ANSWERED", "NO_RESPONSE", "NOT_APPLICABLE", "UNKNOWN", "MISSING", "REQUIRES_VALIDATION"];

export const OUTBOX_STATUSES: OutboxStatus[] = ["PENDING", "SYNCING", "SYNC_FAILED", "CONFLICT", "COMPLETED"];

export const NEVER_SYNCED_MODULE_REVISION = 0;
