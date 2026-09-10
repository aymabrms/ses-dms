import type { LocalDatabase } from "../db/types";
import { enqueueModuleForSync } from "../db/repositories/outboxRepository";
import { createLocalRepeatInstance, upsertLocalResponse } from "../db/repositories/questionnaireRepository";
import { ResponseState } from "../types/offline";
import { buildResponseInput } from "./responseMapping";
import { FieldType } from "./types";

export type LocalQuestionnaireResponseRow = {
  question_code: string;
  repeat_instance_id: string | null;
  response_state: ResponseState;
  value_text: string | null;
  value_number: number | null;
  value_boolean: number | null;
  value_date: string | null;
  value_json: string | null;
  raw_value: string | null;
};

export type LocalRepeatInstanceRow = { id: string; group_code: string; sequence_number: number | null; local_sync_status: string };

export function listQuestionnaireResponses(db: LocalDatabase, moduleId: string) {
  return db.getAllAsync<LocalQuestionnaireResponseRow>("SELECT * FROM local_questionnaire_responses WHERE interview_module_id = ? ORDER BY created_at ASC", moduleId);
}

export function listRepeatInstancesForGroup(db: LocalDatabase, moduleId: string, groupCode: string) {
  return db.getAllAsync<LocalRepeatInstanceRow>("SELECT id, group_code, sequence_number, local_sync_status FROM local_repeat_instances WHERE interview_module_id = ? AND group_code = ? ORDER BY sequence_number ASC, created_at ASC", moduleId, groupCode);
}

export async function addRepeatInstanceForGroup(db: LocalDatabase, moduleId: string, groupCode: string, nextSequenceNumber: number) {
  await createLocalRepeatInstance(db, { groupCode, interviewModuleId: moduleId, sequenceNumber: nextSequenceNumber });
  await enqueueModuleForSyncForModule(db, moduleId);
}

export async function removeLocalOnlyRepeatInstance(db: LocalDatabase, moduleId: string, repeatInstanceId: string) {
  const instance = await db.getFirstAsync<{ local_sync_status: string }>("SELECT local_sync_status FROM local_repeat_instances WHERE id = ? AND interview_module_id = ?", repeatInstanceId, moduleId);
  if (!instance) throw new Error("Repeat instance not found");
  if (instance.local_sync_status !== "LOCAL_ONLY") throw new Error("Only local-only repeat instances can be removed because delete/tombstone sync is not implemented yet.");
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM local_questionnaire_responses WHERE interview_module_id = ? AND repeat_instance_id = ?", moduleId, repeatInstanceId);
    await db.runAsync("DELETE FROM local_repeat_instances WHERE id = ? AND interview_module_id = ?", repeatInstanceId, moduleId);
    await db.runAsync("UPDATE local_interview_modules SET local_sync_status = ?, updated_at = ? WHERE id = ?", "DIRTY", new Date().toISOString(), moduleId);
  });
  await enqueueModuleForSyncForModule(db, moduleId);
}

export async function persistQuestionResponse(db: LocalDatabase, moduleId: string, questionCode: string, fieldType: FieldType, value: unknown, responseState: ResponseState = "ANSWERED", repeatInstanceId?: string | null) {
  const input = { ...buildResponseInput(moduleId, questionCode, fieldType, value, responseState, repeatInstanceId), capturedAt: new Date().toISOString() };
  await upsertLocalResponse(db, input);
  await enqueueModuleForSyncForModule(db, moduleId);
}

export function rowToRuntimeValue(row: LocalQuestionnaireResponseRow) {
  if (row.value_json) return JSON.parse(row.value_json) as unknown;
  if (row.value_boolean !== null) return row.value_boolean === 1;
  if (row.value_number !== null) return row.value_number;
  if (row.value_date !== null) return row.value_date;
  if (row.value_text !== null) return row.value_text;
  return null;
}

async function enqueueModuleForSyncForModule(db: LocalDatabase, moduleId: string) {
  const module = await db.getFirstAsync<{ interview_id: string }>("SELECT interview_id FROM local_interview_modules WHERE id = ?", moduleId);
  await enqueueModuleForSync(db, moduleId, module?.interview_id ?? null);
}
