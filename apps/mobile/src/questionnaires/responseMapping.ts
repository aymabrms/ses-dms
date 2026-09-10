import { ResponseState, UpsertLocalResponseInput } from "../types/offline";
import { FieldType } from "./types";

export function buildResponseInput(moduleId: string, questionCode: string, fieldType: FieldType, value: unknown, responseState: ResponseState, repeatInstanceId?: string | null): UpsertLocalResponseInput {
  const input: UpsertLocalResponseInput = { interviewModuleId: moduleId, questionCode, repeatInstanceId: repeatInstanceId ?? null, responseState };
  if (responseState !== "ANSWERED" && responseState !== "REQUIRES_VALIDATION") return input;
  if (value === null || value === undefined || value === "") return input;
  if (fieldType === "INTEGER" || fieldType === "DECIMAL" || fieldType === "MONEY") input.valueNumber = typeof value === "number" ? value : Number(value);
  else if (fieldType === "BOOLEAN") input.valueBoolean = Boolean(value);
  else if (fieldType === "DATE" || fieldType === "TIME") input.valueDate = String(value);
  else if (fieldType === "MULTI_SELECT") input.valueJson = Array.isArray(value) ? value : [String(value)];
  else input.valueText = String(value);
  return input;
}
