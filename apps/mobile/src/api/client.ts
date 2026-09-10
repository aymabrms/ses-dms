import { BootstrapPayload } from "../types/offline";

type ExpoProcess = { env?: Record<string, string | undefined> };

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
  const response = await fetch(`${getApiBaseUrl()}/sync/bootstrap${query}`);
  if (!response.ok) {
    throw new Error(`Bootstrap request failed: ${response.status}`);
  }
  return (await response.json()) as BootstrapPayload;
}
