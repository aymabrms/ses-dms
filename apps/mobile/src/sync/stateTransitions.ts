import { LocalSyncStatus, OutboxStatus, SyncModuleResult } from "../types/offline";

export type SyncOutcome =
  | { kind: "ACCEPTED"; moduleStatus: LocalSyncStatus; outboxStatus: OutboxStatus; serverRevision: number }
  | { kind: "CONFLICT"; moduleStatus: LocalSyncStatus; outboxStatus: OutboxStatus; currentRevision: number; message: string };

export function deriveSyncOutcome(result: SyncModuleResult): SyncOutcome {
  if (result.status === "ACCEPTED") {
    return { kind: "ACCEPTED", moduleStatus: "SYNCED", outboxStatus: "COMPLETED", serverRevision: result.revision };
  }

  return {
    currentRevision: result.currentRevision,
    kind: "CONFLICT",
    message: `Server revision is ${result.currentRevision}; local changes were not applied.`,
    moduleStatus: "CONFLICT",
    outboxStatus: "CONFLICT"
  };
}

export function deriveFailureState() {
  return { moduleStatus: "SYNC_FAILED" as LocalSyncStatus, outboxStatus: "SYNC_FAILED" as OutboxStatus };
}
