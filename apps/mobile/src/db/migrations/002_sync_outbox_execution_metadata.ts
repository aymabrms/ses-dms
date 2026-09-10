export const migration002SyncOutboxExecutionMetadata = `
ALTER TABLE sync_outbox ADD COLUMN sync_request_id TEXT;
ALTER TABLE sync_outbox ADD COLUMN completed_at TEXT;
ALTER TABLE sync_outbox ADD COLUMN server_revision_received INTEGER;
ALTER TABLE sync_outbox ADD COLUMN last_http_status INTEGER;
`;
