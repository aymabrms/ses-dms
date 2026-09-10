import { LocalDatabase } from "../database";
import { OutboxOperation } from "../../types/offline";
import { createUuid } from "../../utils/uuid";
import { buildModuleSyncOutboxPayload } from "../../sync/outboxPayload";

export async function enqueueModuleForSync(db: LocalDatabase, moduleId: string, interviewId?: string | null) {
  const now = new Date().toISOString();
  const payload = JSON.stringify(buildModuleSyncOutboxPayload(moduleId));
  const existing = await db.getFirstAsync<{ id: string }>("SELECT id FROM sync_outbox WHERE module_id = ? AND operation = ? AND status = ?", moduleId, "SYNC_MODULE", "PENDING");

  if (existing) {
    await db.runAsync("UPDATE sync_outbox SET payload_json = ?, updated_at = ? WHERE id = ?", payload, now, existing.id);
    return db.getFirstAsync("SELECT * FROM sync_outbox WHERE id = ?", existing.id);
  }

  const id = createUuid();
  await db.runAsync(
    "INSERT INTO sync_outbox (id, entity_type, entity_id, operation, interview_id, module_id, payload_json, status, attempt_count, last_error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
    now,
    now
  );

  return db.getFirstAsync("SELECT * FROM sync_outbox WHERE id = ?", id);
}

export function listPendingOutboxItems(db: LocalDatabase) {
  return db.getAllAsync("SELECT * FROM sync_outbox WHERE status = ? ORDER BY created_at ASC", "PENDING");
}

export function countPendingOutboxItems(db: LocalDatabase) {
  return db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM sync_outbox WHERE status = ?", "PENDING");
}
