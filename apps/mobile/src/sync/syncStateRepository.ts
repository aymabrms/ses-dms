import { LocalDatabase } from "../db/database";
import { markModuleSynced, updateInterviewLastSyncedAt, updateLocalModuleSyncStatus } from "../db/repositories/interviewRepository";
import { markOutboxCompleted } from "../db/repositories/outboxRepository";
import { markModuleQuestionnaireDataSynced } from "../db/repositories/questionnaireRepository";
import { RemoteInterviewStatus } from "../types/offline";

export function processSyncingModule(db: LocalDatabase, moduleId: string) {
  return updateLocalModuleSyncStatus(db, moduleId, "SYNCING");
}

export async function processAcceptedModuleResult(db: LocalDatabase, outboxId: string, moduleId: string, interviewId: string, serverRevision: number) {
  await db.withTransactionAsync(async () => {
    await markModuleSynced(db, moduleId, serverRevision);
    await markModuleQuestionnaireDataSynced(db, moduleId);
    await updateInterviewLastSyncedAt(db, interviewId);
    await markOutboxCompleted(db, outboxId, serverRevision, 200);
  });
}

export function processConflictModuleResult(db: LocalDatabase, moduleId: string) {
  return updateLocalModuleSyncStatus(db, moduleId, "CONFLICT");
}

export function processFailureModuleResult(db: LocalDatabase, moduleId: string) {
  return updateLocalModuleSyncStatus(db, moduleId, "SYNC_FAILED");
}

export async function processRemoteStatusForInterview(db: LocalDatabase, remote: RemoteInterviewStatus) {
  await updateInterviewLastSyncedAt(db, remote.interviewId, remote.status);

  for (const remoteModule of remote.modules) {
    const local = await db.getFirstAsync<{ id: string; local_sync_status: string; server_revision: number }>("SELECT id, local_sync_status, server_revision FROM local_interview_modules WHERE id = ?", remoteModule.moduleId);
    if (!local) continue;

    if ((local.local_sync_status === "DIRTY" || local.local_sync_status === "LOCAL_ONLY") && local.server_revision !== remoteModule.revision) {
      await updateLocalModuleSyncStatus(db, local.id, "NEEDS_RESYNC");
      continue;
    }

    if (local.local_sync_status === "SYNCED" && local.server_revision !== remoteModule.revision) {
      await updateLocalModuleSyncStatus(db, local.id, "NEEDS_RESYNC");
    }
  }
}
