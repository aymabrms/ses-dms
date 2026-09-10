import { fetchBootstrap } from "../api/client";
import { getDatabase, initializeDatabase } from "../db/database";
import { importBootstrapData } from "../db/repositories/referenceRepository";

export async function downloadAndImportBootstrap(projectId?: string) {
  await initializeDatabase();
  const db = await getDatabase();
  const payload = await fetchBootstrap(projectId);
  await importBootstrapData(db, payload);
  return payload;
}
