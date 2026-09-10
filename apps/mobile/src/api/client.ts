import { BootstrapPayload, RemoteInterviewStatus, SyncInterviewsResponse, SyncModuleRequestPayload } from "../types/offline";

type ExpoProcess = { env?: Record<string, string | undefined> };

export class ApiError extends Error {
  constructor(message: string, readonly status?: number, readonly responseBody?: string) {
    super(message);
  }
}

function getApiBaseUrl() {
  const maybeProcess = (globalThis as { process?: ExpoProcess }).process;
  const url = maybeProcess?.env?.EXPO_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
  }
  return url.replace(/\/$/, "");
}

export async function fetchBootstrap(projectId?: string) {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  return getJson<BootstrapPayload>(`/sync/bootstrap${query}`);
}

export function postSyncInterviews(payload: SyncModuleRequestPayload) {
  return postJson<SyncInterviewsResponse>("/sync/interviews", payload);
}

export function fetchRemoteInterviewStatus(interviewId: string) {
  return getJson<RemoteInterviewStatus>(`/sync/interviews/${encodeURIComponent(interviewId)}/status`);
}

async function getJson<T>(path: string, timeoutMs = 15000) {
  return requestJson<T>(path, { method: "GET" }, timeoutMs);
}

async function postJson<T>(path: string, body: unknown, timeoutMs = 15000) {
  return requestJson<T>(
    path,
    {
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
      method: "POST"
    },
    timeoutMs
  );
}

async function requestJson<T>(path: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status, text);
    }

    return (text ? JSON.parse(text) : {}) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out");
    }
    throw new ApiError(error instanceof Error ? error.message : "Network request failed");
  } finally {
    clearTimeout(timeout);
  }
}
