import { ApiError, fetchRemoteInterviewStatus, postSyncInterviews } from "../api/client";
import { getDatabase, initializeDatabase } from "../db/database";
import { getOutboxItem, listRetryableOutboxItems, markOutboxConflict, markOutboxFailed, markOutboxSyncing } from "../db/repositories/outboxRepository";
import { createUuid } from "../utils/uuid";
import { buildModuleSyncPayload } from "./payloadBuilder";
import { processAcceptedModuleResult, processConflictModuleResult, processFailureModuleResult, processRemoteStatusForInterview, processSyncingModule } from "./syncStateRepository";

type OutboxRow = {
  id: string;
  module_id: string | null;
  interview_id: string | null;
  sync_request_id: string | null;
};

export interface SyncProcessingResult {
  outboxId: string;
  moduleId?: string | null;
  status: "ACCEPTED" | "CONFLICT" | "SYNC_FAILED";
  message: string;
  revision?: number;
}

export async function processPendingSync() {
  await initializeDatabase();
  const db = await getDatabase();
  const items = (await listRetryableOutboxItems(db)) as OutboxRow[];
  const results: SyncProcessingResult[] = [];

  for (const item of items) {
    results.push(await processOutboxItem(item.id));
  }

  return results;
}

export async function processOutboxItem(outboxId: string): Promise<SyncProcessingResult> {
  await initializeDatabase();
  const db = await getDatabase();
  const item = (await getOutboxItem(db, outboxId)) as OutboxRow | null;
  if (!item) throw new Error("Outbox item not found");
  if (!item.module_id) throw new Error("Outbox item is missing moduleId");

  const syncRequestId = item.sync_request_id ?? createUuid();

  await db.withTransactionAsync(async () => {
    await markOutboxSyncing(db, item.id, syncRequestId);
    await processSyncingModule(db, item.module_id as string);
  });

  try {
    const payload = await buildModuleSyncPayload(db, item.module_id, syncRequestId);
    const response = await postSyncInterviews(payload);
    const result = response.results.find((candidate) => candidate.moduleId === item.module_id);
    if (!result) throw new Error("Sync response did not include the requested module result");

    if (result.status === "ACCEPTED") {
      await processAcceptedModuleResult(db, item.id, item.module_id, result.interviewId, result.revision);
      return { message: "Module synced", moduleId: item.module_id, outboxId: item.id, revision: result.revision, status: "ACCEPTED" };
    }

    const message = `Server revision is ${result.currentRevision}; local changes were not applied.`;
    await db.withTransactionAsync(async () => {
      await processConflictModuleResult(db, item.module_id as string);
      await markOutboxConflict(db, item.id, result.currentRevision, message);
    });
    return { message, moduleId: item.module_id, outboxId: item.id, revision: result.currentRevision, status: "CONFLICT" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    const httpStatus = error instanceof ApiError ? error.status : undefined;
    await db.withTransactionAsync(async () => {
      await processFailureModuleResult(db, item.module_id as string);
      await markOutboxFailed(db, item.id, message, httpStatus);
    });
    return { message, moduleId: item.module_id, outboxId: item.id, status: "SYNC_FAILED" };
  }
}

export async function refreshRemoteStatus(interviewId: string) {
  await initializeDatabase();
  const db = await getDatabase();
  const status = await fetchRemoteInterviewStatus(interviewId);
  await processRemoteStatusForInterview(db, status);
  return status;
}
