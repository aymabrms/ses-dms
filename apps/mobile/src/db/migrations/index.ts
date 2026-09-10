import { migration001InitialOfflineSchema } from "./001_initial_offline_schema";
import { migration002SyncOutboxExecutionMetadata } from "./002_sync_outbox_execution_metadata";

export interface LocalMigration {
  version: number;
  sql: string;
  columns?: Array<{ table: string; name: string; definition: string }>;
}

export const localMigrations: LocalMigration[] = [
  { version: 1, sql: migration001InitialOfflineSchema },
  {
    columns: [
      { definition: "TEXT", name: "sync_request_id", table: "sync_outbox" },
      { definition: "TEXT", name: "completed_at", table: "sync_outbox" },
      { definition: "INTEGER", name: "server_revision_received", table: "sync_outbox" },
      { definition: "INTEGER", name: "last_http_status", table: "sync_outbox" }
    ],
    sql: migration002SyncOutboxExecutionMetadata,
    version: 2
  }
];
