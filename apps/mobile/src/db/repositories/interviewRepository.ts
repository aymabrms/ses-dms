import { LocalDatabase } from "../database";
import { CreateLocalInterviewInput, CreateLocalInterviewModuleInput, LocalSyncStatus } from "../../types/offline";
import { createUuid } from "../../utils/uuid";

export async function createLocalInterview(db: LocalDatabase, input: CreateLocalInterviewInput) {
  const id = createUuid();
  const now = new Date().toISOString();
  const surveyDate = input.surveyDate ?? now;
  const startedAt = input.startedAt ?? now;
  const localSyncStatus: LocalSyncStatus = "LOCAL_ONLY";

  await db.runAsync(
    "INSERT INTO local_interviews (id, project_id, survey_area_id, enumerator_user_id, respondent_person_id, survey_date, started_at, finished_at, server_workflow_status, local_sync_status, created_at, updated_at, server_updated_at, last_synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    input.projectId,
    input.surveyAreaId,
    input.enumeratorUserId ?? null,
    input.respondentPersonId ?? null,
    surveyDate,
    startedAt,
    null,
    null,
    localSyncStatus,
    now,
    now,
    null,
    null
  );

  return getLocalInterview(db, id);
}

export function getLocalInterview(db: LocalDatabase, id: string) {
  return db.getFirstAsync("SELECT * FROM local_interviews WHERE id = ?", id);
}

export function listLocalInterviews(db: LocalDatabase) {
  return db.getAllAsync("SELECT * FROM local_interviews ORDER BY updated_at DESC");
}

export async function updateLocalInterview(db: LocalDatabase, id: string, patch: { finishedAt?: string | null; localSyncStatus?: LocalSyncStatus; serverWorkflowStatus?: string | null }) {
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE local_interviews SET finished_at = COALESCE(?, finished_at), local_sync_status = COALESCE(?, local_sync_status), server_workflow_status = COALESCE(?, server_workflow_status), updated_at = ? WHERE id = ?",
    patch.finishedAt ?? null,
    patch.localSyncStatus ?? null,
    patch.serverWorkflowStatus ?? null,
    now,
    id
  );
  return getLocalInterview(db, id);
}

export async function createLocalInterviewModule(db: LocalDatabase, input: CreateLocalInterviewModuleInput) {
  const id = createUuid();
  const now = new Date().toISOString();
  const localSyncStatus: LocalSyncStatus = "LOCAL_ONLY";

  await db.runAsync(
    "INSERT INTO local_interview_modules (id, interview_id, questionnaire_version_id, module_type, household_id, business_id, land_parcel_id, structure_id, server_revision, local_sync_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    id,
    input.interviewId,
    input.questionnaireVersionId,
    input.moduleType,
    input.householdId ?? null,
    input.businessId ?? null,
    input.landParcelId ?? null,
    input.structureId ?? null,
    0,
    localSyncStatus,
    now,
    now
  );

  return getLocalInterviewModule(db, id);
}

export function getLocalInterviewModule(db: LocalDatabase, id: string) {
  return db.getFirstAsync("SELECT * FROM local_interview_modules WHERE id = ?", id);
}

export function listLocalInterviewModules(db: LocalDatabase, interviewId: string) {
  return db.getAllAsync("SELECT * FROM local_interview_modules WHERE interview_id = ? ORDER BY created_at ASC", interviewId);
}

export async function updateLocalInterviewModuleRevision(db: LocalDatabase, moduleId: string, serverRevision: number, localSyncStatus: LocalSyncStatus = "SYNCED") {
  await db.runAsync("UPDATE local_interview_modules SET server_revision = ?, local_sync_status = ?, updated_at = ? WHERE id = ?", serverRevision, localSyncStatus, new Date().toISOString(), moduleId);
  return getLocalInterviewModule(db, moduleId);
}

export function markModuleDirty(db: LocalDatabase, moduleId: string) {
  return db.runAsync("UPDATE local_interview_modules SET local_sync_status = ?, updated_at = ? WHERE id = ?", "DIRTY", new Date().toISOString(), moduleId);
}
