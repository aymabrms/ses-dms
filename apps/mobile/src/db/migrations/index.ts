import { migration001InitialOfflineSchema } from "./001_initial_offline_schema";

export interface LocalMigration {
  version: number;
  sql: string;
}

export const localMigrations: LocalMigration[] = [{ version: 1, sql: migration001InitialOfflineSchema }];
