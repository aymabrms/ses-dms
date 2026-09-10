import type { LocalDatabase } from "./db/types";
import { buildResponseInput } from "./questionnaires/responseMapping";
import { getQuestionnaireDefinition } from "./questionnaires/registry";
import { assertDefinitionIntegrity, assertUniqueQuestionCodes, calculateCompletion, evaluateModuleTriggers, getRepeatGroup, indexResponses, isQuestionRequired, isQuestionVisible, isRepeatDeletionAllowed, responseKey } from "./questionnaires/runtime";
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
  assertQuestionnaireRuntime();
  await assertBusinessQuestionnaireRuntime();
  assertLandownerQuestionnaireRuntime();
  assertMultiRoleInterviewRuntime();
  assertCrossModuleTriggersAndWarnings();
  console.log("ok - mobile offline foundation pure checks");
}

function assertCrossModuleTriggersAndWarnings() {
  const household = getQuestionnaireDefinition("HOUSEHOLD", "INITIAL");
  const householdTriggers = evaluateModuleTriggers(household, [{ questionCode: "household.associated_structures.used_for_business", repeatInstanceId: "structure-1", responseState: "ANSWERED", value: "YES" }], ["HOUSEHOLD"]);
  assertJsonEqual(householdTriggers.map((trigger) => `${trigger.targetModuleType}:${trigger.outcome}`), ["BUSINESS:RECOMMENDED"]);
  assertJsonEqual(householdTriggers[0]?.repeatInstanceId, "structure-1");
  assertJsonEqual(evaluateModuleTriggers(household, [{ questionCode: "household.associated_structures.used_for_business", repeatInstanceId: "structure-1", responseState: "ANSWERED", value: "NO" }]).length, 0);

  const landowner = getQuestionnaireDefinition("LANDOWNER", "INITIAL");
  const landownerTriggers = evaluateModuleTriggers(landowner, [{ questionCode: "landowner.business.exists_on_land", responseState: "ANSWERED", value: "YES" }], ["LANDOWNER", "BUSINESS"]);
  assertJsonEqual(landownerTriggers.length, 1);
  assertJsonEqual(landownerTriggers[0]?.message.includes("Existing BUSINESS module"), true);

  const business = getQuestionnaireDefinition("BUSINESS", "INITIAL");
  const warnings = calculateCompletion(
    business,
    [
      { questionCode: "business.employees.total_male", responseState: "ANSWERED" as const, value: 2 },
      { questionCode: "business.employees.total_female", responseState: "ANSWERED" as const, value: 0 },
      { questionCode: "business.employees.gender", repeatInstanceId: "employee-1", responseState: "ANSWERED" as const, value: "MALE" },
      { questionCode: "business.owner.birth_date", responseState: "ANSWERED" as const, value: "2000-01-01" },
      { questionCode: "business.owner.age", responseState: "ANSWERED" as const, value: 60 }
    ],
    [{ groupCode: "business.employees", id: "employee-1", localSyncStatus: "LOCAL_ONLY" }]
  ).messages.filter((message) => message.severity === "WARNING");
  assertJsonEqual(warnings.some((message) => message.code === "business.employees.total_male"), true);
  assertJsonEqual(warnings.some((message) => message.code === "business.owner.birth_date"), true);
}

function assertLandownerQuestionnaireRuntime() {
  const definition = getQuestionnaireDefinition("LANDOWNER", "INITIAL");
  assertJsonEqual(definition.id, "landowner-20220525-v1");
  assertThrows(() => getQuestionnaireDefinition("LANDOWNER", "UNKNOWN"));
  assertDefinitionIntegrity(definition);
  assertUniqueQuestionCodes(definition);
  assertJsonEqual(definition.sections.map((section) => section.code), [
    "landowner.interview",
    "landowner.respondent",
    "landowner.owner",
    "landowner.spouse",
    "landowner.land",
    "landowner.structure",
    "landowner.business",
    "landowner.rental_tenancy",
    "landowner.trees_crops",
    "landowner.project_awareness",
    "landowner.feedback.issues_section",
    "landowner.feedback.recommendations_section",
    "landowner.feedback.benefits_section",
    "landowner.feedback.livelihood_preferences_section",
    "landowner.certification"
  ]);
  assertJsonEqual(definition.repeatGroups.map((group) => group.code), ["landowner.feedback.issues", "landowner.feedback.recommendations", "landowner.feedback.benefits", "landowner.feedback.livelihood_preferences"]);

  const structureUse = required(definition.sections.find((section) => section.code === "landowner.structure")?.questions.find((question) => question.code === "landowner.structure.use"));
  assertJsonEqual(isQuestionVisible(structureUse, indexResponses([{ questionCode: "landowner.structure.exists", responseState: "ANSWERED", value: "NO" }])), false);
  assertJsonEqual(isQuestionVisible(structureUse, indexResponses([{ questionCode: "landowner.structure.exists", responseState: "ANSWERED", value: "YES" }])), true);

  const businessKind = required(definition.sections.find((section) => section.code === "landowner.business")?.questions.find((question) => question.code === "landowner.business.kind"));
  assertJsonEqual(isQuestionVisible(businessKind, indexResponses([{ questionCode: "landowner.business.exists_on_land", responseState: "ANSWERED", value: "NO" }])), false);
  assertJsonEqual(isQuestionVisible(businessKind, indexResponses([{ questionCode: "landowner.business.exists_on_land", responseState: "ANSWERED", value: "YES" }])), true);

  const landRent = required(definition.sections.find((section) => section.code === "landowner.rental_tenancy")?.questions.find((question) => question.code === "landowner.rent.land_monthly_rental"));
  assertJsonEqual(isQuestionVisible(landRent, indexResponses([{ questionCode: "landowner.rent.land_rented_out", responseState: "ANSWERED", value: "NO" }])), false);
  assertJsonEqual(isQuestionVisible(landRent, indexResponses([{ questionCode: "landowner.rent.land_rented_out", responseState: "ANSWERED", value: "YES" }])), true);

  const planter = required(definition.sections.find((section) => section.code === "landowner.trees_crops")?.questions.find((question) => question.code === "landowner.trees_crops.planter"));
  assertJsonEqual(isQuestionVisible(planter, indexResponses([{ questionCode: "landowner.trees_crops.exists", responseState: "ANSWERED", value: "NO" }])), false);
  assertJsonEqual(isQuestionVisible(planter, indexResponses([{ questionCode: "landowner.trees_crops.exists", responseState: "ANSWERED", value: "YES" }])), true);

  const awarenessSource = required(definition.sections.find((section) => section.code === "landowner.project_awareness")?.questions.find((question) => question.code === "landowner.project_awareness.source"));
  assertJsonEqual(isQuestionVisible(awarenessSource, indexResponses([{ questionCode: "landowner.project_awareness.aware", responseState: "ANSWERED", value: "NO" }])), false);
  assertJsonEqual(calculateCompletion(definition, [{ questionCode: "landowner.project_awareness.aware", responseState: "ANSWERED", value: "NO" }]).messages.some((message) => message.code === "landowner.project_awareness.source"), false);

  const completeResponses = [
    { questionCode: "landowner.interview.enumerator_name", responseState: "ANSWERED" as const, value: "Enum" },
    { questionCode: "landowner.interview.survey_date", responseState: "ANSWERED" as const, value: "2026-01-01" },
    { questionCode: "landowner.respondent.last_name", responseState: "ANSWERED" as const, value: "Reyes" },
    { questionCode: "landowner.respondent.first_name", responseState: "ANSWERED" as const, value: "Ana" },
    { questionCode: "landowner.respondent.relationship_to_landowner", responseState: "ANSWERED" as const, value: "HOUSEHOLD_HEAD" },
    { questionCode: "landowner.owner.last_name", responseState: "ANSWERED" as const, value: "Reyes" },
    { questionCode: "landowner.owner.first_name", responseState: "ANSWERED" as const, value: "Ana" },
    { questionCode: "landowner.land.occupies_owned_land", responseState: "ANSWERED" as const, value: "YES" },
    { questionCode: "landowner.structure.exists", responseState: "ANSWERED" as const, value: "NO" },
    { questionCode: "landowner.business.exists_on_land", responseState: "ANSWERED" as const, value: "NO" },
    { questionCode: "landowner.trees_crops.exists", responseState: "ANSWERED" as const, value: "NO" },
    { questionCode: "landowner.project_awareness.aware", responseState: "ANSWERED" as const, value: "NO" }
  ];
  assertJsonEqual(calculateCompletion(definition, []).completionState, "NOT_STARTED");
  assertJsonEqual(calculateCompletion(definition, completeResponses).completionState, "COMPLETE");
  assertJsonEqual(buildResponseInput("module-1", "landowner.land.area", "DECIMAL", "150.5", "ANSWERED"), { interviewModuleId: "module-1", questionCode: "landowner.land.area", repeatInstanceId: null, responseState: "ANSWERED", valueNumber: 150.5 });
  assertJsonEqual(buildModuleSyncOutboxPayload("module-1"), { moduleId: "module-1" });
}

function assertMultiRoleInterviewRuntime() {
  const definitions = [getQuestionnaireDefinition("HOUSEHOLD", "INITIAL"), getQuestionnaireDefinition("BUSINESS", "INITIAL"), getQuestionnaireDefinition("LANDOWNER", "INITIAL")];
  assertJsonEqual(definitions.map((definition) => definition.moduleType), ["HOUSEHOLD", "BUSINESS", "LANDOWNER"]);
  definitions.forEach(assertDefinitionIntegrity);

  const interviewModules = [
    { completion: "IN_PROGRESS", id: "module-household", interviewId: "interview-1", localSyncStatus: "DIRTY", moduleType: "HOUSEHOLD", respondentPersonId: "person-1" },
    { completion: "COMPLETE", id: "module-business", interviewId: "interview-1", localSyncStatus: "LOCAL_ONLY", moduleType: "BUSINESS", respondentPersonId: "person-1" },
    { completion: "NOT_STARTED", id: "module-landowner", interviewId: "interview-1", localSyncStatus: "SYNC_FAILED", moduleType: "LANDOWNER", respondentPersonId: "person-1" }
  ];
  assertJsonEqual(interviewModules.every((module) => module.interviewId === "interview-1"), true);
  assertJsonEqual(new Set(interviewModules.map((module) => module.respondentPersonId)).size, 1);
  assertJsonEqual(new Set(interviewModules.map((module) => module.id)).size, 3);
  assertJsonEqual(interviewModules.map((module) => `${module.moduleType}:${module.completion}:${module.localSyncStatus}`), ["HOUSEHOLD:IN_PROGRESS:DIRTY", "BUSINESS:COMPLETE:LOCAL_ONLY", "LANDOWNER:NOT_STARTED:SYNC_FAILED"]);

  const scopedResponses = indexResponses([
    { questionCode: "household.respondent.first_name", responseState: "ANSWERED" as const, value: "Household Ana" },
    { questionCode: "business.respondent.first_name", responseState: "ANSWERED" as const, value: "Business Ana" },
    { questionCode: "landowner.respondent.first_name", responseState: "ANSWERED" as const, value: "Landowner Ana" }
  ]);
  assertJsonEqual(scopedResponses.get(responseKey("household.respondent.first_name"))?.value, "Household Ana");
  assertJsonEqual(scopedResponses.get(responseKey("business.respondent.first_name"))?.value, "Business Ana");
  assertJsonEqual(scopedResponses.get(responseKey("landowner.respondent.first_name"))?.value, "Landowner Ana");

  const repeatResponses = indexResponses([
    { questionCode: "household.members.first_name", repeatInstanceId: "household-repeat-1", responseState: "ANSWERED" as const, value: "Member" },
    { questionCode: "business.employees.name", repeatInstanceId: "business-repeat-1", responseState: "ANSWERED" as const, value: "Employee" },
    { questionCode: "landowner.feedback.issues.text", repeatInstanceId: "landowner-repeat-1", responseState: "ANSWERED" as const, value: "Concern" }
  ]);
  assertJsonEqual(repeatResponses.get(responseKey("household.members.first_name", "household-repeat-1"))?.value, "Member");
  assertJsonEqual(repeatResponses.get(responseKey("business.employees.name", "business-repeat-1"))?.value, "Employee");
  assertJsonEqual(repeatResponses.get(responseKey("landowner.feedback.issues.text", "landowner-repeat-1"))?.value, "Concern");
}

function assertQuestionnaireRuntime() {
  const definition = getQuestionnaireDefinition("HOUSEHOLD", "INITIAL");
  assertJsonEqual(definition.id, "household-20220525-v1");
  assertThrows(() => getQuestionnaireDefinition("HOUSEHOLD", "UNKNOWN"));
  assertUniqueQuestionCodes(definition);
  assertJsonEqual(definition.sections.map((section) => section.code), [
    "household.interview",
    "household.respondent",
    "household.head_spouse",
    "household.members_section",
    "household.expenditure",
    "household.assets_debt",
    "household.utilities_services",
    "household.structure_occupancy",
    "household.associated_structures_section",
    "household.land",
    "household.land.trees_crops_section",
    "household.livelihood",
    "household.financial_brackets",
    "household.relocation",
    "household.project_awareness",
    "household.feedback.issues_section",
    "household.feedback.recommendations_section",
    "household.feedback.benefits_section",
    "household.feedback.livelihood_preferences_section",
    "household.certification"
  ]);
  assertJsonEqual(definition.repeatGroups.map((group) => group.code), ["household.members", "household.associated_structures", "household.land.trees_crops", "household.feedback.issues", "household.feedback.recommendations", "household.feedback.benefits", "household.feedback.livelihood_preferences"]);
  assertJsonEqual(definition.sections.every((section) => !section.repeatGroupCode || definition.repeatGroups.some((group) => group.code === section.repeatGroupCode)), true);
  assertJsonEqual(definition.sections.find((section) => section.code === "household.expenditure")?.questions.length, 40);

  const awarenessSource = required(definition.sections.find((section) => section.code === "household.project_awareness")?.questions.find((question) => question.code === "household.project_awareness.source"));
  const noAwareness = indexResponses([{ questionCode: "household.project_awareness.aware", responseState: "ANSWERED", value: "NO" }]);
  const yesAwareness = indexResponses([{ questionCode: "household.project_awareness.aware", responseState: "ANSWERED", value: "YES" }]);
  assertJsonEqual(isQuestionVisible(awarenessSource, noAwareness), false);
  assertJsonEqual(isQuestionVisible(awarenessSource, yesAwareness), true);
  assertJsonEqual(isQuestionRequired(awarenessSource, yesAwareness), true);
  assertJsonEqual(calculateCompletion(definition, [{ questionCode: "household.project_awareness.aware", responseState: "ANSWERED", value: "NO" }]).messages.some((message) => message.code === "household.project_awareness.source"), false);

  const memberResponses = [
    { questionCode: "household.members.first_name", repeatInstanceId: "member-1", responseState: "ANSWERED" as const, value: "Ana" },
    { questionCode: "household.members.first_name", repeatInstanceId: "member-2", responseState: "ANSWERED" as const, value: "Ben" }
  ];
  const responseMap = indexResponses(memberResponses);
  assertJsonEqual(responseMap.get("member-1:household.members.first_name")?.value, "Ana");
  assertJsonEqual(responseMap.get("member-2:household.members.first_name")?.value, "Ben");
  assertJsonEqual(calculateCompletion(definition, []).completionState, "NOT_STARTED");
  assertJsonEqual(calculateCompletion(definition, [{ questionCode: "household.respondent.first_name", responseState: "ANSWERED", value: "Ana" }]).completionState, "IN_PROGRESS");

  const completeResponses = [
    { questionCode: "household.interview.enumerator_name", responseState: "ANSWERED" as const, value: "Enum" },
    { questionCode: "household.interview.survey_date", responseState: "ANSWERED" as const, value: "2026-01-01" },
    { questionCode: "household.respondent.last_name", responseState: "ANSWERED" as const, value: "Reyes" },
    { questionCode: "household.respondent.first_name", responseState: "ANSWERED" as const, value: "Ana" },
    { questionCode: "household.respondent.relationship_to_head", responseState: "ANSWERED" as const, value: "HOUSEHOLD_HEAD" },
    { questionCode: "household.head.first_name", responseState: "ANSWERED" as const, value: "Ana" },
    { questionCode: "household.head.last_name", responseState: "ANSWERED" as const, value: "Reyes" },
    { questionCode: "household.structure.owns_occupied_structure", responseState: "ANSWERED" as const, value: "YES" },
    { questionCode: "household.project_awareness.aware", responseState: "ANSWERED" as const, value: "NO" }
  ];
  assertJsonEqual(calculateCompletion(definition, completeResponses).completionState, "COMPLETE");
  assertJsonEqual(buildResponseInput("module-1", "household.members.monthly_income", "MONEY", "1200", "ANSWERED", "member-1"), { interviewModuleId: "module-1", questionCode: "household.members.monthly_income", repeatInstanceId: "member-1", responseState: "ANSWERED", valueNumber: 1200 });
  assertJsonEqual(buildResponseInput("module-1", "household.members.vulnerabilities", "MULTI_SELECT", ["PWD"], "ANSWERED", "member-1").valueJson, ["PWD"]);
  assertJsonEqual(isRepeatDeletionAllowed({ groupCode: "household.members", id: "repeat-1", localSyncStatus: "LOCAL_ONLY" }), true);
  assertJsonEqual(isRepeatDeletionAllowed({ groupCode: "household.members", id: "repeat-1", localSyncStatus: "SYNCED" }), false);
  const employment = required(definition.repeatGroups[0]?.questions.find((question) => question.code === "household.members.employment_status"));
  assertJsonEqual(employment.options?.some((option) => option.value === "CONTRACTUAL"), true);
  const businessUse = required(definition.repeatGroups.find((group) => group.code === "household.associated_structures")?.questions.find((question) => question.code === "household.associated_structures.used_for_business"));
  assertJsonEqual(businessUse.triggerRecommendation, { level: "RECOMMENDED", message: "Business questionnaire may be required.", moduleType: "BUSINESS" });
  const treeRepeat = required(definition.sections.find((section) => section.code === "household.land.trees_crops_section"));
  assertJsonEqual(treeRepeat.repeatGroupCode, "household.land.trees_crops");
}

async function assertBusinessQuestionnaireRuntime() {
  const householdDefinition = getQuestionnaireDefinition("HOUSEHOLD", "INITIAL");
  const definition = getQuestionnaireDefinition("BUSINESS", "INITIAL");
  assertJsonEqual(definition.id, "business-20220525-v1");
  assertThrows(() => getQuestionnaireDefinition("BUSINESS", "UNKNOWN"));
  assertDefinitionIntegrity(householdDefinition);
  assertDefinitionIntegrity(definition);
  assertUniqueQuestionCodes(definition);
  assertJsonEqual(definition.sections.map((section) => section.code), [
    "business.interview",
    "business.respondent",
    "business.owner",
    "business.profile",
    "business.employees_section",
    "business.employee_totals",
    "business.employee_skills",
    "business.structure_occupancy",
    "business.land",
    "business.owner_livelihood",
    "business.employee_livelihood",
    "business.project_awareness",
    "business.feedback.issues_section",
    "business.feedback.recommendations_section",
    "business.feedback.benefits_section",
    "business.feedback.livelihood_preferences_section",
    "business.certification"
  ]);
  assertJsonEqual(definition.repeatGroups.map((group) => group.code), ["business.employees", "business.feedback.issues", "business.feedback.recommendations", "business.feedback.benefits", "business.feedback.livelihood_preferences"]);
  const employeeGroup = getRepeatGroup(definition, "business.employees");
  assertJsonEqual(employeeGroup.questions.some((question) => question.code === "business.employees.salary_amount"), true);
  assertJsonEqual(employeeGroup.questions.some((question) => question.code === "business.employees.salary_frequency"), true);

  const businessSalaryResponses = [
    { questionCode: "business.employees.salary_amount", repeatInstanceId: "employee-1", responseState: "ANSWERED" as const, value: 500 },
    { questionCode: "business.employees.salary_frequency", repeatInstanceId: "employee-1", responseState: "ANSWERED" as const, value: "DAILY" },
    { questionCode: "business.employees.salary_amount", repeatInstanceId: "employee-2", responseState: "ANSWERED" as const, value: 12000 },
    { questionCode: "business.employees.salary_frequency", repeatInstanceId: "employee-2", responseState: "ANSWERED" as const, value: "MONTHLY" }
  ];
  const salaryMap = indexResponses(businessSalaryResponses);
  assertJsonEqual(salaryMap.get(responseKey("business.employees.salary_amount", "employee-1"))?.value, 500);
  assertJsonEqual(salaryMap.get(responseKey("business.employees.salary_frequency", "employee-2"))?.value, "MONTHLY");

  const structureRent = required(definition.sections.find((section) => section.code === "business.structure_occupancy")?.questions.find((question) => question.code === "business.structure.monthly_rent"));
  assertJsonEqual(isQuestionVisible(structureRent, indexResponses([{ questionCode: "business.structure.owns_structure", responseState: "ANSWERED", value: "YES" }])), false);
  assertJsonEqual(isQuestionVisible(structureRent, indexResponses([{ questionCode: "business.structure.owns_structure", responseState: "ANSWERED", value: "NO" }, { questionCode: "business.structure.occupancy_arrangement", responseState: "ANSWERED", value: "TENANT_RENTER" }])), true);
  assertJsonEqual(isQuestionRequired(structureRent, indexResponses([{ questionCode: "business.structure.owns_structure", responseState: "ANSWERED", value: "NO" }, { questionCode: "business.structure.occupancy_arrangement", responseState: "ANSWERED", value: "TENANT_RENTER" }])), true);

  const landProof = required(definition.sections.find((section) => section.code === "business.land")?.questions.find((question) => question.code === "business.land.proof"));
  const landConsent = required(definition.sections.find((section) => section.code === "business.land")?.questions.find((question) => question.code === "business.land.landowner_consent"));
  assertJsonEqual(isQuestionVisible(landProof, indexResponses([{ questionCode: "business.land.owns_land", responseState: "ANSWERED", value: "YES" }])), true);
  assertJsonEqual(isQuestionVisible(landConsent, indexResponses([{ questionCode: "business.land.owns_land", responseState: "ANSWERED", value: "YES" }])), false);

  const awarenessSource = required(definition.sections.find((section) => section.code === "business.project_awareness")?.questions.find((question) => question.code === "business.project_awareness.source"));
  assertJsonEqual(isQuestionVisible(awarenessSource, indexResponses([{ questionCode: "business.project_awareness.aware", responseState: "ANSWERED", value: "NO" }])), false);
  assertJsonEqual(calculateCompletion(definition, [{ questionCode: "business.project_awareness.aware", responseState: "ANSWERED", value: "NO" }]).messages.some((message) => message.code === "business.project_awareness.source"), false);

  const feedbackResponses = [
    { questionCode: "business.feedback.issues.text", repeatInstanceId: "issue-1", responseState: "ANSWERED" as const, value: "Delayed compensation" },
    { questionCode: "business.feedback.issues.text", repeatInstanceId: "issue-2", responseState: "ANSWERED" as const, value: "Employee displacement" }
  ];
  assertJsonEqual(indexResponses(feedbackResponses).get(responseKey("business.feedback.issues.text", "issue-2"))?.value, "Employee displacement");

  const completeBusinessResponses = [
    { questionCode: "business.interview.enumerator_name", responseState: "ANSWERED" as const, value: "Enum" },
    { questionCode: "business.interview.survey_date", responseState: "ANSWERED" as const, value: "2026-01-01" },
    { questionCode: "business.respondent.last_name", responseState: "ANSWERED" as const, value: "Reyes" },
    { questionCode: "business.respondent.first_name", responseState: "ANSWERED" as const, value: "Ana" },
    { questionCode: "business.respondent.relationship_to_owner", responseState: "ANSWERED" as const, value: "Owner" },
    { questionCode: "business.owner.last_name", responseState: "ANSWERED" as const, value: "Reyes" },
    { questionCode: "business.owner.first_name", responseState: "ANSWERED" as const, value: "Ana" },
    { questionCode: "business.profile.name", responseState: "ANSWERED" as const, value: "Store" },
    { questionCode: "business.structure.owns_structure", responseState: "ANSWERED" as const, value: "YES" },
    { questionCode: "business.land.owns_land", responseState: "ANSWERED" as const, value: "YES" },
    { questionCode: "business.land.proof", responseState: "ANSWERED" as const, value: "Title" },
    { questionCode: "business.project_awareness.aware", responseState: "ANSWERED" as const, value: "NO" }
  ];
  assertJsonEqual(calculateCompletion(definition, []).completionState, "NOT_STARTED");
  assertJsonEqual(calculateCompletion(definition, completeBusinessResponses).completionState, "COMPLETE");
  assertJsonEqual(calculateCompletion(definition, completeBusinessResponses, [{ groupCode: "business.employees", id: "employee-1", localSyncStatus: "LOCAL_ONLY" }, { groupCode: "business.employees", id: "employee-2", localSyncStatus: "LOCAL_ONLY" }]).completionState, "IN_PROGRESS");

  assertJsonEqual(buildResponseInput("module-1", "business.profile.name", "TEXT", "Store", "ANSWERED"), { interviewModuleId: "module-1", questionCode: "business.profile.name", repeatInstanceId: null, responseState: "ANSWERED", valueText: "Store" });
  assertJsonEqual(buildResponseInput("module-1", "business.employees.salary_amount", "MONEY", "500", "ANSWERED", "employee-1"), { interviewModuleId: "module-1", questionCode: "business.employees.salary_amount", repeatInstanceId: "employee-1", responseState: "ANSWERED", valueNumber: 500 });
  assertJsonEqual(buildModuleSyncOutboxPayload("module-1"), { moduleId: "module-1" });
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

function assertThrows(fn: () => unknown) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error("Expected function to throw");
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Expected value to be present");
  return value;
}

void main();
