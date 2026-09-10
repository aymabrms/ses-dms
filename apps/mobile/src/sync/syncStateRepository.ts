import type { LocalDatabase } from "../db/types";
import type { LocalSyncStatus, RemoteInterviewStatus } from "../types/offline";

export function processSyncingModule(db: LocalDatabase, moduleId: string) {
  return updateLocalModuleSyncStatus(db, moduleId, "SYNCING");
}

export async function processAcceptedModuleResult(db: LocalDatabase, outboxId: string, moduleId: string, interviewId: string, serverRevision: number) {
  const module = await db.getFirstAsync<{ server_revision: number }>("SELECT server_revision FROM local_interview_modules WHERE id = ?", moduleId);
  await db.withTransactionAsync(async () => {
    await markModuleSynced(db, moduleId, serverRevision);
    await markModuleQuestionnaireDataSynced(db, moduleId);
    if (module?.server_revision === 0) await markAcceptedCreateGraphSynced(db, interviewId);
    await updateInterviewLastSyncedAt(db, interviewId);
    await markOutboxCompleted(db, outboxId, serverRevision, 200);
  });
}

async function markAcceptedCreateGraphSynced(db: LocalDatabase, interviewId: string) {
  const now = new Date().toISOString();
  const interview = await db.getFirstAsync<{ project_id: string; respondent_person_id: string | null; survey_area_id: string }>("SELECT project_id, respondent_person_id, survey_area_id FROM local_interviews WHERE id = ?", interviewId);
  if (!interview) return;

  await db.runAsync("UPDATE local_interviews SET local_sync_status = ?, last_synced_at = ?, updated_at = ? WHERE id = ?", "SYNCED", now, now, interviewId);
  await db.runAsync("UPDATE local_persons SET local_sync_status = ?, updated_at = ? WHERE id = ? AND local_sync_status != ?", "SYNCED", now, interview.respondent_person_id, "SYNCED");
  await db.runAsync("UPDATE local_persons SET local_sync_status = ?, updated_at = ? WHERE id IN (SELECT hm.person_id FROM local_household_memberships hm INNER JOIN local_households h ON h.id = hm.household_id WHERE h.project_id = ? AND h.survey_area_id = ?) AND local_sync_status != ?", "SYNCED", now, interview.project_id, interview.survey_area_id, "SYNCED");
  await db.runAsync("UPDATE local_persons SET local_sync_status = ?, updated_at = ? WHERE id IN (SELECT be.person_id FROM local_business_employees be INNER JOIN local_businesses b ON b.id = be.business_id WHERE b.project_id = ? AND b.survey_area_id = ?) AND local_sync_status != ?", "SYNCED", now, interview.project_id, interview.survey_area_id, "SYNCED");
  await db.runAsync("UPDATE local_persons SET local_sync_status = ?, updated_at = ? WHERE id IN (SELECT ri.linked_person_id FROM local_repeat_instances ri INNER JOIN local_interview_modules m ON m.id = ri.interview_module_id WHERE m.interview_id = ? AND ri.linked_person_id IS NOT NULL) AND local_sync_status != ?", "SYNCED", now, interviewId, "SYNCED");
  await db.runAsync("UPDATE local_households SET local_sync_status = ?, updated_at = ? WHERE project_id = ? AND survey_area_id = ? AND local_sync_status != ?", "SYNCED", now, interview.project_id, interview.survey_area_id, "SYNCED");
  await db.runAsync("UPDATE local_businesses SET local_sync_status = ?, updated_at = ? WHERE project_id = ? AND survey_area_id = ? AND local_sync_status != ?", "SYNCED", now, interview.project_id, interview.survey_area_id, "SYNCED");
  await db.runAsync("UPDATE local_land_parcels SET local_sync_status = ?, updated_at = ? WHERE project_id = ? AND survey_area_id = ? AND local_sync_status != ?", "SYNCED", now, interview.project_id, interview.survey_area_id, "SYNCED");
  await db.runAsync("UPDATE local_structures SET local_sync_status = ?, updated_at = ? WHERE project_id = ? AND survey_area_id = ? AND local_sync_status != ?", "SYNCED", now, interview.project_id, interview.survey_area_id, "SYNCED");
  await db.runAsync("UPDATE local_household_memberships SET local_sync_status = ?, updated_at = ? WHERE household_id IN (SELECT id FROM local_households WHERE project_id = ? AND survey_area_id = ?)", "SYNCED", now, interview.project_id, interview.survey_area_id);
  await db.runAsync("UPDATE local_business_employees SET local_sync_status = ?, updated_at = ? WHERE business_id IN (SELECT id FROM local_businesses WHERE project_id = ? AND survey_area_id = ?)", "SYNCED", now, interview.project_id, interview.survey_area_id);
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

function updateLocalModuleSyncStatus(db: LocalDatabase, moduleId: string, localSyncStatus: LocalSyncStatus) {
  return db.runAsync("UPDATE local_interview_modules SET local_sync_status = ?, updated_at = ? WHERE id = ?", localSyncStatus, new Date().toISOString(), moduleId);
}

function markModuleSynced(db: LocalDatabase, moduleId: string, serverRevision: number) {
  return db.runAsync("UPDATE local_interview_modules SET server_revision = ?, local_sync_status = ?, updated_at = ? WHERE id = ?", serverRevision, "SYNCED", new Date().toISOString(), moduleId);
}

async function updateInterviewLastSyncedAt(db: LocalDatabase, interviewId: string, serverWorkflowStatus?: string | null) {
  const now = new Date().toISOString();
  await db.runAsync("UPDATE local_interviews SET last_synced_at = ?, server_workflow_status = COALESCE(?, server_workflow_status), updated_at = ? WHERE id = ?", now, serverWorkflowStatus ?? null, now, interviewId);
}

async function markModuleQuestionnaireDataSynced(db: LocalDatabase, interviewModuleId: string) {
  const now = new Date().toISOString();
  await db.runAsync("UPDATE local_repeat_instances SET local_sync_status = ?, updated_at = ? WHERE interview_module_id = ?", "SYNCED", now, interviewModuleId);
  await db.runAsync("UPDATE local_questionnaire_responses SET local_sync_status = ?, updated_at = ? WHERE interview_module_id = ?", "SYNCED", now, interviewModuleId);
}

function markOutboxCompleted(db: LocalDatabase, outboxId: string, serverRevision: number, httpStatus?: number) {
  const now = new Date().toISOString();
  return db.runAsync("UPDATE sync_outbox SET status = ?, completed_at = ?, server_revision_received = ?, last_http_status = ?, last_error = NULL, updated_at = ? WHERE id = ?", "COMPLETED", now, serverRevision, httpStatus ?? null, now, outboxId);
}
