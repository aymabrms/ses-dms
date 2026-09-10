export type QuestionnaireModuleType = "HOUSEHOLD" | "BUSINESS" | "LANDOWNER";

export type ResponseState = "ANSWERED" | "NO_RESPONSE" | "NOT_APPLICABLE" | "UNKNOWN" | "MISSING" | "REQUIRES_VALIDATION";

export type LocalSyncStatus = "LOCAL_ONLY" | "DIRTY" | "READY_TO_SYNC" | "SYNCING" | "SYNCED" | "SYNC_FAILED" | "CONFLICT" | "NEEDS_RESYNC";

export type OutboxStatus = "PENDING" | "SYNCING" | "SYNC_FAILED" | "CONFLICT" | "COMPLETED";

export type OutboxOperation = "UPSERT" | "SYNC_MODULE";

export interface BootstrapPayload {
  projects: Array<{ id: string; code: string; name: string; description?: string | null; createdAt?: string; updatedAt?: string }>;
  surveyAreas: Array<{ id: string; projectId: string; code?: string | null; name: string; createdAt?: string; updatedAt?: string }>;
  questionnaireVersions: Array<{
    id: string;
    projectId?: string | null;
    moduleType: QuestionnaireModuleType;
    versionCode: string;
    title: string;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
  }>;
  lookupSets: Array<{ id: string; code: string; name: string; createdAt?: string; updatedAt?: string }>;
  lookupValues: Array<{ id: string; lookupSetId: string; code: string; label: string; sortOrder: number; isActive: boolean; createdAt?: string; updatedAt?: string }>;
}

export interface CreateLocalInterviewInput {
  projectId: string;
  surveyAreaId: string;
  enumeratorUserId?: string | null;
  respondentPersonId?: string | null;
  surveyDate?: string;
  startedAt?: string;
}

export interface CreateLocalInterviewModuleInput {
  interviewId: string;
  questionnaireVersionId: string;
  moduleType: QuestionnaireModuleType;
  householdId?: string | null;
  businessId?: string | null;
  landParcelId?: string | null;
  structureId?: string | null;
}

export interface CreateLocalRepeatInstanceInput {
  interviewModuleId: string;
  groupCode: string;
  parentRepeatInstanceId?: string | null;
  sequenceNumber?: number | null;
  linkedPersonId?: string | null;
  linkedHouseholdMembershipId?: string | null;
  linkedBusinessEmployeeId?: string | null;
  linkedStructureId?: string | null;
}

export interface UpsertLocalResponseInput {
  id?: string;
  interviewModuleId: string;
  questionCode: string;
  repeatInstanceId?: string | null;
  responseState: ResponseState;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: string | null;
  valueJson?: unknown;
  rawValue?: string | null;
  capturedAt?: string | null;
}

export interface SyncModuleRequestPayload {
  syncRequestId: string;
  interviews: Array<{
    interviewId?: string;
    interview?: {
      id: string;
      projectId: string;
      surveyAreaId: string;
      enumeratorUserId: string;
      respondentPersonId?: string | null;
      surveyDate: string;
      startedAt: string;
      finishedAt?: string | null;
    };
    persons?: Array<Record<string, unknown>>;
    households?: Array<Record<string, unknown>>;
    householdMemberships?: Array<Record<string, unknown>>;
    businesses?: Array<Record<string, unknown>>;
    businessEmployees?: Array<Record<string, unknown>>;
    landParcels?: Array<Record<string, unknown>>;
    structures?: Array<Record<string, unknown>>;
    modules: Array<{
      moduleId: string;
      expectedRevision: number;
      moduleType?: QuestionnaireModuleType;
      questionnaireVersionId?: string;
      householdId?: string | null;
      businessId?: string | null;
      landParcelId?: string | null;
      structureId?: string | null;
      repeatInstances: Array<{
        id: string;
        groupCode: string;
        parentRepeatInstanceId?: string | null;
        sequenceNumber?: number | null;
        linkedPersonId?: string | null;
        linkedHouseholdMembershipId?: string | null;
        linkedBusinessEmployeeId?: string | null;
        linkedStructureId?: string | null;
      }>;
      responses: Array<{
        id?: string;
        questionCode: string;
        repeatInstanceId?: string | null;
        responseState: ResponseState;
        valueText?: string | null;
        valueNumber?: number | null;
        valueBoolean?: boolean | null;
        valueDate?: string | null;
        valueJson?: Record<string, unknown> | null;
        rawValue?: string | null;
        capturedAt?: string | null;
      }>;
    }>;
  }>;
}

export type SyncModuleResult =
  | { interviewId: string; moduleId: string; status: "ACCEPTED"; revision: number }
  | { interviewId: string; moduleId: string; status: "CONFLICT"; currentRevision: number }
  | { interviewId: string; status: "REJECTED"; message: string };

export interface SyncInterviewsResponse {
  results: SyncModuleResult[];
}

export interface RemoteInterviewStatus {
  interviewId: string;
  status: string;
  modules: Array<{
    moduleId: string;
    moduleStatus: string;
    moduleType: QuestionnaireModuleType;
    revision: number;
    validationIssueCount: number;
  }>;
}
