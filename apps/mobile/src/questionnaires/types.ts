import { QuestionnaireModuleType, ResponseState } from "../types/offline";

export type FieldType = "TEXT" | "TEXTAREA" | "INTEGER" | "DECIMAL" | "DATE" | "TIME" | "BOOLEAN" | "SINGLE_SELECT" | "MULTI_SELECT" | "MONEY" | "STATIC_TEXT";
export type RuleOperator = "EQUALS" | "NOT_EQUALS" | "IN" | "NOT_EMPTY" | "EMPTY";
export type RuleEffect = "SHOW_IF" | "HIDE_IF" | "REQUIRE_IF";
export type OptionSourceType = "INLINE_OPTIONS" | "LOOKUP_SET";
export type CompletionState = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE_WITH_WARNINGS" | "COMPLETE" | "BLOCKED";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface OptionSource {
  type: OptionSourceType;
  lookupSetCode?: string;
}

export interface QuestionRule {
  effect: RuleEffect;
  questionCode: string;
  operator: RuleOperator;
  value?: string | number | boolean | string[];
}

export interface ValidationRule {
  type: "MIN" | "MAX" | "DATE_NOT_FUTURE";
  value?: number;
  severity?: "WARNING" | "ERROR" | "BLOCKING_ERROR";
  message: string;
}

export interface DomainMapping {
  target: "NORMALIZED" | "RELATIONSHIP" | "BOTH" | "RESPONSE_ONLY" | "UNRESOLVED";
  entity?: string;
  field?: string;
}

export interface ReportingMapping {
  topic: string;
  category?: string;
}

export interface QuestionDefinition {
  code: string;
  label: string;
  shortLabel?: string;
  helpText?: string;
  type: FieldType;
  required?: boolean;
  responseStates?: ResponseState[];
  options?: QuestionOption[];
  optionSource?: OptionSource;
  rules?: QuestionRule[];
  validationRules?: ValidationRule[];
  repeatGroup?: string;
  domainMapping?: DomainMapping;
  reportingMapping?: ReportingMapping;
  triggerRecommendation?: { moduleType: QuestionnaireModuleType; message: string; level: "RECOMMENDED" | "OPTIONAL" };
  sourceSection?: string;
  sourceText?: string;
}

export interface SectionDefinition {
  code: string;
  title: string;
  description?: string;
  repeatGroupCode?: string;
  questions: QuestionDefinition[];
}

export interface RepeatGroupDefinition {
  code: string;
  title: string;
  minOccurrences?: number;
  maxOccurrences?: number;
  linkedDomainEntity?: string;
  orderMatters?: boolean;
  questions: QuestionDefinition[];
}

export interface QuestionnaireDefinition {
  id: string;
  moduleType: QuestionnaireModuleType;
  versionCode: string;
  title: string;
  sourceQuestionnaire: string;
  sourceVersion: string;
  sections: SectionDefinition[];
  repeatGroups: RepeatGroupDefinition[];
  deferredSections: string[];
}
