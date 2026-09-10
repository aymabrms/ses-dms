import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { getDatabase, initializeDatabase } from "../db/database";
import { ResponseState, QuestionnaireModuleType } from "../types/offline";
import { QuestionRenderer } from "../questionnaires/components/QuestionRenderer";
import { SectionRenderer } from "../questionnaires/components/SectionRenderer";
import { resolveDefinitionOptions } from "../questionnaires/options";
import { addRepeatInstanceForGroup, listQuestionnaireResponses, listRepeatInstancesForGroup, LocalRepeatInstanceRow, persistQuestionResponse, removeLocalOnlyRepeatInstance, rowToRuntimeValue } from "../questionnaires/persistence";
import { getQuestionnaireDefinition } from "../questionnaires/registry";
import { calculateCompletion, indexResponses, isRepeatDeletionAllowed, RuntimeResponse, responseKey, ValidationMessage } from "../questionnaires/runtime";
import { QuestionDefinition, QuestionnaireDefinition, RepeatGroupDefinition, SectionDefinition } from "../questionnaires/types";

type ModuleInfo = { id: string; module_type: QuestionnaireModuleType; version_code: string };

export function QuestionnaireScreen({ moduleId, onBack }: { moduleId: string; onBack: () => void }) {
  const [definition, setDefinition] = useState<QuestionnaireDefinition | null>(null);
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null);
  const [responses, setResponses] = useState<RuntimeResponse[]>([]);
  const [repeatInstances, setRepeatInstances] = useState<LocalRepeatInstanceRow[]>([]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [message, setMessage] = useState("Loading questionnaire...");
  const [saveState, setSaveState] = useState<"Saved locally" | "Saving..." | "Dirty" | "Error">("Saved locally");

  const refresh = useCallback(async () => {
    const db = await initializeDatabase();
    const info = await db.getFirstAsync<ModuleInfo>(
      "SELECT m.id, m.module_type, qv.version_code FROM local_interview_modules m INNER JOIN local_questionnaire_versions qv ON qv.id = m.questionnaire_version_id WHERE m.id = ?",
      moduleId
    );
    if (!info) throw new Error("Local questionnaire module not found");
    const nextDefinition = await resolveDefinitionOptions(db, getQuestionnaireDefinition(info.module_type, info.version_code));
    const responseRows = await listQuestionnaireResponses(db, moduleId);
    const repeatRowsByGroup = await Promise.all(nextDefinition.repeatGroups.map((group) => listRepeatInstancesForGroup(db, moduleId, group.code)));
    setModuleInfo(info);
    setDefinition(nextDefinition);
    setResponses(responseRows.map((row) => ({ questionCode: row.question_code, repeatInstanceId: row.repeat_instance_id, responseState: row.response_state, value: rowToRuntimeValue(row) as RuntimeResponse["value"] })));
    setRepeatInstances(repeatRowsByGroup.flat());
    setMessage(`${nextDefinition.moduleType} definition loaded`);
  }, [moduleId]);

  useEffect(() => {
    refresh().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load questionnaire"));
  }, [refresh]);

  const completion = useMemo(() => (definition ? calculateCompletion(definition, responses, repeatInstances.map((instance) => ({ groupCode: instance.group_code, id: instance.id, localSyncStatus: instance.local_sync_status, sequenceNumber: instance.sequence_number }))) : null), [definition, repeatInstances, responses]);
  const section = definition?.sections[sectionIndex];
  const sectionRepeatGroup = section?.repeatGroupCode ? definition?.repeatGroups.find((group) => group.code === section.repeatGroupCode) : undefined;

  async function save(question: QuestionDefinition, value: unknown, responseState: ResponseState, repeatInstanceId?: string | null) {
    try {
      setSaveState("Saving...");
      const db = await getDatabase();
      await persistQuestionResponse(db, moduleId, question.code, question.type, value, responseState, repeatInstanceId);
      setSaveState("Dirty");
      await refresh();
      setSaveState("Saved locally");
    } catch (error) {
      setSaveState("Error");
      setMessage(error instanceof Error ? error.message : "Unable to save response");
    }
  }

  async function addRepeat(group: RepeatGroupDefinition) {
    try {
      const db = await getDatabase();
      const groupInstances = repeatInstances.filter((instance) => instance.group_code === group.code);
      await addRepeatInstanceForGroup(db, moduleId, group.code, groupInstances.length + 1);
      setSaveState("Dirty");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add repeat item");
    }
  }

  async function removeRepeat(instance: LocalRepeatInstanceRow) {
    try {
      if (!isRepeatDeletionAllowed({ groupCode: instance.group_code, id: instance.id, localSyncStatus: instance.local_sync_status, sequenceNumber: instance.sequence_number })) throw new Error("Already-synced repeat rows cannot be deleted until delete/tombstone sync is implemented.");
      const db = await getDatabase();
      await removeLocalOnlyRepeatInstance(db, moduleId, instance.id);
      setSaveState("Dirty");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove repeat row");
    }
  }

  if (!definition || !moduleInfo || !section) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <Button title="Back" onPress={onBack} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Button title="Back to Debug" onPress={onBack} />
        <Text style={styles.label}>{definition.moduleType} Survey</Text>
        <Text style={styles.title}>{definition.title}</Text>
        <Text style={styles.meta}>Version {definition.versionCode} - Section {sectionIndex + 1} of {definition.sections.length}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.statusCard}>
          <Text>Completion: {completion?.completionState ?? "NOT_STARTED"}</Text>
          <Text>Required missing: {completion?.requiredMissingCount ?? 0}</Text>
          <Text>Warnings: {completion?.warningCount ?? 0}</Text>
          <Text>Save status: {saveState}</Text>
        </View>
        <View style={styles.sectionTabs}>
          {definition.sections.map((candidate, index) => (
            <Text key={candidate.code} onPress={() => setSectionIndex(index)} style={[styles.sectionTab, index === sectionIndex && styles.sectionTabActive]}>{index + 1}. {candidate.title} {sectionStatus(candidate, definition, completion?.messages ?? [])}</Text>
          ))}
        </View>
        {sectionRepeatGroup ? (
          <RepeatGroupEditor group={sectionRepeatGroup} instances={repeatInstances.filter((instance) => instance.group_code === sectionRepeatGroup.code)} messages={completion?.messages ?? []} onAdd={() => void addRepeat(sectionRepeatGroup)} onRemove={removeRepeat} onSave={save} responses={responses} section={section} />
        ) : (
          <SectionRenderer section={section} responses={responses} messages={completion?.messages ?? []} onSave={(question, value, state) => void save(question, value, state)} />
        )}
        <View style={styles.nav}>
          <Button title="Previous" disabled={sectionIndex === 0} onPress={() => setSectionIndex((current) => Math.max(0, current - 1))} />
          <Button title="Next" disabled={sectionIndex >= definition.sections.length - 1} onPress={() => setSectionIndex((current) => Math.min(definition.sections.length - 1, current + 1))} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RepeatGroupEditor({ group, instances, messages, onAdd, onRemove, onSave, responses, section }: { group: RepeatGroupDefinition; instances: LocalRepeatInstanceRow[]; messages: ValidationMessage[]; onAdd: () => void; onRemove: (instance: LocalRepeatInstanceRow) => void; onSave: (question: QuestionDefinition, value: unknown, responseState: ResponseState, repeatInstanceId?: string | null) => void; responses: RuntimeResponse[]; section: SectionDefinition }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{group.title}</Text>
      {section.description ? <Text style={styles.message}>{section.description}</Text> : null}
      <Text style={styles.message}>{group.linkedDomainEntity}</Text>
      <Button title={`Add ${singularize(group.title)}`} onPress={onAdd} />
      {instances.length === 0 ? <Text style={styles.message}>No {group.title.toLowerCase()} added yet.</Text> : null}
      {instances.map((instance, index) => <RepeatInstanceEditor key={instance.id} group={group} instance={instance} index={index} messages={messages} onRemove={onRemove} onSave={onSave} responses={responses} />)}
    </View>
  );
}

function RepeatInstanceEditor({ group, index, instance, messages, onRemove, onSave, responses }: { group: RepeatGroupDefinition; index: number; instance: LocalRepeatInstanceRow; messages: ValidationMessage[]; onRemove: (instance: LocalRepeatInstanceRow) => void; onSave: (question: QuestionDefinition, value: unknown, responseState: ResponseState, repeatInstanceId?: string | null) => void; responses: RuntimeResponse[] }) {
  const responseMap = indexResponses(responses);
  return (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <Text style={styles.memberTitle}>{singularize(group.title)} {index + 1}</Text>
        <Text style={styles.remove} onPress={() => void onRemove(instance)}>{isRepeatDeletionAllowed({ groupCode: instance.group_code, id: instance.id, localSyncStatus: instance.local_sync_status, sequenceNumber: instance.sequence_number }) ? "Remove" : "Synced: delete blocked"}</Text>
      </View>
      {group.questions.map((question) => (
        <QuestionRenderer key={`${instance.id}:${question.code}`} question={question} response={responseMap.get(responseKey(question.code, instance.id))} messages={messages.filter((message) => message.code === question.code && message.repeatInstanceId === instance.id)} onSave={(nextQuestion, value, state) => onSave(nextQuestion, value, state, instance.id)} />
      ))}
    </View>
  );
}

function sectionStatus(section: SectionDefinition, definition: QuestionnaireDefinition, messages: ValidationMessage[]) {
  const repeatGroupQuestions = section.repeatGroupCode ? definition.repeatGroups.find((group) => group.code === section.repeatGroupCode)?.questions ?? [] : [];
  const sectionCodes = new Set([...section.questions, ...repeatGroupQuestions].map((question) => question.code));
  const hasErrors = messages.some((message) => sectionCodes.has(message.code));
  return hasErrors ? "!" : "";
}

function singularize(title: string) {
  if (title === "Trees / Crops") return "Tree/Crop";
  if (title.endsWith("ies")) return `${title.slice(0, -3)}y`;
  if (title.endsWith("s")) return title.slice(0, -1);
  return title;
}

const styles = StyleSheet.create({
  content: { gap: 14, padding: 18 },
  label: { color: "#47755d", fontSize: 12, fontWeight: "800", letterSpacing: 2, marginTop: 10, textTransform: "uppercase" },
  memberCard: { backgroundColor: "#fff", borderRadius: 14, gap: 12, padding: 12 },
  memberHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  memberTitle: { fontSize: 18, fontWeight: "800" },
  message: { color: "#516359", lineHeight: 21 },
  meta: { color: "#516359" },
  nav: { flexDirection: "row", gap: 12, justifyContent: "space-between", marginVertical: 20 },
  remove: { color: "#8a3b2b", fontWeight: "700" },
  screen: { backgroundColor: "#f5f1e8", flex: 1 },
  sectionTab: { backgroundColor: "#fff", borderRadius: 999, color: "#31463a", marginBottom: 6, paddingHorizontal: 10, paddingVertical: 7 },
  sectionTabActive: { backgroundColor: "#1f5f45", color: "#fff", fontWeight: "800" },
  sectionTabs: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sectionTitle: { color: "#14241c", fontSize: 22, fontWeight: "800" },
  sectionWrap: { gap: 12 },
  statusCard: { backgroundColor: "#fffaf0", borderRadius: 12, gap: 5, padding: 12 },
  title: { color: "#16261f", fontSize: 28, fontWeight: "800" }
});
