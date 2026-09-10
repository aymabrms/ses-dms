import { mapRepeatForSync, mapResponseForSync } from "./sync/payloadBuilder";
import { buildModuleSyncOutboxPayload } from "./sync/outboxPayload";
import { deriveFailureState, deriveSyncOutcome } from "./sync/stateTransitions";
import { LOCAL_SYNC_STATUSES, NEVER_SYNCED_MODULE_REVISION, OUTBOX_STATUSES, RESPONSE_STATES } from "./types/constants";

function main() {
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
  assertJsonEqual(deriveFailureState(), { moduleStatus: "SYNC_FAILED", outboxStatus: "SYNC_FAILED" });
  console.log("ok - mobile offline foundation pure checks");
}

function assertJsonEqual(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Assertion failed. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

main();
