import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { QuestionnaireModuleType, ResponseState, ValidationSeverity } from "@prisma/client";
import * as assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { AddressInfo } from "node:net";

import { AppModule } from "./app.module";
import { createValidationPipe } from "./app-validation";
import { PrismaService } from "./prisma/prisma.service";

const ids = {
  interviews: [] as string[],
  interviewModules: [] as string[],
  businesses: [] as string[],
  businessEmployees: [] as string[],
  businessOwnerships: [] as string[],
  households: [] as string[],
  householdMemberships: [] as string[],
  landOwnerships: [] as string[],
  landParcels: [] as string[],
  organizations: [] as string[],
  persons: [] as string[],
  projects: [] as string[],
  questionnaireRepeatInstances: [] as string[],
  questionnaireResponses: [] as string[],
  structureAssociations: [] as string[],
  structureOccupancies: [] as string[],
  structureTags: [] as string[],
  structures: [] as string[],
  syncRequests: [] as string[],
  surveyAreas: [] as string[],
  users: [] as string[],
  validationIssues: [] as string[]
};

let app: INestApplication;
let prisma: PrismaService;
let baseUrl: string;

async function main() {
  app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(createValidationPipe());
  await app.listen(0);

  prisma = app.get(PrismaService);
  const address = app.getHttpServer().address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run("creates a project", testProjectCreation);
    await run("rejects unknown DTO fields", testUnknownFieldsRejected);
    await run("survey area cannot reference nonexistent project", testSurveyAreaProjectReference);
    await run("interview cannot reference nonexistent project", testInterviewProjectReference);
    await run("interview survey area must belong to selected project", testInterviewSurveyAreaProjectOwnership);
    await run("interview cannot reference nonexistent enumerator", testInterviewEnumeratorReference);
    await run("interview module questionnaire version must exist", testInterviewModuleQuestionnaireVersionReference);
    await run("interview module type must match questionnaire version", testInterviewModuleTypeMatch);
    await run("household cannot use survey area from another project", testHouseholdSurveyAreaProjectOwnership);
    await run("household membership requires existing person", testHouseholdMembershipPersonReference);
    await run("household relationship lookup must belong to correct set", testHouseholdRelationshipLookupSet);
    await run("duplicate household/person membership is rejected", testDuplicateHouseholdMembership);
    await run("business ownership requires exactly one owner", testBusinessOwnershipXor);
    await run("business employee requires existing person", testBusinessEmployeePersonReference);
    await run("land ownership requires exactly one owner", testLandOwnershipXor);
    await run("structure cannot link land parcel from another project", testStructureLandProjectOwnership);
    await run("structure association cannot self-reference", testStructureSelfAssociation);
    await run("structure occupancy requires exactly one occupant", testStructureOccupancyXor);
    await run("structure occupancy rejects cross-project household", testStructureOccupancyCrossProjectHousehold);
    await run("interview module rejects clear context mismatch", testInterviewModuleContextMismatch);
    await run("questionnaire response batch persists successfully", testQuestionnaireResponseBatchPersists);
    await run("module revision increments after response write", testQuestionnaireResponseRevisionIncrements);
    await run("wrong expected revision returns conflict", testQuestionnaireResponseRevisionConflict);
    await run("duplicate response key updates safely", testDuplicateQuestionnaireResponseUpdates);
    await run("response rejects repeat instance from another module", testResponseRepeatInstanceModuleMismatch);
    await run("repeat instance can be created", testRepeatInstanceCreation);
    await run("repeat instance parent must belong to same module", testRepeatInstanceParentModuleMismatch);
    await run("repeat instance self-parent is rejected", testRepeatInstanceSelfParentRejected);
    await run("answered response with conflicting typed values is rejected", testConflictingTypedValuesRejected);
    await run("no response without value is accepted", testNoResponseWithoutValueAccepted);
    await run("validation issues can be listed", testValidationIssuesListed);
    await run("questionnaire response unknown DTO fields are rejected", testQuestionnaireUnknownFieldsRejected);
    await run("repeat-instance mutation increments module revision", testRepeatInstanceMutationIncrementsRevision);
    await run("stale sync module revision returns conflict", testStaleSyncRevisionReturnsConflict);
    await run("successful sync module bundle increments revision once", testSuccessfulSyncBundleIncrementsOnce);
    await run("duplicate idempotent sync request does not apply twice", testDuplicateIdempotentSyncRequest);
    await run("sync request rejects module interview mismatch", testSyncModuleInterviewMismatch);
    await run("sync bootstrap returns active questionnaire versions", testSyncBootstrapQuestionnaireVersions);
    await run("sync bootstrap returns lookup sets", testSyncBootstrapLookupSets);
    await run("sync status returns current module revision", testSyncStatusReturnsModuleRevision);
    await run("technical validation issue can be created and listed", testValidationIssueCreateApi);
    await run("technical validation issue is generated for suspicious response", testTechnicalValidationIssueGeneration);
    await run("sync unknown DTO fields are rejected", testSyncUnknownFieldsRejected);
  } finally {
    await cleanup();
    await app.close();
  }
}

async function testHouseholdSurveyAreaProjectOwnership() {
  const projectA = await createProject();
  const projectB = await createProject();
  const areaA = await createSurveyArea(projectA.id);
  const response = await post("/households", { projectId: projectB.id, surveyAreaId: areaA.id });
  await expectStatus(response, 400);
}

async function testHouseholdMembershipPersonReference() {
  const household = await createHousehold();
  const response = await post(`/households/${household.id}/members`, { personId: "00000000-0000-0000-0000-000000000000" });
  await expectStatus(response, 400);
}

async function testHouseholdRelationshipLookupSet() {
  const household = await createHousehold();
  const person = await createPerson();
  const wrongLookup = await prisma.lookupValue.create({
    data: {
      code: uniqueCode("WRONG"),
      label: "Wrong lookup",
      lookupSet: { connect: { code: "CIVIL_STATUS" } }
    }
  });
  const response = await post(`/households/${household.id}/members`, { personId: person.id, relationshipLookupValueId: wrongLookup.id });
  await prisma.lookupValue.delete({ where: { id: wrongLookup.id } });
  await expectStatus(response, 400);
}

async function testDuplicateHouseholdMembership() {
  const household = await createHousehold();
  const person = await createPerson();
  const first = await post(`/households/${household.id}/members`, { personId: person.id });
  await expectStatus(first, 201);
  const membership = await first.json();
  ids.householdMemberships.push(membership.id);
  const duplicate = await post(`/households/${household.id}/members`, { personId: person.id });
  await expectStatus(duplicate, 409);
}

async function testBusinessOwnershipXor() {
  const business = await createBusiness();
  const response = await post(`/businesses/${business.id}/owners`, {});
  await expectStatus(response, 400);
}

async function testBusinessEmployeePersonReference() {
  const business = await createBusiness();
  const response = await post(`/businesses/${business.id}/employees`, { personId: "00000000-0000-0000-0000-000000000000" });
  await expectStatus(response, 400);
}

async function testLandOwnershipXor() {
  const land = await createLandParcel();
  const response = await post(`/land-parcels/${land.id}/owners`, {});
  await expectStatus(response, 400);
}

async function testStructureLandProjectOwnership() {
  const projectA = await createProject();
  const projectB = await createProject();
  const areaA = await createSurveyArea(projectA.id);
  const areaB = await createSurveyArea(projectB.id);
  const landResponse = await post("/land-parcels", { projectId: projectA.id, surveyAreaId: areaA.id });
  await expectStatus(landResponse, 201);
  const land = await landResponse.json();
  ids.landParcels.push(land.id);
  const response = await post("/structures", { landParcelId: land.id, projectId: projectB.id, surveyAreaId: areaB.id });
  await expectStatus(response, 400);
}

async function testStructureSelfAssociation() {
  const structure = await createStructure();
  const response = await post(`/structures/${structure.id}/associations`, { childStructureId: structure.id });
  await expectStatus(response, 400);
}

async function testStructureOccupancyXor() {
  const structure = await createStructure();
  const response = await post(`/structures/${structure.id}/occupancies`, {});
  await expectStatus(response, 400);
}

async function testStructureOccupancyCrossProjectHousehold() {
  const structure = await createStructure();
  const household = await createHousehold();
  const response = await post(`/structures/${structure.id}/occupancies`, { householdId: household.id });
  await expectStatus(response, 400);
}

async function testInterviewModuleContextMismatch() {
  const interview = await createInterview();
  const business = await createBusiness();
  const version = await prisma.questionnaireVersion.findFirstOrThrow({ where: { moduleType: QuestionnaireModuleType.HOUSEHOLD } });
  const response = await post(`/interviews/${interview.id}/modules`, {
    businessId: business.id,
    moduleType: QuestionnaireModuleType.HOUSEHOLD,
    questionnaireVersionId: version.id
  });
  await expectStatus(response, 400);
}

async function testQuestionnaireResponseBatchPersists() {
  const { interview, module } = await createInterviewModule();
  const repeat = await createRepeatInstance(interview.id, module.id, "household.member");

  const response = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: repeat.moduleRevision,
    responses: [
      { questionCode: "respondent.first_name", responseState: ResponseState.ANSWERED, valueText: "Juan" },
      { questionCode: "household.member.age", repeatInstanceId: repeat.id, responseState: ResponseState.ANSWERED, valueNumber: 42 }
    ]
  });

  await expectStatus(response, 200);
  const body = await response.json();
  ids.questionnaireResponses.push(...body.responses.map((item: { id: string }) => item.id));
  assert.equal(body.moduleId, module.id);
  assert.equal(body.responses.length, 2);
}

async function testQuestionnaireResponseRevisionIncrements() {
  const { interview, module } = await createInterviewModule();
  const response = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: module.revision,
    responses: [{ questionCode: "project.awareness", responseState: ResponseState.ANSWERED, valueBoolean: true }]
  });

  await expectStatus(response, 200);
  const body = await response.json();
  ids.questionnaireResponses.push(...body.responses.map((item: { id: string }) => item.id));
  assert.equal(body.revision, module.revision + 1);
}

async function testQuestionnaireResponseRevisionConflict() {
  const { interview, module } = await createInterviewModule();
  const first = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: module.revision,
    responses: [{ questionCode: "project.awareness", responseState: ResponseState.ANSWERED, valueBoolean: true }]
  });
  await expectStatus(first, 200);
  const body = await first.json();
  ids.questionnaireResponses.push(...body.responses.map((item: { id: string }) => item.id));

  const stale = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: module.revision,
    responses: [{ questionCode: "project.awareness", responseState: ResponseState.ANSWERED, valueBoolean: false }]
  });
  await expectStatus(stale, 409);
}

async function testDuplicateQuestionnaireResponseUpdates() {
  const { interview, module } = await createInterviewModule();
  const first = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: module.revision,
    responses: [{ questionCode: "respondent.first_name", responseState: ResponseState.ANSWERED, valueText: "Juan" }]
  });
  await expectStatus(first, 200);
  const firstBody = await first.json();
  ids.questionnaireResponses.push(...firstBody.responses.map((item: { id: string }) => item.id));

  const second = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: firstBody.revision,
    responses: [{ questionCode: "respondent.first_name", responseState: ResponseState.ANSWERED, valueText: "Pedro" }]
  });
  await expectStatus(second, 200);

  const fetched = await get(`/interviews/${interview.id}/modules/${module.id}/responses`);
  await expectStatus(fetched, 200);
  const responses = await fetched.json();
  assert.equal(responses.filter((item: { questionCode: string }) => item.questionCode === "respondent.first_name").length, 1);
  assert.equal(responses[0].valueText, "Pedro");
}

async function testResponseRepeatInstanceModuleMismatch() {
  const first = await createInterviewModule();
  const second = await createInterviewModule();
  const repeat = await createRepeatInstance(second.interview.id, second.module.id, "household.member");

  const response = await put(`/interviews/${first.interview.id}/modules/${first.module.id}/responses`, {
    expectedRevision: first.module.revision,
    responses: [{ questionCode: "household.member.age", repeatInstanceId: repeat.id, responseState: ResponseState.ANSWERED, valueNumber: 42 }]
  });
  await expectStatus(response, 400);
}

async function testRepeatInstanceCreation() {
  const { interview, module } = await createInterviewModule();
  const response = await post(`/interviews/${interview.id}/modules/${module.id}/repeat-instances`, { groupCode: "household.member", sequenceNumber: 1 });
  await expectStatus(response, 201);
  const repeat = await response.json();
  ids.questionnaireRepeatInstances.push(repeat.id);
  assert.equal(repeat.groupCode, "household.member");
}

async function testRepeatInstanceParentModuleMismatch() {
  const first = await createInterviewModule();
  const second = await createInterviewModule();
  const parent = await createRepeatInstance(second.interview.id, second.module.id, "household.member");

  const response = await post(`/interviews/${first.interview.id}/modules/${first.module.id}/repeat-instances`, {
    groupCode: "household.member.skill",
    parentRepeatInstanceId: parent.id
  });
  await expectStatus(response, 400);
}

async function testRepeatInstanceSelfParentRejected() {
  const { interview, module } = await createInterviewModule();
  const repeat = await createRepeatInstance(interview.id, module.id, "household.member");

  const response = await patch(`/interviews/${interview.id}/modules/${module.id}/repeat-instances/${repeat.id}`, { parentRepeatInstanceId: repeat.id });
  await expectStatus(response, 400);
}

async function testConflictingTypedValuesRejected() {
  const { interview, module } = await createInterviewModule();
  const response = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: module.revision,
    responses: [{ questionCode: "respondent.first_name", responseState: ResponseState.ANSWERED, valueNumber: 1, valueText: "Juan" }]
  });
  await expectStatus(response, 400);
}

async function testNoResponseWithoutValueAccepted() {
  const { interview, module } = await createInterviewModule();
  const response = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: module.revision,
    responses: [{ questionCode: "respondent.middle_name", responseState: ResponseState.NO_RESPONSE }]
  });
  await expectStatus(response, 200);
  const body = await response.json();
  ids.questionnaireResponses.push(...body.responses.map((item: { id: string }) => item.id));
  assert.equal(body.responses[0].responseState, ResponseState.NO_RESPONSE);
}

async function testValidationIssuesListed() {
  const { interview, module } = await createInterviewModule();
  const issue = await prisma.validationIssue.create({
    data: {
      code: "TECHNICAL_TEST",
      interviewId: interview.id,
      interviewModuleId: module.id,
      message: "Technical test issue",
      severity: ValidationSeverity.WARNING
    }
  });
  ids.validationIssues.push(issue.id);

  const response = await get(`/interviews/${interview.id}/modules/${module.id}/validation-issues`);
  await expectStatus(response, 200);
  const issues = await response.json();
  assert.equal(issues.length, 1);
  assert.equal(issues[0].code, "TECHNICAL_TEST");
}

async function testQuestionnaireUnknownFieldsRejected() {
  const { interview, module } = await createInterviewModule();
  const response = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: module.revision,
    responses: [{ questionCode: "respondent.first_name", responseState: ResponseState.ANSWERED, unexpected: "rejected", valueText: "Juan" }]
  });
  await expectStatus(response, 400);
}

async function testRepeatInstanceMutationIncrementsRevision() {
  const { interview, module } = await createInterviewModule();
  const response = await post(`/interviews/${interview.id}/modules/${module.id}/repeat-instances`, { groupCode: "household.member" });
  await expectStatus(response, 201);
  const repeat = await response.json();
  ids.questionnaireRepeatInstances.push(repeat.id);
  assert.equal(repeat.moduleRevision, module.revision + 1);
}

async function testStaleSyncRevisionReturnsConflict() {
  const { interview, module } = await createInterviewModule();
  const first = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: module.revision,
    responses: [{ questionCode: "project.awareness", responseState: ResponseState.ANSWERED, valueBoolean: true }]
  });
  await expectStatus(first, 200);

  const response = await post("/sync/interviews", {
    interviews: [{ interviewId: interview.id, modules: [{ expectedRevision: module.revision, moduleId: module.id, responses: [] }] }],
    syncRequestId: randomUUID()
  });
  await expectStatus(response, 201);
  const body = await response.json();
  ids.syncRequests.push(await latestSyncRequestId());
  assert.equal(body.results[0].status, "CONFLICT");
}

async function testSuccessfulSyncBundleIncrementsOnce() {
  const { interview, module } = await createInterviewModule();
  const repeatId = randomUUID();
  const response = await post("/sync/interviews", {
    interviews: [
      {
        interviewId: interview.id,
        modules: [
          {
            expectedRevision: module.revision,
            moduleId: module.id,
            repeatInstances: [{ groupCode: "household.member", id: repeatId, sequenceNumber: 1 }],
            responses: [
              { questionCode: "respondent.first_name", responseState: ResponseState.ANSWERED, valueText: "Juan" },
              { questionCode: "household.member.age", repeatInstanceId: repeatId, responseState: ResponseState.ANSWERED, valueNumber: 42 }
            ]
          }
        ]
      }
    ],
    syncRequestId: randomUUID()
  });
  await expectStatus(response, 201);
  const body = await response.json();
  ids.syncRequests.push(await latestSyncRequestId());
  ids.questionnaireRepeatInstances.push(repeatId);
  assert.equal(body.results[0].status, "ACCEPTED");
  assert.equal(body.results[0].revision, module.revision + 1);
}

async function testDuplicateIdempotentSyncRequest() {
  const { interview, module } = await createInterviewModule();
  const syncRequestId = randomUUID();
  const payload = {
    interviews: [{ interviewId: interview.id, modules: [{ expectedRevision: module.revision, moduleId: module.id, responses: [{ questionCode: "respondent.first_name", responseState: ResponseState.ANSWERED, valueText: "Juan" }] }] }],
    syncRequestId
  };

  const first = await post("/sync/interviews", payload);
  await expectStatus(first, 201);
  const firstBody = await first.json();

  const second = await post("/sync/interviews", payload);
  await expectStatus(second, 201);
  const secondBody = await second.json();
  ids.syncRequests.push(await latestSyncRequestId());

  const status = await get(`/sync/interviews/${interview.id}/status`);
  await expectStatus(status, 200);
  const statusBody = await status.json();
  assert.equal(firstBody.results[0].revision, secondBody.results[0].revision);
  assert.equal(statusBody.modules[0].revision, module.revision + 1);
}

async function testSyncModuleInterviewMismatch() {
  const first = await createInterviewModule();
  const second = await createInterviewModule();
  const response = await post("/sync/interviews", {
    interviews: [{ interviewId: first.interview.id, modules: [{ expectedRevision: second.module.revision, moduleId: second.module.id, responses: [] }] }],
    syncRequestId: randomUUID()
  });
  await expectStatus(response, 400);
  ids.syncRequests.push(await latestSyncRequestId());
}

async function testSyncBootstrapQuestionnaireVersions() {
  const response = await get("/sync/bootstrap");
  await expectStatus(response, 200);
  const body = await response.json();
  assert.ok(body.questionnaireVersions.some((version: { isActive: boolean }) => version.isActive));
}

async function testSyncBootstrapLookupSets() {
  const response = await get("/sync/bootstrap");
  await expectStatus(response, 200);
  const body = await response.json();
  assert.ok(body.lookupSets.length > 0);
}

async function testSyncStatusReturnsModuleRevision() {
  const { interview, module } = await createInterviewModule();
  const response = await get(`/sync/interviews/${interview.id}/status`);
  await expectStatus(response, 200);
  const body = await response.json();
  assert.equal(body.modules[0].revision, module.revision);
}

async function testValidationIssueCreateApi() {
  const { interview, module } = await createInterviewModule();
  const response = await post(`/interviews/${interview.id}/modules/${module.id}/validation-issues`, {
    code: "MANUAL_TECHNICAL_TEST",
    message: "Manual technical test issue",
    severity: ValidationSeverity.WARNING
  });
  await expectStatus(response, 201);
  const issue = await response.json();
  ids.validationIssues.push(issue.id);

  const list = await get(`/interviews/${interview.id}/modules/${module.id}/validation-issues`);
  await expectStatus(list, 200);
  const issues = await list.json();
  assert.equal(issues[0].code, "MANUAL_TECHNICAL_TEST");
}

async function testTechnicalValidationIssueGeneration() {
  const { interview, module } = await createInterviewModule();
  const response = await put(`/interviews/${interview.id}/modules/${module.id}/responses`, {
    expectedRevision: module.revision,
    responses: [{ questionCode: "respondent.first_name", responseState: ResponseState.ANSWERED }]
  });
  await expectStatus(response, 200);

  const issuesResponse = await get(`/interviews/${interview.id}/modules/${module.id}/validation-issues`);
  await expectStatus(issuesResponse, 200);
  const issues = await issuesResponse.json();
  assert.ok(issues.some((issue: { code: string }) => issue.code === "ANSWERED_WITHOUT_VALUE"));
}

async function testSyncUnknownFieldsRejected() {
  const response = await post("/sync/interviews", {
    interviews: [],
    syncRequestId: randomUUID(),
    unexpected: "rejected"
  });
  await expectStatus(response, 400);
}

async function testProjectCreation() {
  const response = await post("/projects", {
    code: uniqueCode("PROJECT"),
    name: "Phase 4A Test Project"
  });

  await expectStatus(response, 201);
  const project = await response.json();
  ids.projects.push(project.id);
  assert.equal(project.name, "Phase 4A Test Project");
}

async function testUnknownFieldsRejected() {
  const response = await post("/projects", {
    code: uniqueCode("UNKNOWN"),
    name: "Unknown Field Test",
    unexpected: "rejected"
  });

  await expectStatus(response, 400);
}

async function testSurveyAreaProjectReference() {
  const response = await post("/survey-areas", {
    name: "Invalid Survey Area",
    projectId: "00000000-0000-0000-0000-000000000000"
  });

  await expectStatus(response, 400);
}

async function testInterviewProjectReference() {
  const { person, user } = await createPersonAndUser();
  const project = await createProject();
  const surveyArea = await createSurveyArea(project.id);

  const response = await post("/interviews", {
    enumeratorUserId: user.id,
    projectId: "00000000-0000-0000-0000-000000000000",
    respondentPersonId: person.id,
    startedAt: new Date().toISOString(),
    surveyAreaId: surveyArea.id,
    surveyDate: new Date().toISOString()
  });

  await expectStatus(response, 400);
}

async function testInterviewSurveyAreaProjectOwnership() {
  const { person, user } = await createPersonAndUser();
  const projectA = await createProject();
  const projectB = await createProject();
  const surveyAreaA = await createSurveyArea(projectA.id);

  const response = await post("/interviews", {
    enumeratorUserId: user.id,
    projectId: projectB.id,
    respondentPersonId: person.id,
    startedAt: new Date().toISOString(),
    surveyAreaId: surveyAreaA.id,
    surveyDate: new Date().toISOString()
  });

  await expectStatus(response, 400);
}

async function testInterviewEnumeratorReference() {
  const project = await createProject();
  const surveyArea = await createSurveyArea(project.id);

  const response = await post("/interviews", {
    enumeratorUserId: "00000000-0000-0000-0000-000000000000",
    projectId: project.id,
    startedAt: new Date().toISOString(),
    surveyAreaId: surveyArea.id,
    surveyDate: new Date().toISOString()
  });

  await expectStatus(response, 400);
}

async function testInterviewModuleQuestionnaireVersionReference() {
  const interview = await createInterview();

  const response = await post(`/interviews/${interview.id}/modules`, {
    moduleType: QuestionnaireModuleType.HOUSEHOLD,
    questionnaireVersionId: "00000000-0000-0000-0000-000000000000"
  });

  await expectStatus(response, 400);
}

async function testInterviewModuleTypeMatch() {
  const interview = await createInterview();
  const version = await prisma.questionnaireVersion.findFirstOrThrow({
    where: { moduleType: QuestionnaireModuleType.HOUSEHOLD }
  });

  const response = await post(`/interviews/${interview.id}/modules`, {
    moduleType: QuestionnaireModuleType.BUSINESS,
    questionnaireVersionId: version.id
  });

  await expectStatus(response, 400);
}

async function createProject() {
  const response = await post("/projects", {
    code: uniqueCode("PROJECT"),
    name: "Phase 4A Test Project"
  });
  await expectStatus(response, 201);
  const project = await response.json();
  ids.projects.push(project.id);
  return project;
}

async function createSurveyArea(projectId: string) {
  const response = await post("/survey-areas", {
    name: "Phase 4A Test Area",
    projectId
  });
  await expectStatus(response, 201);
  const surveyArea = await response.json();
  ids.surveyAreas.push(surveyArea.id);
  return surveyArea;
}

async function createPersonAndUser() {
  const person = await createPerson();

  const userResponse = await post("/users", {
    displayName: "Phase 4A Enumerator",
    email: `${uniqueCode("enumerator").toLowerCase()}@example.test`
  });
  await expectStatus(userResponse, 201);
  const user = await userResponse.json();
  ids.users.push(user.id);

  return { person, user };
}

async function createPerson() {
  const response = await post("/persons", { firstName: "Phase", lastName: "Respondent" });
  await expectStatus(response, 201);
  const person = await response.json();
  ids.persons.push(person.id);
  return person;
}

async function createHousehold() {
  const project = await createProject();
  const surveyArea = await createSurveyArea(project.id);
  const response = await post("/households", { projectId: project.id, surveyAreaId: surveyArea.id });
  await expectStatus(response, 201);
  const household = await response.json();
  ids.households.push(household.id);
  return household;
}

async function createBusiness() {
  const project = await createProject();
  const surveyArea = await createSurveyArea(project.id);
  const response = await post("/businesses", { name: "Phase Business", projectId: project.id, surveyAreaId: surveyArea.id });
  await expectStatus(response, 201);
  const business = await response.json();
  ids.businesses.push(business.id);
  return business;
}

async function createLandParcel() {
  const project = await createProject();
  const surveyArea = await createSurveyArea(project.id);
  const response = await post("/land-parcels", { projectId: project.id, surveyAreaId: surveyArea.id });
  await expectStatus(response, 201);
  const land = await response.json();
  ids.landParcels.push(land.id);
  return land;
}

async function createStructure() {
  const project = await createProject();
  const surveyArea = await createSurveyArea(project.id);
  const response = await post("/structures", { projectId: project.id, surveyAreaId: surveyArea.id });
  await expectStatus(response, 201);
  const structure = await response.json();
  ids.structures.push(structure.id);
  return structure;
}

async function createInterview() {
  const { person, user } = await createPersonAndUser();
  const project = await createProject();
  const surveyArea = await createSurveyArea(project.id);

  const response = await post("/interviews", {
    enumeratorUserId: user.id,
    projectId: project.id,
    respondentPersonId: person.id,
    startedAt: new Date().toISOString(),
    surveyAreaId: surveyArea.id,
    surveyDate: new Date().toISOString()
  });
  await expectStatus(response, 201);
  const interview = await response.json();
  ids.interviews.push(interview.id);
  return interview;
}

async function createInterviewModule() {
  const interview = await createInterview();
  const version = await prisma.questionnaireVersion.findFirstOrThrow({ where: { moduleType: QuestionnaireModuleType.HOUSEHOLD } });
  const response = await post(`/interviews/${interview.id}/modules`, {
    moduleType: QuestionnaireModuleType.HOUSEHOLD,
    questionnaireVersionId: version.id
  });
  await expectStatus(response, 201);
  const module = await response.json();
  ids.interviewModules.push(module.id);
  return { interview, module };
}

async function createRepeatInstance(interviewId: string, moduleId: string, groupCode: string) {
  const response = await post(`/interviews/${interviewId}/modules/${moduleId}/repeat-instances`, { groupCode });
  await expectStatus(response, 201);
  const repeat = await response.json();
  ids.questionnaireRepeatInstances.push(repeat.id);
  return repeat;
}

async function latestSyncRequestId() {
  const receipt = await prisma.syncRequest.findFirstOrThrow({ orderBy: { createdAt: "desc" } });
  return receipt.id;
}

async function cleanup() {
  await prisma.syncRequest.deleteMany({ where: { id: { in: ids.syncRequests } } });
  await prisma.validationIssue.deleteMany({ where: { OR: [{ id: { in: ids.validationIssues } }, { interviewModuleId: { in: ids.interviewModules } }] } });
  await prisma.questionnaireResponse.deleteMany({ where: { OR: [{ id: { in: ids.questionnaireResponses } }, { interviewModuleId: { in: ids.interviewModules } }] } });
  await prisma.questionnaireRepeatInstance.deleteMany({ where: { OR: [{ id: { in: ids.questionnaireRepeatInstances } }, { interviewModuleId: { in: ids.interviewModules } }] } });
  await prisma.structureOccupancy.deleteMany({ where: { id: { in: ids.structureOccupancies } } });
  await prisma.structureAssociation.deleteMany({ where: { id: { in: ids.structureAssociations } } });
  await prisma.structureTag.deleteMany({ where: { id: { in: ids.structureTags } } });
  await prisma.interviewModule.deleteMany({ where: { interviewId: { in: ids.interviews } } });
  await prisma.interview.deleteMany({ where: { id: { in: ids.interviews } } });
  await prisma.businessEmployee.deleteMany({ where: { id: { in: ids.businessEmployees } } });
  await prisma.businessOwnership.deleteMany({ where: { id: { in: ids.businessOwnerships } } });
  await prisma.landOwnership.deleteMany({ where: { id: { in: ids.landOwnerships } } });
  await prisma.householdMembership.deleteMany({ where: { id: { in: ids.householdMemberships } } });
  await prisma.structure.deleteMany({ where: { id: { in: ids.structures } } });
  await prisma.business.deleteMany({ where: { id: { in: ids.businesses } } });
  await prisma.landParcel.deleteMany({ where: { id: { in: ids.landParcels } } });
  await prisma.household.deleteMany({ where: { id: { in: ids.households } } });
  await prisma.surveyArea.deleteMany({ where: { id: { in: ids.surveyAreas } } });
  await prisma.project.deleteMany({ where: { id: { in: ids.projects } } });
  await prisma.organization.deleteMany({ where: { id: { in: ids.organizations } } });
  await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
  await prisma.person.deleteMany({ where: { id: { in: ids.persons } } });
}

async function run(name: string, testFn: () => Promise<void>) {
  await testFn();
  console.log(`ok - ${name}`);
}

function post(path: string, body: unknown) {
  return fetch(`${baseUrl}${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
}

function put(path: string, body: unknown) {
  return fetch(`${baseUrl}${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "PUT"
  });
}

function patch(path: string, body: unknown) {
  return fetch(`${baseUrl}${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "PATCH"
  });
}

function get(path: string) {
  return fetch(`${baseUrl}${path}`);
}

async function expectStatus(response: Response, expectedStatus: number) {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    assert.equal(response.status, expectedStatus, body);
  }
}

function uniqueCode(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
