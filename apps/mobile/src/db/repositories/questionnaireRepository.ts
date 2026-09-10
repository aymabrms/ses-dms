import { LocalDatabase } from "../database";
import { CreateLocalRepeatInstanceInput, LocalSyncStatus, UpsertLocalResponseInput } from "../../types/offline";
import { createUuid } from "../../utils/uuid";
import { markModuleDirty } from "./interviewRepository";

export async function createLocalRepeatInstance(db: LocalDatabase, input: CreateLocalRepeatInstanceInput) {
  const id = createUuid();
  const now = new Date().toISOString();
  const localSyncStatus: LocalSyncStatus = "LOCAL_ONLY";

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "INSERT INTO local_repeat_instances (id, interview_module_id, group_code, parent_repeat_instance_id, sequence_number, linked_person_id, linked_household_membership_id, linked_business_employee_id, linked_structure_id, local_sync_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      id,
      input.interviewModuleId,
      input.groupCode,
      input.parentRepeatInstanceId ?? null,
      input.sequenceNumber ?? null,
      input.linkedPersonId ?? null,
      input.linkedHouseholdMembershipId ?? null,
      input.linkedBusinessEmployeeId ?? null,
      input.linkedStructureId ?? null,
      localSyncStatus,
      now,
      now
    );
    await markModuleDirty(db, input.interviewModuleId);
  });

  return db.getFirstAsync("SELECT * FROM local_repeat_instances WHERE id = ?", id);
}

export function listLocalRepeatInstances(db: LocalDatabase, interviewModuleId: string) {
  return db.getAllAsync("SELECT * FROM local_repeat_instances WHERE interview_module_id = ? ORDER BY group_code ASC, sequence_number ASC, created_at ASC", interviewModuleId);
}

export async function updateLocalRepeatInstance(db: LocalDatabase, id: string, patch: Partial<CreateLocalRepeatInstanceInput>) {
  const existing = await db.getFirstAsync<{ interview_module_id: string }>("SELECT interview_module_id FROM local_repeat_instances WHERE id = ?", id);
  if (!existing) return null;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "UPDATE local_repeat_instances SET group_code = COALESCE(?, group_code), parent_repeat_instance_id = COALESCE(?, parent_repeat_instance_id), sequence_number = COALESCE(?, sequence_number), linked_person_id = COALESCE(?, linked_person_id), linked_household_membership_id = COALESCE(?, linked_household_membership_id), linked_business_employee_id = COALESCE(?, linked_business_employee_id), linked_structure_id = COALESCE(?, linked_structure_id), local_sync_status = ?, updated_at = ? WHERE id = ?",
      patch.groupCode ?? null,
      patch.parentRepeatInstanceId ?? null,
      patch.sequenceNumber ?? null,
      patch.linkedPersonId ?? null,
      patch.linkedHouseholdMembershipId ?? null,
      patch.linkedBusinessEmployeeId ?? null,
      patch.linkedStructureId ?? null,
      "DIRTY",
      new Date().toISOString(),
      id
    );
    await markModuleDirty(db, existing.interview_module_id);
  });

  return db.getFirstAsync("SELECT * FROM local_repeat_instances WHERE id = ?", id);
}

export async function upsertLocalResponse(db: LocalDatabase, input: UpsertLocalResponseInput) {
  const now = new Date().toISOString();
  const existing = input.id
    ? null
    : await db.getFirstAsync<{ id: string }>(
        "SELECT id FROM local_questionnaire_responses WHERE interview_module_id = ? AND question_code = ? AND repeat_instance_id IS ?",
        input.interviewModuleId,
        input.questionCode,
        input.repeatInstanceId ?? null
      );
  const id = input.id ?? existing?.id ?? createUuid();
  const valueJson = input.valueJson === undefined ? null : JSON.stringify(input.valueJson);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO local_questionnaire_responses (
        id, interview_module_id, question_code, repeat_instance_id, response_state,
        value_text, value_number, value_boolean, value_date, value_json, raw_value,
        captured_at, local_sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        response_state = excluded.response_state,
        value_text = excluded.value_text,
        value_number = excluded.value_number,
        value_boolean = excluded.value_boolean,
        value_date = excluded.value_date,
        value_json = excluded.value_json,
        raw_value = excluded.raw_value,
        captured_at = excluded.captured_at,
        local_sync_status = excluded.local_sync_status,
        updated_at = excluded.updated_at`,
      id,
      input.interviewModuleId,
      input.questionCode,
      input.repeatInstanceId ?? null,
      input.responseState,
      input.valueText ?? null,
      input.valueNumber ?? null,
      input.valueBoolean === undefined || input.valueBoolean === null ? null : input.valueBoolean ? 1 : 0,
      input.valueDate ?? null,
      valueJson,
      input.rawValue ?? null,
      input.capturedAt ?? null,
      "DIRTY",
      now,
      now
    );
    await markModuleDirty(db, input.interviewModuleId);
  });

  return db.getFirstAsync("SELECT * FROM local_questionnaire_responses WHERE id = ?", id);
}

export function listLocalResponsesForModule(db: LocalDatabase, interviewModuleId: string) {
  return db.getAllAsync("SELECT * FROM local_questionnaire_responses WHERE interview_module_id = ? ORDER BY question_code ASC, created_at ASC", interviewModuleId);
}

export async function markModuleQuestionnaireDataSynced(db: LocalDatabase, interviewModuleId: string) {
  const now = new Date().toISOString();
  await db.runAsync("UPDATE local_repeat_instances SET local_sync_status = ?, updated_at = ? WHERE interview_module_id = ?", "SYNCED", now, interviewModuleId);
  await db.runAsync("UPDATE local_questionnaire_responses SET local_sync_status = ?, updated_at = ? WHERE interview_module_id = ?", "SYNCED", now, interviewModuleId);
}
