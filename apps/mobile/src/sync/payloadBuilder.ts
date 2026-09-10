import type { LocalDatabase } from "../db/types";
import { QuestionnaireModuleType, ResponseState, SyncModuleRequestPayload } from "../types/offline";

type LocalInterviewRow = {
  id: string;
  project_id: string;
  survey_area_id: string;
  enumerator_user_id: string | null;
  respondent_person_id: string | null;
  survey_date: string;
  started_at: string;
  finished_at: string | null;
};
type LocalModuleRow = {
  id: string;
  interview_id: string;
  questionnaire_version_id: string;
  module_type: QuestionnaireModuleType;
  household_id: string | null;
  business_id: string | null;
  land_parcel_id: string | null;
  structure_id: string | null;
  server_revision: number;
};
type LocalPersonRow = {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  maiden_name: string | null;
  birth_date: string | null;
  gender_raw: string | null;
  primary_contact_number: string | null;
  primary_email: string | null;
};
type LocalProjectAreaRecordRow = { id: string; project_id: string; survey_area_id: string };
type LocalHouseholdMembershipRow = { household_id: string; id: string; member_order: number | null; person_id: string; relationship_lookup_value_id: string | null; relationship_to_head_raw: string | null };
type LocalBusinessRow = LocalProjectAreaRecordRow & { name: string | null; nature_of_business_raw: string | null; ownership_type_raw: string | null; started_at: string | null };
type LocalBusinessEmployeeRow = { business_id: string; employment_status_raw: string | null; id: string; person_id: string; work_assignment_raw: string | null };
type LocalLandParcelRow = LocalProjectAreaRecordRow & { area_unit: string | null; area_value: number | null; land_use_raw: string | null; ownership_type_raw: string | null };
type LocalStructureRow = LocalProjectAreaRecordRow & { land_parcel_id: string | null; structure_condition_raw: string | null; structure_type_raw: string | null; structure_use_raw: string | null };
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
  id: string;
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
  const module = await db.getFirstAsync<LocalModuleRow>("SELECT * FROM local_interview_modules WHERE id = ?", moduleId);
  if (!module) throw new Error("Local module not found");

  const interview = await db.getFirstAsync<LocalInterviewRow>("SELECT * FROM local_interviews WHERE id = ?", module.interview_id);
  if (!interview) throw new Error("Local interview not found for module");

  const repeats = await db.getAllAsync<LocalRepeatRow>("SELECT * FROM local_repeat_instances WHERE interview_module_id = ? ORDER BY created_at ASC", moduleId);
  const responses = await db.getAllAsync<LocalResponseRow>("SELECT * FROM local_questionnaire_responses WHERE interview_module_id = ? ORDER BY created_at ASC", moduleId);

  const syncModule = {
    expectedRevision: module.server_revision,
    moduleId: module.id,
    repeatInstances: repeats.map(mapRepeatForSync),
    responses: responses.map(mapResponseForSync)
  };

  if (module.server_revision > 0) {
    return {
      interviews: [
        {
          interviewId: interview.id,
          modules: [syncModule]
        }
      ],
      syncRequestId
    };
  }

  if (!interview.enumerator_user_id) throw new Error("Local interview cannot be synced until an enumerator user id is assigned");

  const graph = await buildCreateGraph(db, interview);

  return {
    interviews: [
      {
        ...graph,
        interview: {
          enumeratorUserId: interview.enumerator_user_id,
          finishedAt: interview.finished_at,
          id: interview.id,
          projectId: interview.project_id,
          respondentPersonId: interview.respondent_person_id,
          startedAt: interview.started_at,
          surveyAreaId: interview.survey_area_id,
          surveyDate: interview.survey_date
        },
        modules: [
          {
            ...syncModule,
            businessId: module.business_id,
            householdId: module.household_id,
            landParcelId: module.land_parcel_id,
            moduleType: module.module_type,
            questionnaireVersionId: module.questionnaire_version_id,
            structureId: module.structure_id
          }
        ]
      }
    ],
    syncRequestId
  };
}

async function buildCreateGraph(db: LocalDatabase, interview: LocalInterviewRow) {
  const households = await db.getAllAsync<LocalProjectAreaRecordRow>("SELECT * FROM local_households WHERE project_id = ? AND survey_area_id = ? AND local_sync_status != ? ORDER BY created_at ASC", interview.project_id, interview.survey_area_id, "SYNCED");
  const businesses = await db.getAllAsync<LocalBusinessRow>("SELECT * FROM local_businesses WHERE project_id = ? AND survey_area_id = ? AND local_sync_status != ? ORDER BY created_at ASC", interview.project_id, interview.survey_area_id, "SYNCED");
  const landParcels = await db.getAllAsync<LocalLandParcelRow>("SELECT * FROM local_land_parcels WHERE project_id = ? AND survey_area_id = ? AND local_sync_status != ? ORDER BY created_at ASC", interview.project_id, interview.survey_area_id, "SYNCED");
  const structures = await db.getAllAsync<LocalStructureRow>("SELECT * FROM local_structures WHERE project_id = ? AND survey_area_id = ? AND local_sync_status != ? ORDER BY created_at ASC", interview.project_id, interview.survey_area_id, "SYNCED");
  const householdMemberships = await db.getAllAsync<LocalHouseholdMembershipRow>("SELECT hm.* FROM local_household_memberships hm INNER JOIN local_households h ON h.id = hm.household_id WHERE h.project_id = ? AND h.survey_area_id = ? AND hm.local_sync_status != ? ORDER BY hm.created_at ASC", interview.project_id, interview.survey_area_id, "SYNCED");
  const businessEmployees = await db.getAllAsync<LocalBusinessEmployeeRow>("SELECT be.* FROM local_business_employees be INNER JOIN local_businesses b ON b.id = be.business_id WHERE b.project_id = ? AND b.survey_area_id = ? AND be.local_sync_status != ? ORDER BY be.created_at ASC", interview.project_id, interview.survey_area_id, "SYNCED");
  const repeatPersonRefs = await db.getAllAsync<{ linked_person_id: string }>("SELECT DISTINCT ri.linked_person_id FROM local_repeat_instances ri INNER JOIN local_interview_modules m ON m.id = ri.interview_module_id WHERE m.interview_id = ? AND ri.linked_person_id IS NOT NULL", interview.id);
  const personIds = new Set<string>();
  if (interview.respondent_person_id) personIds.add(interview.respondent_person_id);
  for (const membership of householdMemberships) personIds.add(membership.person_id);
  for (const employee of businessEmployees) personIds.add(employee.person_id);
  for (const repeat of repeatPersonRefs) personIds.add(repeat.linked_person_id);
  const persons = personIds.size > 0 ? await db.getAllAsync<LocalPersonRow>(`SELECT * FROM local_persons WHERE id IN (${[...personIds].map(() => "?").join(", ")}) ORDER BY created_at ASC`, ...personIds) : [];

  return {
    businessEmployees: businessEmployees.map(mapBusinessEmployeeForSync),
    businesses: businesses.map(mapBusinessForSync),
    householdMemberships: householdMemberships.map(mapHouseholdMembershipForSync),
    households: households.map(mapProjectAreaRecordForSync),
    landParcels: landParcels.map(mapLandParcelForSync),
    persons: persons.map(mapPersonForSync),
    structures: structures.map(mapStructureForSync)
  };
}

function mapPersonForSync(row: LocalPersonRow) {
  return {
    birthDate: row.birth_date,
    firstName: row.first_name,
    genderRaw: row.gender_raw,
    id: row.id,
    lastName: row.last_name,
    maidenName: row.maiden_name,
    middleName: row.middle_name,
    primaryContactNumber: row.primary_contact_number,
    primaryEmail: row.primary_email
  };
}

function mapProjectAreaRecordForSync(row: LocalProjectAreaRecordRow) {
  return { id: row.id, projectId: row.project_id, surveyAreaId: row.survey_area_id };
}

function mapHouseholdMembershipForSync(row: LocalHouseholdMembershipRow) {
  return { householdId: row.household_id, id: row.id, memberOrder: row.member_order, personId: row.person_id, relationshipLookupValueId: row.relationship_lookup_value_id, relationshipToHeadRaw: row.relationship_to_head_raw };
}

function mapBusinessForSync(row: LocalBusinessRow) {
  return { ...mapProjectAreaRecordForSync(row), name: row.name, natureOfBusinessRaw: row.nature_of_business_raw, ownershipTypeRaw: row.ownership_type_raw, startedAt: row.started_at };
}

function mapBusinessEmployeeForSync(row: LocalBusinessEmployeeRow) {
  return { businessId: row.business_id, employmentStatusRaw: row.employment_status_raw, id: row.id, personId: row.person_id, workAssignmentRaw: row.work_assignment_raw };
}

function mapLandParcelForSync(row: LocalLandParcelRow) {
  return { ...mapProjectAreaRecordForSync(row), areaUnit: row.area_unit, areaValue: row.area_value, landUseRaw: row.land_use_raw, ownershipTypeRaw: row.ownership_type_raw };
}

function mapStructureForSync(row: LocalStructureRow) {
  return { ...mapProjectAreaRecordForSync(row), landParcelId: row.land_parcel_id, structureConditionRaw: row.structure_condition_raw, structureTypeRaw: row.structure_type_raw, structureUseRaw: row.structure_use_raw };
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
    id: row.id,
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
