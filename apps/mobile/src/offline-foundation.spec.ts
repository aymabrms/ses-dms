import { buildModuleSyncOutboxPayload } from "./sync/outboxPayload";
import { LOCAL_SYNC_STATUSES, NEVER_SYNCED_MODULE_REVISION, RESPONSE_STATES } from "./types/constants";

function main() {
  assertJsonEqual(RESPONSE_STATES, ["ANSWERED", "NO_RESPONSE", "NOT_APPLICABLE", "UNKNOWN", "MISSING", "REQUIRES_VALIDATION"]);
  assertJsonEqual(LOCAL_SYNC_STATUSES, ["LOCAL_ONLY", "DIRTY", "READY_TO_SYNC", "SYNCING", "SYNCED", "SYNC_FAILED", "CONFLICT", "NEEDS_RESYNC"]);
  assertJsonEqual(NEVER_SYNCED_MODULE_REVISION, 0);
  assertJsonEqual(buildModuleSyncOutboxPayload("module-1"), { moduleId: "module-1" });
  console.log("ok - mobile offline foundation pure checks");
}

function assertJsonEqual(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Assertion failed. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

main();
