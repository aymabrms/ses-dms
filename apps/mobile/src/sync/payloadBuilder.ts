import { LocalDatabase } from "../db/database";
import { ResponseState, SyncModuleRequestPayload } from "../types/offline";

type LocalInterviewRow = { id: string };
type LocalModuleRow = { id: string; interview_id: string; server_revision: number };
export type LocalRepeatRow = {
  id: string;
  group_code: string;
  parent_repeat_instance_id: string | null;
  sequence_number: number | null;
  linked_person_id: string | null;
  linked_household_membership_id: string | null;
  linked_business_employee_id: string | null;
  linked_structure_id: string | null;
};
export type LocalResponseRow = {
  question_code: string;
  repeat_instance_id: string | null;
  response_state: ResponseState;
  value_text: string | null;
  value_number: number | null;
  value_boolean: number | null;
  value_date: string | null;
  value_json: string | null;
  raw_value: string | null;
  captured_at: string | null;
};

export async function buildModuleSyncPayload(db: LocalDatabase, moduleId: string, syncRequestId: string): Promise<SyncModuleRequestPayload> {
  const module = await db.getFirstAsync<LocalModuleRow>("SELECT id, interview_id, server_revision FROM local_interview_modules WHERE id = ?", moduleId);
  if (!module) throw new Error("Local module not found");

  const interview = await db.getFirstAsync<LocalInterviewRow>("SELECT id FROM local_interviews WHERE id = ?", module.interview_id);
  if (!interview) throw new Error("Local interview not found for module");

  const repeats = await db.getAllAsync<LocalRepeatRow>("SELECT * FROM local_repeat_instances WHERE interview_module_id = ? ORDER BY created_at ASC", moduleId);
  const responses = await db.getAllAsync<LocalResponseRow>("SELECT * FROM local_questionnaire_responses WHERE interview_module_id = ? ORDER BY created_at ASC", moduleId);

  return {
    interviews: [
      {
        interviewId: interview.id,
        modules: [
          {
            expectedRevision: module.server_revision,
            moduleId: module.id,
            repeatInstances: repeats.map(mapRepeatForSync),
            responses: responses.map(mapResponseForSync)
          }
        ]
      }
    ],
    syncRequestId
  };
}

export function mapRepeatForSync(row: LocalRepeatRow) {
  return {
    groupCode: row.group_code,
    id: row.id,
    linkedBusinessEmployeeId: row.linked_business_employee_id,
    linkedHouseholdMembershipId: row.linked_household_membership_id,
    linkedPersonId: row.linked_person_id,
    linkedStructureId: row.linked_structure_id,
    parentRepeatInstanceId: row.parent_repeat_instance_id,
    sequenceNumber: row.sequence_number
  };
}

export function mapResponseForSync(row: LocalResponseRow) {
  return {
    capturedAt: row.captured_at,
    questionCode: row.question_code,
    rawValue: row.raw_value,
    repeatInstanceId: row.repeat_instance_id,
    responseState: row.response_state,
    valueBoolean: row.value_boolean === null ? null : row.value_boolean === 1,
    valueDate: row.value_date,
    valueJson: row.value_json ? (JSON.parse(row.value_json) as Record<string, unknown>) : null,
    valueNumber: row.value_number,
    valueText: row.value_text
  };
}
