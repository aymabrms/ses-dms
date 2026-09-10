import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { QuestionnaireModuleType } from "@prisma/client";
import * as assert from "node:assert/strict";
import { AddressInfo } from "node:net";

import { AppModule } from "./app.module";
import { createValidationPipe } from "./app-validation";
import { PrismaService } from "./prisma/prisma.service";

const ids = {
  interviews: [] as string[],
  persons: [] as string[],
  projects: [] as string[],
  surveyAreas: [] as string[],
  users: [] as string[]
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
  } finally {
    await cleanup();
    await app.close();
  }
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
  const personResponse = await post("/persons", {
    firstName: "Phase",
    lastName: "Respondent"
  });
  await expectStatus(personResponse, 201);
  const person = await personResponse.json();
  ids.persons.push(person.id);

  const userResponse = await post("/users", {
    displayName: "Phase 4A Enumerator",
    email: `${uniqueCode("enumerator").toLowerCase()}@example.test`
  });
  await expectStatus(userResponse, 201);
  const user = await userResponse.json();
  ids.users.push(user.id);

  return { person, user };
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

async function cleanup() {
  await prisma.interviewModule.deleteMany({ where: { interviewId: { in: ids.interviews } } });
  await prisma.interview.deleteMany({ where: { id: { in: ids.interviews } } });
  await prisma.surveyArea.deleteMany({ where: { id: { in: ids.surveyAreas } } });
  await prisma.project.deleteMany({ where: { id: { in: ids.projects } } });
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
