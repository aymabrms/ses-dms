import { QuestionnaireModuleType } from "../types/offline";
import { household20220525V1 } from "./definitions/household-20220525-v1";
import { QuestionnaireDefinition } from "./types";

const definitions = [household20220525V1];

export function getQuestionnaireDefinition(moduleType: QuestionnaireModuleType, versionCode: string): QuestionnaireDefinition {
  const definition = definitions.find((candidate) => candidate.moduleType === moduleType && candidate.versionCode === versionCode);
  if (!definition) throw new Error(`No bundled questionnaire definition for ${moduleType} ${versionCode}`);
  return definition;
}

export function listQuestionnaireDefinitions() {
  return definitions;
}
