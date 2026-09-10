import { ResponseState } from "../types/offline";
import { CompletionState, ModuleTriggerOutcome, QuestionDefinition, QuestionRule, QuestionnaireDefinition, RepeatGroupDefinition, SectionDefinition } from "./types";

export type ResponseValue = string | number | boolean | string[] | null;

export interface RuntimeResponse {
  questionCode: string;
  repeatInstanceId?: string | null;
  responseState: ResponseState;
  value: ResponseValue;
}

export interface ValidationMessage {
  code: string;
  message: string;
  severity: "WARNING" | "ERROR" | "BLOCKING_ERROR";
  repeatInstanceId?: string | null;
}

export interface RepeatInstanceRuntime {
  id: string;
  groupCode: string;
  sequenceNumber?: number | null;
  localSyncStatus?: string | null;
}

export interface ModuleTriggerResult {
  message: string;
  outcome: ModuleTriggerOutcome;
  questionCode: string;
  repeatInstanceId?: string | null;
  targetModuleType: string;
}

export function responseKey(questionCode: string, repeatInstanceId?: string | null) {
  return `${repeatInstanceId ?? "root"}:${questionCode}`;
}

export function indexResponses(responses: RuntimeResponse[]) {
  return new Map(responses.map((response) => [responseKey(response.questionCode, response.repeatInstanceId), response]));
}

export function getResponseValue(responses: Map<string, RuntimeResponse>, questionCode: string, repeatInstanceId?: string | null): ResponseValue {
  return responses.get(responseKey(questionCode, repeatInstanceId))?.value ?? null;
}

export function isQuestionVisible(question: QuestionDefinition, responses: Map<string, RuntimeResponse>, repeatInstanceId?: string | null) {
  const rules = question.rules ?? [];
  for (const rule of rules) {
    if (rule.effect === "SHOW_IF" && !evaluateRule(rule, responses, repeatInstanceId)) return false;
    if (rule.effect === "HIDE_IF" && evaluateRule(rule, responses, repeatInstanceId)) return false;
  }
  return true;
}

export function isQuestionRequired(question: QuestionDefinition, responses: Map<string, RuntimeResponse>, repeatInstanceId?: string | null) {
  if (!isQuestionVisible(question, responses, repeatInstanceId)) return false;
  const requireRules = (question.rules ?? []).filter((rule) => rule.effect === "REQUIRE_IF");
  return Boolean(question.required) || requireRules.some((rule) => evaluateRule(rule, responses, repeatInstanceId));
}

export function evaluateRule(rule: QuestionRule, responses: Map<string, RuntimeResponse>, repeatInstanceId?: string | null) {
  const value = getResponseValue(responses, rule.questionCode, repeatInstanceId);
  switch (rule.operator) {
    case "EQUALS":
      return value === rule.value;
    case "NOT_EQUALS":
      return value !== rule.value;
    case "IN":
      return Array.isArray(rule.value) && rule.value.includes(String(value));
    case "NOT_EMPTY":
      return !isEmptyValue(value);
    case "EMPTY":
      return isEmptyValue(value);
  }
}

export function validateQuestion(question: QuestionDefinition, responses: Map<string, RuntimeResponse>, repeatInstanceId?: string | null): ValidationMessage[] {
  if (!isQuestionVisible(question, responses, repeatInstanceId) || question.type === "STATIC_TEXT") return [];
  const response = responses.get(responseKey(question.code, repeatInstanceId));
  const value = response?.value ?? null;
  const messages: ValidationMessage[] = [];

  if (isQuestionRequired(question, responses, repeatInstanceId) && (response?.responseState === undefined || response.responseState === "MISSING" || isEmptyValue(value))) {
    messages.push({ code: question.code, message: `${question.shortLabel ?? question.label} is required.`, repeatInstanceId, severity: "ERROR" });
  }

  if (response?.responseState === "ANSWERED" && !isEmptyValue(value)) {
    if ((question.type === "INTEGER" || question.type === "DECIMAL" || question.type === "MONEY") && typeof value !== "number") messages.push({ code: question.code, message: `${question.shortLabel ?? question.label} must be numeric.`, repeatInstanceId, severity: "ERROR" });
    if ((question.type === "DATE" || question.type === "TIME") && typeof value !== "string") messages.push({ code: question.code, message: `${question.shortLabel ?? question.label} has an invalid date/time value.`, repeatInstanceId, severity: "ERROR" });
    if ((question.type === "SINGLE_SELECT" || question.type === "MULTI_SELECT") && question.options?.length) {
      const allowed = new Set(question.options.map((option) => option.value));
      const values = Array.isArray(value) ? value : [String(value)];
      if (values.some((candidate) => !allowed.has(candidate))) messages.push({ code: question.code, message: `${question.shortLabel ?? question.label} has an unsupported option.`, repeatInstanceId, severity: "ERROR" });
    }
  }

  for (const rule of question.validationRules ?? []) {
    if (isEmptyValue(value) || typeof value !== "number") continue;
    if (rule.type === "MIN" && rule.value !== undefined && value < rule.value) messages.push({ code: question.code, message: rule.message, repeatInstanceId, severity: rule.severity ?? "ERROR" });
    if (rule.type === "MAX" && rule.value !== undefined && value > rule.value) messages.push({ code: question.code, message: rule.message, repeatInstanceId, severity: rule.severity ?? "ERROR" });
  }

  return messages;
}

export function calculateCompletion(definition: QuestionnaireDefinition, responses: RuntimeResponse[], repeatInstances: RepeatInstanceRuntime[] = []): { answeredCount: number; completionState: CompletionState; messages: ValidationMessage[]; requiredMissingCount: number; warningCount: number } {
  const responseMap = indexResponses(responses);
  const messages: ValidationMessage[] = [];
  for (const section of definition.sections) {
    for (const question of section.questions) messages.push(...validateQuestion(question, responseMap));
  }
  for (const repeatGroup of definition.repeatGroups) {
    const instances = repeatInstances.filter((instance) => instance.groupCode === repeatGroup.code);
    for (const instance of instances) {
      for (const question of repeatGroup.questions) messages.push(...validateQuestion(question, responseMap, instance.id));
    }
  }
  messages.push(...validateBirthdateAgePairs(responseMap, responses));
  messages.push(...validateBusinessEmployeeTotals(definition, responseMap, repeatInstances));

  const answeredCount = responses.filter((response) => response.responseState === "ANSWERED" && !isEmptyValue(response.value)).length;
  const requiredMissingCount = messages.filter((message) => message.severity === "ERROR").length;
  const warningCount = messages.filter((message) => message.severity === "WARNING").length;
  const blockingCount = messages.filter((message) => message.severity === "BLOCKING_ERROR").length;
  let completionState: CompletionState = "NOT_STARTED";
  if (blockingCount > 0) completionState = "BLOCKED";
  else if (answeredCount === 0) completionState = "NOT_STARTED";
  else if (requiredMissingCount > 0) completionState = "IN_PROGRESS";
  else if (warningCount > 0) completionState = "COMPLETE_WITH_WARNINGS";
  else completionState = "COMPLETE";

  return { answeredCount, completionState, messages, requiredMissingCount, warningCount };
}

export function evaluateModuleTriggers(definition: QuestionnaireDefinition, responses: RuntimeResponse[], existingModuleTypes: string[] = []): ModuleTriggerResult[] {
  const results: ModuleTriggerResult[] = [];
  const existing = new Set(existingModuleTypes);
  for (const question of getAllQuestions(definition)) {
    for (const trigger of question.moduleTriggers ?? []) {
      const matchingResponses = responses.filter((response) => response.questionCode === question.code && response.responseState === "ANSWERED" && (trigger.value === undefined || response.value === trigger.value));
      for (const response of matchingResponses) {
        results.push({ message: existing.has(trigger.moduleType) ? `${trigger.message} Existing ${trigger.moduleType} module is available.` : trigger.message, outcome: trigger.outcome, questionCode: question.code, repeatInstanceId: response.repeatInstanceId, targetModuleType: trigger.moduleType });
      }
    }
  }
  return results;
}

export function getAllQuestions(definition: QuestionnaireDefinition) {
  return [...definition.sections.flatMap((section) => section.questions), ...definition.repeatGroups.flatMap((group) => group.questions)];
}

export function assertUniqueQuestionCodes(definition: QuestionnaireDefinition) {
  const codes = getAllQuestions(definition).map((question) => question.code);
  const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
  if (duplicates.length > 0) throw new Error(`Duplicate question code(s): ${[...new Set(duplicates)].join(", ")}`);
}

export function assertDefinitionIntegrity(definition: QuestionnaireDefinition) {
  assertUniqueQuestionCodes(definition);
  const questionCodes = new Set(getAllQuestions(definition).map((question) => question.code));
  const repeatGroupCodes = definition.repeatGroups.map((group) => group.code);
  const duplicateRepeatGroups = repeatGroupCodes.filter((code, index) => repeatGroupCodes.indexOf(code) !== index);
  if (duplicateRepeatGroups.length > 0) throw new Error(`Duplicate repeat group code(s): ${[...new Set(duplicateRepeatGroups)].join(", ")}`);

  const expectedPrefix = definition.moduleType.toLowerCase();
  for (const question of getAllQuestions(definition)) {
    if (!question.code.startsWith(`${expectedPrefix}.`)) throw new Error(`${definition.id} question ${question.code} does not use ${expectedPrefix} module prefix`);
    for (const rule of question.rules ?? []) {
      if (!questionCodes.has(rule.questionCode)) throw new Error(`${definition.id} rule references unknown question ${rule.questionCode}`);
    }
    if (question.optionSource?.type === "LOOKUP_SET" && !question.optionSource.lookupSetCode) throw new Error(`${definition.id} question ${question.code} has LOOKUP_SET without lookupSetCode`);
    if (question.optionSource?.type === "INLINE_OPTIONS" && (!question.options || question.options.length === 0)) throw new Error(`${definition.id} question ${question.code} has INLINE_OPTIONS without options`);
    if (question.repeatGroup && !repeatGroupCodes.includes(question.repeatGroup)) throw new Error(`${definition.id} question ${question.code} references unknown repeat group ${question.repeatGroup}`);
  }
  for (const section of definition.sections) {
    if (section.repeatGroupCode && !repeatGroupCodes.includes(section.repeatGroupCode)) throw new Error(`${definition.id} section ${section.code} references unknown repeat group ${section.repeatGroupCode}`);
  }
}

export function isRepeatDeletionAllowed(instance: RepeatInstanceRuntime) {
  return instance.localSyncStatus === "LOCAL_ONLY" || instance.localSyncStatus === undefined || instance.localSyncStatus === null;
}

export function getVisibleQuestions(section: SectionDefinition, responses: Map<string, RuntimeResponse>) {
  return section.questions.filter((question) => isQuestionVisible(question, responses));
}

export function getRepeatGroup(definition: QuestionnaireDefinition, groupCode: string): RepeatGroupDefinition {
  const group = definition.repeatGroups.find((candidate) => candidate.code === groupCode);
  if (!group) throw new Error(`Unknown repeat group: ${groupCode}`);
  return group;
}

function isEmptyValue(value: ResponseValue) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function validateBirthdateAgePairs(responses: Map<string, RuntimeResponse>, allResponses: RuntimeResponse[]): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  for (const response of allResponses) {
    if (!response.questionCode.endsWith(".birth_date") || typeof response.value !== "string") continue;
    const prefix = response.questionCode.slice(0, -".birth_date".length);
    const age = responses.get(responseKey(`${prefix}.age`, response.repeatInstanceId))?.value;
    if (typeof age !== "number") continue;
    const birthYear = Number(response.value.slice(0, 4));
    if (!Number.isFinite(birthYear)) continue;
    const approximateAge = new Date().getFullYear() - birthYear;
    if (Math.abs(approximateAge - age) > 1) messages.push({ code: response.questionCode, message: "Birthdate and age appear inconsistent; verify the source response.", repeatInstanceId: response.repeatInstanceId, severity: "WARNING" });
  }
  return messages;
}

function validateBusinessEmployeeTotals(definition: QuestionnaireDefinition, responses: Map<string, RuntimeResponse>, repeatInstances: RepeatInstanceRuntime[]): ValidationMessage[] {
  if (definition.moduleType !== "BUSINESS") return [];
  const employeeInstances = repeatInstances.filter((instance) => instance.groupCode === "business.employees");
  const maleTotal = responses.get(responseKey("business.employees.total_male"))?.value;
  const femaleTotal = responses.get(responseKey("business.employees.total_female"))?.value;
  const counted = employeeInstances.reduce(
    (acc, instance) => {
      const gender = responses.get(responseKey("business.employees.gender", instance.id))?.value;
      if (gender === "MALE") acc.male += 1;
      if (gender === "FEMALE") acc.female += 1;
      return acc;
    },
    { female: 0, male: 0 }
  );
  const messages: ValidationMessage[] = [];
  if (typeof maleTotal === "number" && maleTotal !== counted.male) messages.push({ code: "business.employees.total_male", message: "Captured male employee total does not match employee rows; verify without overwriting source answers.", severity: "WARNING" });
  if (typeof femaleTotal === "number" && femaleTotal !== counted.female) messages.push({ code: "business.employees.total_female", message: "Captured female employee total does not match employee rows; verify without overwriting source answers.", severity: "WARNING" });
  return messages;
}
