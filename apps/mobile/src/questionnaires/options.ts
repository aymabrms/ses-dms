import type { LocalDatabase } from "../db/types";
import { QuestionnaireDefinition, QuestionOption } from "./types";

type LookupRow = { code: string; label: string };

export async function resolveDefinitionOptions(db: LocalDatabase, definition: QuestionnaireDefinition): Promise<QuestionnaireDefinition> {
  const cache = new Map<string, QuestionOption[]>();
  async function resolveOptions(lookupSetCode?: string) {
    if (!lookupSetCode) return [];
    const cached = cache.get(lookupSetCode);
    if (cached) return cached;
    const rows = await db.getAllAsync<LookupRow>(
      "SELECT lv.code, lv.label FROM local_lookup_values lv INNER JOIN local_lookup_sets ls ON ls.id = lv.lookup_set_id WHERE ls.code = ? AND lv.is_active = 1 ORDER BY lv.sort_order ASC, lv.code ASC",
      lookupSetCode
    );
    const options = rows.map((row) => ({ label: row.label, value: row.code }));
    cache.set(lookupSetCode, options);
    return options;
  }

  return {
    ...definition,
    repeatGroups: await Promise.all(
      definition.repeatGroups.map(async (group) => ({
        ...group,
        questions: await Promise.all(group.questions.map(async (question) => (question.optionSource?.type === "LOOKUP_SET" ? { ...question, options: await resolveOptions(question.optionSource.lookupSetCode) } : question)))
      }))
    ),
    sections: await Promise.all(
      definition.sections.map(async (section) => ({
        ...section,
        questions: await Promise.all(section.questions.map(async (question) => (question.optionSource?.type === "LOOKUP_SET" ? { ...question, options: await resolveOptions(question.optionSource.lookupSetCode) } : question)))
      }))
    )
  };
}
