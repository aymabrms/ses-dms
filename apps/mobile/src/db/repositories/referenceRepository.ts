import { LocalDatabase } from "../database";
import { BootstrapPayload } from "../../types/offline";

export async function importBootstrapData(db: LocalDatabase, payload: BootstrapPayload) {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const project of payload.projects) {
      await db.runAsync(
        "INSERT OR REPLACE INTO local_projects (id, code, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        project.id,
        project.code,
        project.name,
        project.description ?? null,
        project.createdAt ?? null,
        project.updatedAt ?? null
      );
    }

    for (const area of payload.surveyAreas) {
      await db.runAsync(
        "INSERT OR REPLACE INTO local_survey_areas (id, project_id, code, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        area.id,
        area.projectId,
        area.code ?? null,
        area.name,
        area.createdAt ?? null,
        area.updatedAt ?? null
      );
    }

    for (const version of payload.questionnaireVersions) {
      await db.runAsync(
        "INSERT OR REPLACE INTO local_questionnaire_versions (id, project_id, module_type, version_code, title, effective_from, effective_to, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        version.id,
        version.projectId ?? null,
        version.moduleType,
        version.versionCode,
        version.title,
        version.effectiveFrom ?? null,
        version.effectiveTo ?? null,
        version.isActive ? 1 : 0,
        version.createdAt ?? null,
        version.updatedAt ?? null
      );
    }

    for (const set of payload.lookupSets) {
      await db.runAsync("INSERT OR REPLACE INTO local_lookup_sets (id, code, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", set.id, set.code, set.name, set.createdAt ?? null, set.updatedAt ?? null);
    }

    for (const value of payload.lookupValues) {
      await db.runAsync(
        "INSERT OR REPLACE INTO local_lookup_values (id, lookup_set_id, code, label, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        value.id,
        value.lookupSetId,
        value.code,
        value.label,
        value.sortOrder,
        value.isActive ? 1 : 0,
        value.createdAt ?? null,
        value.updatedAt ?? null
      );
    }

    await db.runAsync("INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, ?)", "last_bootstrap_at", now, now);
  });
}

export function listLocalProjects(db: LocalDatabase) {
  return db.getAllAsync("SELECT * FROM local_projects ORDER BY code ASC");
}

export function listLocalSurveyAreas(db: LocalDatabase, projectId: string) {
  return db.getAllAsync("SELECT * FROM local_survey_areas WHERE project_id = ? ORDER BY name ASC", projectId);
}

export function listActiveQuestionnaireVersions(db: LocalDatabase) {
  return db.getAllAsync("SELECT * FROM local_questionnaire_versions WHERE is_active = 1 ORDER BY module_type ASC, version_code ASC");
}

export function countTable(db: LocalDatabase, tableName: string) {
  return db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`);
}
