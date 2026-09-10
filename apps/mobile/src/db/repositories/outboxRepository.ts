import type { LocalDatabase } from "../types";
import { OutboxOperation, OutboxStatus } from "../../types/offline";
import { createUuid } from "../../utils/uuid";
import { buildModuleSyncOutboxPayload } from "../../sync/outboxPayload";

export async function enqueueModuleForSync(db: LocalDatabase, moduleId: string, interviewId?: string | null) {
  const now = new Date().toISOString();
  const payload = JSON.stringify(buildModuleSyncOutboxPayload(moduleId));
  const existing = await db.getFirstAsync<{ id: string; status: OutboxStatus }>(
    "SELECT id, status FROM sync_outbox WHERE module_id = ? AND operation = ? AND status IN (?, ?, ?) ORDER BY updated_at DESC LIMIT 1",
    moduleId,
    "SYNC_MODULE",
    "PENDING",
    "SYNC_FAILED",
    "CONFLICT"
  );

  if (existing) {
    await db.runAsync("UPDATE sync_outbox SET payload_json = ?, status = ?, last_error = NULL, updated_at = ? WHERE id = ?", payload, "PENDING", now, existing.id);
    return db.getFirstAsync("SELECT * FROM sync_outbox WHERE id = ?", existing.id);
  }

  const id = createUuid();
  await db.runAsync(
    "INSERT INTO sync_outbox (id, entity_type, entity_id, operation, interview_id, module_id, payload_json, status, attempt_count, last_error, sync_request_id, completed_at, server_revision_received, last_http_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    "INTERVIEW_MODULE",
    moduleId,
    "SYNC_MODULE" satisfies OutboxOperation,
    interviewId ?? null,
    moduleId,
    payload,
    "PENDING",
    0,
    null,
    null,
    null,
    null,
    null,
    now,
    now
  );

  return db.getFirstAsync("SELECT * FROM sync_outbox WHERE id = ?", id);
}

export function listPendingOutboxItems(db: LocalDatabase) {
  return db.getAllAsync("SELECT * FROM sync_outbox WHERE status = ? ORDER BY created_at ASC", "PENDING");
}

export function listRetryableOutboxItems(db: LocalDatabase) {
  return db.getAllAsync("SELECT * FROM sync_outbox WHERE status IN (?, ?) ORDER BY updated_at ASC", "PENDING", "SYNC_FAILED");
}

export function countPendingOutboxItems(db: LocalDatabase) {
  return db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM sync_outbox WHERE status = ?", "PENDING");
}

export function countOutboxItemsByStatus(db: LocalDatabase, status: OutboxStatus) {
  return db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM sync_outbox WHERE status = ?", status);
}

export function getOutboxItem(db: LocalDatabase, outboxId: string) {
  return db.getFirstAsync("SELECT * FROM sync_outbox WHERE id = ?", outboxId);
}

export function markOutboxSyncing(db: LocalDatabase, outboxId: string, syncRequestId: string) {
  return db.runAsync("UPDATE sync_outbox SET status = ?, sync_request_id = ?, last_error = NULL, updated_at = ? WHERE id = ?", "SYNCING", syncRequestId, new Date().toISOString(), outboxId);
}

export function markOutboxCompleted(db: LocalDatabase, outboxId: string, serverRevision: number, httpStatus?: number) {
  const now = new Date().toISOString();
  return db.runAsync("UPDATE sync_outbox SET status = ?, completed_at = ?, server_revision_received = ?, last_http_status = ?, last_error = NULL, updated_at = ? WHERE id = ?", "COMPLETED", now, serverRevision, httpStatus ?? null, now, outboxId);
}

export function markOutboxConflict(db: LocalDatabase, outboxId: string, currentRevision: number, message: string, httpStatus?: number) {
  return db.runAsync("UPDATE sync_outbox SET status = ?, server_revision_received = ?, last_http_status = ?, last_error = ?, updated_at = ? WHERE id = ?", "CONFLICT", currentRevision, httpStatus ?? null, message, new Date().toISOString(), outboxId);
}

export function markOutboxFailed(db: LocalDatabase, outboxId: string, message: string, httpStatus?: number) {
  return db.runAsync("UPDATE sync_outbox SET status = ?, attempt_count = attempt_count + 1, last_http_status = ?, last_error = ?, updated_at = ? WHERE id = ?", "SYNC_FAILED", httpStatus ?? null, message, new Date().toISOString(), outboxId);
}
