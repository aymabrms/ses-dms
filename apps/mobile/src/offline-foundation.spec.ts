import type { LocalDatabase } from "./db/types";
import { buildModuleSyncPayload, mapRepeatForSync, mapResponseForSync } from "./sync/payloadBuilder";
import { buildModuleSyncOutboxPayload } from "./sync/outboxPayload";
import { processAcceptedModuleResult } from "./sync/syncStateRepository";
import { deriveFailureState, deriveSyncOutcome } from "./sync/stateTransitions";
import { LOCAL_SYNC_STATUSES, NEVER_SYNCED_MODULE_REVISION, OUTBOX_STATUSES, RESPONSE_STATES } from "./types/constants";

async function main() {
  assertJsonEqual(RESPONSE_STATES, ["ANSWERED", "NO_RESPONSE", "NOT_APPLICABLE", "UNKNOWN", "MISSING", "REQUIRES_VALIDATION"]);
  assertJsonEqual(LOCAL_SYNC_STATUSES, ["LOCAL_ONLY", "DIRTY", "READY_TO_SYNC", "SYNCING", "SYNCED", "SYNC_FAILED", "CONFLICT", "NEEDS_RESYNC"]);
  assertJsonEqual(OUTBOX_STATUSES, ["PENDING", "SYNCING", "SYNC_FAILED", "CONFLICT", "COMPLETED"]);
  assertJsonEqual(NEVER_SYNCED_MODULE_REVISION, 0);
  assertJsonEqual(buildModuleSyncOutboxPayload("module-1"), { moduleId: "module-1" });
  assertJsonEqual(
    mapRepeatForSync({
      group_code: "household.member",
      id: "repeat-1",
      linked_business_employee_id: null,
      linked_household_membership_id: null,
      linked_person_id: "person-1",
      linked_structure_id: null,
      parent_repeat_instance_id: null,
      sequence_number: 1
    }),
    {
      groupCode: "household.member",
      id: "repeat-1",
      linkedBusinessEmployeeId: null,
      linkedHouseholdMembershipId: null,
      linkedPersonId: "person-1",
      linkedStructureId: null,
      parentRepeatInstanceId: null,
      sequenceNumber: 1
    }
  );
  assertJsonEqual(
    mapResponseForSync({
      captured_at: null,
      id: "response-1",
      question_code: "household.member.age",
      raw_value: null,
      repeat_instance_id: "repeat-1",
      response_state: "ANSWERED",
      value_boolean: null,
      value_date: null,
      value_json: '{"unit":"years"}',
      value_number: 42,
      value_text: null
    }),
    {
      capturedAt: null,
      id: "response-1",
      questionCode: "household.member.age",
      rawValue: null,
      repeatInstanceId: "repeat-1",
      responseState: "ANSWERED",
      valueBoolean: null,
      valueDate: null,
      valueJson: { unit: "years" },
      valueNumber: 42,
      valueText: null
    }
  );
  assertJsonEqual(deriveSyncOutcome({ interviewId: "i", moduleId: "m", revision: 3, status: "ACCEPTED" }), { kind: "ACCEPTED", moduleStatus: "SYNCED", outboxStatus: "COMPLETED", serverRevision: 3 });
  assertJsonEqual(deriveSyncOutcome({ currentRevision: 8, interviewId: "i", moduleId: "m", status: "CONFLICT" }), {
    currentRevision: 8,
    kind: "CONFLICT",
    message: "Server revision is 8; local changes were not applied.",
    moduleStatus: "CONFLICT",
    outboxStatus: "CONFLICT"
  });
  assertJsonEqual(deriveSyncOutcome({ interviewId: "i", message: "rejected", status: "REJECTED" }), { kind: "REJECTED", message: "rejected", moduleStatus: "SYNC_FAILED", outboxStatus: "SYNC_FAILED" });
  assertJsonEqual(deriveFailureState(), { moduleStatus: "SYNC_FAILED", outboxStatus: "SYNC_FAILED" });
  await assertCreateGraphPayload();
  await assertCompactExistingModulePayload();
  await assertAcceptedCreateReconciliation();
  console.log("ok - mobile offline foundation pure checks");
}

async function assertCreateGraphPayload() {
  const db = createFakeDb({ moduleRevision: 0 });
  const payload = await buildModuleSyncPayload(db, "module-1", "sync-1");
  const interview = required(payload.interviews[0]);
  const module = required(interview.modules[0]);

  assertJsonEqual(interview.interviewId, undefined);
  assertJsonEqual(interview.interview?.id, "interview-1");
  assertJsonEqual(required(interview.persons?.[0]).id, "person-1");
  assertJsonEqual(required(interview.households?.[0]).id, "household-1");
  assertJsonEqual(required(interview.householdMemberships?.[0]).id, "membership-1");
  assertJsonEqual(module.moduleId, "module-1");
  assertJsonEqual(module.expectedRevision, 0);
  assertJsonEqual(module.questionnaireVersionId, "version-1");
  assertJsonEqual(required(module.responses[0]).id, "response-1");
}

async function assertCompactExistingModulePayload() {
  const db = createFakeDb({ moduleRevision: 4 });
  const payload = await buildModuleSyncPayload(db, "module-1", "sync-2");
  const interview = required(payload.interviews[0]);
  const module = required(interview.modules[0]);

  assertJsonEqual(interview.interviewId, "interview-1");
  assertJsonEqual(interview.interview, undefined);
  assertJsonEqual(module.expectedRevision, 4);
  assertJsonEqual(module.questionnaireVersionId, undefined);
}

async function assertAcceptedCreateReconciliation() {
  const db = createFakeDb({ moduleRevision: 0 });
  await processAcceptedModuleResult(db, "outbox-1", "module-1", "interview-1", 1);
  const updates = db.__runs.map((run) => run.sql);
  assertJsonEqual(updates.some((sql) => sql.includes("UPDATE local_interview_modules SET server_revision = ?")), true);
  assertJsonEqual(updates.some((sql) => sql.includes("UPDATE local_interviews SET local_sync_status = ?")), true);
  assertJsonEqual(updates.some((sql) => sql.includes("UPDATE sync_outbox SET status = ?")), true);
  assertJsonEqual(db.__runs.some((run) => JSON.stringify(run.args).includes("SYNCED")), true);
}

function createFakeDb({ moduleRevision }: { moduleRevision: number }): LocalDatabase & { __runs: Array<{ args: unknown[]; sql: string }> } {
  const now = "2026-01-01T00:00:00.000Z";
  const rows = {
    businessEmployees: [{ business_id: "business-1", created_at: now, employment_status_raw: "REGULAR", id: "employee-1", local_sync_status: "LOCAL_ONLY", person_id: "person-2", updated_at: now, work_assignment_raw: "SALES" }],
    businesses: [{ created_at: now, id: "business-1", local_sync_status: "LOCAL_ONLY", name: "Business", nature_of_business_raw: null, ownership_type_raw: null, project_id: "project-1", started_at: null, survey_area_id: "area-1", updated_at: now }],
    householdMemberships: [{ created_at: now, household_id: "household-1", id: "membership-1", local_sync_status: "LOCAL_ONLY", member_order: 1, person_id: "person-1", relationship_lookup_value_id: null, relationship_to_head_raw: "HEAD", updated_at: now }],
    households: [{ created_at: now, id: "household-1", local_sync_status: "LOCAL_ONLY", project_id: "project-1", survey_area_id: "area-1", updated_at: now }],
    interview: { enumerator_user_id: "user-1", finished_at: null, id: "interview-1", project_id: "project-1", respondent_person_id: "person-1", started_at: now, survey_area_id: "area-1", survey_date: now },
    landParcels: [{ area_unit: "sqm", area_value: 10, created_at: now, id: "land-1", land_use_raw: null, local_sync_status: "LOCAL_ONLY", ownership_type_raw: null, project_id: "project-1", survey_area_id: "area-1", updated_at: now }],
    module: { business_id: null, household_id: "household-1", id: "module-1", interview_id: "interview-1", land_parcel_id: null, module_type: "HOUSEHOLD", questionnaire_version_id: "version-1", server_revision: moduleRevision, structure_id: null },
    persons: [{ created_at: now, first_name: "Person", gender_raw: null, id: "person-1", last_name: "One", local_sync_status: "LOCAL_ONLY", maiden_name: null, middle_name: null, primary_contact_number: null, primary_email: null, updated_at: now }],
    repeats: [{ group_code: "household.member", id: "repeat-1", linked_business_employee_id: null, linked_household_membership_id: "membership-1", linked_person_id: "person-1", linked_structure_id: null, parent_repeat_instance_id: null, sequence_number: 1 }],
    responses: [{ captured_at: now, id: "response-1", question_code: "household.member.name", raw_value: null, repeat_instance_id: "repeat-1", response_state: "ANSWERED", value_boolean: null, value_date: null, value_json: null, value_number: null, value_text: "Person One" }],
    structures: [{ created_at: now, id: "structure-1", land_parcel_id: "land-1", local_sync_status: "LOCAL_ONLY", project_id: "project-1", structure_condition_raw: null, structure_type_raw: "HOUSE", structure_use_raw: null, survey_area_id: "area-1", updated_at: now }]
  };
  const runs: Array<{ args: unknown[]; sql: string }> = [];

  return {
    __runs: runs,
    getAllAsync: async (sql: string) => {
      if (sql.includes("local_repeat_instances") && sql.includes("interview_module_id")) return rows.repeats;
      if (sql.includes("local_questionnaire_responses")) return rows.responses;
      if (sql.includes("local_household_memberships")) return rows.householdMemberships;
      if (sql.includes("local_business_employees")) return rows.businessEmployees;
      if (sql.includes("local_households")) return rows.households;
      if (sql.includes("local_businesses")) return rows.businesses;
      if (sql.includes("local_land_parcels")) return rows.landParcels;
      if (sql.includes("local_structures")) return rows.structures;
      if (sql.includes("SELECT DISTINCT ri.linked_person_id")) return [{ linked_person_id: "person-1" }];
      if (sql.includes("local_persons")) return rows.persons;
      return [];
    },
    getFirstAsync: async (sql: string) => {
      if (sql.includes("local_interview_modules")) return rows.module;
      if (sql.includes("local_interviews")) return rows.interview;
      return null;
    },
    runAsync: async (sql: string, ...args: unknown[]) => {
      runs.push({ args, sql });
      return { changes: 1, lastInsertRowId: 0 };
    },
    withTransactionAsync: async (fn: () => Promise<void>) => fn()
  } as unknown as LocalDatabase & { __runs: Array<{ args: unknown[]; sql: string }> };
}

function assertJsonEqual(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Assertion failed. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Expected value to be present");
  return value;
}

void main();
