import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { getDatabase, initializeDatabase } from "../db/database";
import { ResponseState } from "../types/offline";
import { QuestionRenderer } from "../questionnaires/components/QuestionRenderer";
import { SectionRenderer } from "../questionnaires/components/SectionRenderer";
import { resolveDefinitionOptions } from "../questionnaires/options";
import { addRepeatInstanceForGroup, listQuestionnaireResponses, listRepeatInstancesForGroup, LocalRepeatInstanceRow, persistQuestionResponse, removeLocalOnlyRepeatInstance, rowToRuntimeValue } from "../questionnaires/persistence";
import { getQuestionnaireDefinition } from "../questionnaires/registry";
import { calculateCompletion, indexResponses, isRepeatDeletionAllowed, RuntimeResponse, responseKey, ValidationMessage } from "../questionnaires/runtime";
import { QuestionDefinition, QuestionnaireDefinition } from "../questionnaires/types";

type ModuleInfo = { id: string; module_type: "HOUSEHOLD"; version_code: string };

export function HouseholdQuestionnaireScreen({ moduleId, onBack }: { moduleId: string; onBack: () => void }) {
  const [definition, setDefinition] = useState<QuestionnaireDefinition | null>(null);
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null);
  const [responses, setResponses] = useState<RuntimeResponse[]>([]);
  const [members, setMembers] = useState<LocalRepeatInstanceRow[]>([]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [message, setMessage] = useState("Loading questionnaire...");
  const [saveState, setSaveState] = useState<"Saved locally" | "Saving..." | "Dirty" | "Error">("Saved locally");

  const refresh = useCallback(async () => {
    const db = await initializeDatabase();
    const info = await db.getFirstAsync<ModuleInfo>(
      "SELECT m.id, m.module_type, qv.version_code FROM local_interview_modules m INNER JOIN local_questionnaire_versions qv ON qv.id = m.questionnaire_version_id WHERE m.id = ?",
      moduleId
    );
    if (!info) throw new Error("Local Household module not found");
    if (info.module_type !== "HOUSEHOLD") throw new Error("Selected module is not a Household module");
    const nextDefinition = await resolveDefinitionOptions(db, getQuestionnaireDefinition(info.module_type, info.version_code));
    const responseRows = await listQuestionnaireResponses(db, moduleId);
    const repeatRows = await listRepeatInstancesForGroup(db, moduleId, "household.members");
    setModuleInfo(info);
    setDefinition(nextDefinition);
    setResponses(responseRows.map((row) => ({ questionCode: row.question_code, repeatInstanceId: row.repeat_instance_id, responseState: row.response_state, value: rowToRuntimeValue(row) as RuntimeResponse["value"] })));
    setMembers(repeatRows);
    setMessage("Household definition loaded");
  }, [moduleId]);

  useEffect(() => {
    refresh().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load Household questionnaire"));
  }, [refresh]);

  const completion = useMemo(() => (definition ? calculateCompletion(definition, responses, members.map((member) => ({ groupCode: member.group_code, id: member.id, localSyncStatus: member.local_sync_status, sequenceNumber: member.sequence_number }))) : null), [definition, members, responses]);
  const section = definition?.sections[sectionIndex];
  const memberGroup = definition?.repeatGroups.find((group) => group.code === "household.members");

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

  async function addMember() {
    try {
      const db = await getDatabase();
      await addRepeatInstanceForGroup(db, moduleId, "household.members", members.length + 1);
      setSaveState("Dirty");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add household member");
    }
  }

  async function removeMember(member: LocalRepeatInstanceRow) {
    try {
      if (!isRepeatDeletionAllowed({ groupCode: member.group_code, id: member.id, localSyncStatus: member.local_sync_status, sequenceNumber: member.sequence_number })) throw new Error("Already-synced members cannot be deleted until delete/tombstone sync is implemented.");
      const db = await getDatabase();
      await removeLocalOnlyRepeatInstance(db, moduleId, member.id);
      setSaveState("Dirty");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to remove household member");
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

  const isMemberSection = section.code === "household.members_section";

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Button title="Back to Debug" onPress={onBack} />
        <Text style={styles.label}>Household Survey</Text>
        <Text style={styles.title}>{definition.title}</Text>
        <Text style={styles.meta}>Version {definition.versionCode} · Section {sectionIndex + 1} of {definition.sections.length}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.statusCard}>
          <Text>Completion: {completion?.completionState ?? "NOT_STARTED"}</Text>
          <Text>Required missing: {completion?.requiredMissingCount ?? 0}</Text>
          <Text>Warnings: {completion?.warningCount ?? 0}</Text>
          <Text>Save status: {saveState}</Text>
        </View>
        <View style={styles.sectionTabs}>
          {definition.sections.map((candidate, index) => (
            <Text key={candidate.code} onPress={() => setSectionIndex(index)} style={[styles.sectionTab, index === sectionIndex && styles.sectionTabActive]}>{index + 1}. {candidate.title}</Text>
          ))}
        </View>
        {isMemberSection && memberGroup ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{memberGroup.title}</Text>
            <Text style={styles.message}>{memberGroup.linkedDomainEntity}</Text>
            <Button title="Add Household Member" onPress={() => void addMember()} />
            {members.length === 0 ? <Text style={styles.message}>No household members added yet.</Text> : null}
            {members.map((member, index) => <MemberEditor key={member.id} member={member} index={index} questions={memberGroup.questions} responses={responses} messages={completion?.messages ?? []} onSave={save} onRemove={removeMember} />)}
          </View>
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

function MemberEditor({ index, member, messages, onRemove, onSave, questions, responses }: { index: number; member: LocalRepeatInstanceRow; messages: ValidationMessage[]; onRemove: (member: LocalRepeatInstanceRow) => void; onSave: (question: QuestionDefinition, value: unknown, responseState: ResponseState, repeatInstanceId?: string | null) => void; questions: QuestionDefinition[]; responses: RuntimeResponse[] }) {
  const responseMap = indexResponses(responses);
  return (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <Text style={styles.memberTitle}>Member {index + 1}</Text>
        <Text style={styles.remove} onPress={() => void onRemove(member)}>{isRepeatDeletionAllowed({ groupCode: member.group_code, id: member.id, localSyncStatus: member.local_sync_status, sequenceNumber: member.sequence_number }) ? "Remove" : "Synced: delete blocked"}</Text>
      </View>
      {questions.map((question) => (
        <QuestionRenderer key={`${member.id}:${question.code}`} question={question} response={responseMap.get(responseKey(question.code, member.id))} messages={messages.filter((message) => message.code === question.code && message.repeatInstanceId === member.id)} onSave={(nextQuestion, value, state) => onSave(nextQuestion, value, state, member.id)} />
      ))}
    </View>
  );
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
