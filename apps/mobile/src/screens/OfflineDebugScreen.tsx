import { useEffect, useState } from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { getDatabase, getSchemaVersion, initializeDatabase } from "../db/database";
import { createLocalInterview, createLocalInterviewModule, listLocalInterviews } from "../db/repositories/interviewRepository";
import { countOutboxItemsByStatus, countPendingOutboxItems, enqueueModuleForSync } from "../db/repositories/outboxRepository";
import { createLocalRepeatInstance, upsertLocalResponse } from "../db/repositories/questionnaireRepository";
import { countTable, listActiveQuestionnaireVersions, listLocalProjects, listLocalSurveyAreas } from "../db/repositories/referenceRepository";
import { downloadAndImportBootstrap } from "../sync/bootstrap";
import { processPendingSync, refreshRemoteStatus } from "../sync/foregroundSync";

type Counts = {
  projects: number;
  surveyAreas: number;
  questionnaireVersions: number;
  interviews: number;
  outbox: number;
  failedOutbox: number;
  conflictOutbox: number;
  syncedModules: number;
};

type ProjectRow = { id: string };
type AreaRow = { id: string };
type VersionRow = { id: string; module_type: "HOUSEHOLD" | "BUSINESS" | "LANDOWNER" };
type InterviewRow = { id: string; project_id: string; survey_area_id: string; local_sync_status: string };
type ModuleRow = { id: string; interview_id: string; local_sync_status: string };
type RepeatRow = { id: string };

export function OfflineDebugScreen({ onOpenHouseholdModule }: { onOpenHouseholdModule?: (moduleId: string) => void }) {
  const [initialized, setInitialized] = useState(false);
  const [schemaVersion, setSchemaVersion] = useState(0);
  const [counts, setCounts] = useState<Counts>({ conflictOutbox: 0, failedOutbox: 0, interviews: 0, outbox: 0, projects: 0, questionnaireVersions: 0, surveyAreas: 0, syncedModules: 0 });
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [lastModuleId, setLastModuleId] = useState<string | undefined>();
  const [message, setMessage] = useState("Initializing database...");

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    try {
      const db = await initializeDatabase();
      const [version, projects, surveyAreas, questionnaireVersions, interviewRows, outbox, failedOutbox, conflictOutbox, syncedModules] = await Promise.all([
        getSchemaVersion(),
        countTable(db, "local_projects"),
        countTable(db, "local_survey_areas"),
        countTable(db, "local_questionnaire_versions"),
        listLocalInterviews(db) as Promise<InterviewRow[]>,
        countPendingOutboxItems(db),
        countOutboxItemsByStatus(db, "SYNC_FAILED"),
        countOutboxItemsByStatus(db, "CONFLICT"),
        db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM local_interview_modules WHERE local_sync_status = ?", "SYNCED")
      ]);
      setSchemaVersion(version);
      setCounts({
        conflictOutbox: conflictOutbox?.count ?? 0,
        failedOutbox: failedOutbox?.count ?? 0,
        interviews: interviewRows.length,
        outbox: outbox?.count ?? 0,
        projects: projects?.count ?? 0,
        questionnaireVersions: questionnaireVersions?.count ?? 0,
        surveyAreas: surveyAreas?.count ?? 0,
        syncedModules: syncedModules?.count ?? 0
      });
      setInterviews(interviewRows);
      setInitialized(true);
      setMessage("Database ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Database initialization failed");
    }
  }

  async function bootstrap() {
    try {
      await downloadAndImportBootstrap();
      setMessage("Bootstrap imported");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bootstrap failed");
    }
  }

  async function createTestInterview() {
    try {
      const db = await getDatabase();
      const projects = (await listLocalProjects(db)) as ProjectRow[];
      if (!projects[0]) throw new Error("Run bootstrap first: no local project exists");
      const areas = (await listLocalSurveyAreas(db, projects[0].id)) as AreaRow[];
      if (!areas[0]) throw new Error("Run bootstrap first: no local survey area exists");
      const versions = (await listActiveQuestionnaireVersions(db)) as VersionRow[];
      const householdVersion = versions.find((version) => version.module_type === "HOUSEHOLD") ?? versions[0];
      if (!householdVersion) throw new Error("Run bootstrap first: no questionnaire version exists");

      const interview = (await createLocalInterview(db, { projectId: projects[0].id, surveyAreaId: areas[0].id })) as InterviewRow;
      const module = (await createLocalInterviewModule(db, {
        interviewId: interview.id,
        moduleType: householdVersion.module_type,
        questionnaireVersionId: householdVersion.id
      })) as ModuleRow;
      setLastModuleId(module.id);
      setMessage(`Created local interview ${interview.id.slice(0, 8)} and module ${module.id.slice(0, 8)}`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Create test interview failed");
    }
  }

  async function addRepeatAndResponse() {
    try {
      const db = await getDatabase();
      const moduleId = lastModuleId ?? ((await db.getFirstAsync("SELECT id FROM local_interview_modules ORDER BY created_at DESC LIMIT 1")) as ModuleRow | null)?.id;
      if (!moduleId) throw new Error("Create a local test module first");
      const repeat = (await createLocalRepeatInstance(db, { groupCode: "household.member", interviewModuleId: moduleId, sequenceNumber: 1 })) as RepeatRow;
      await upsertLocalResponse(db, {
        interviewModuleId: moduleId,
        questionCode: "household.member.age",
        repeatInstanceId: repeat.id,
        responseState: "ANSWERED",
        valueNumber: 42
      });
      setMessage("Created repeat instance and saved response; module marked DIRTY");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save response failed");
    }
  }

  async function enqueueLatestModule() {
    try {
      const db = await getDatabase();
      const module = (await db.getFirstAsync("SELECT id, interview_id, local_sync_status FROM local_interview_modules ORDER BY updated_at DESC LIMIT 1")) as ModuleRow | null;
      if (!module) throw new Error("Create a local module first");
      await enqueueModuleForSync(db, module.id, module.interview_id);
      setMessage("Queued latest module for future sync");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Queue module failed");
    }
  }

  async function openLatestHouseholdModule() {
    try {
      const db = await getDatabase();
      const module = await db.getFirstAsync<ModuleRow>("SELECT id, interview_id, local_sync_status FROM local_interview_modules WHERE module_type = ? ORDER BY updated_at DESC LIMIT 1", "HOUSEHOLD");
      if (!module) throw new Error("Create a local Household module first");
      onOpenHouseholdModule?.(module.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Open Household questionnaire failed");
    }
  }

  async function syncPending() {
    try {
      const results = await processPendingSync();
      setMessage(results.length === 0 ? "No pending sync work" : results.map((result) => `${result.status}: ${result.message}`).join("; "));
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync pending failed");
    }
  }

  async function refreshLatestRemoteStatus() {
    try {
      const db = await getDatabase();
      const interview = (await db.getFirstAsync("SELECT id FROM local_interviews ORDER BY updated_at DESC LIMIT 1")) as InterviewRow | null;
      if (!interview) throw new Error("Create or mirror an interview first");
      const status = await refreshRemoteStatus(interview.id);
      setMessage(`Remote status fetched: ${status.modules.length} module(s)`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Refresh sync status failed");
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>SES/DMS Mobile</Text>
        <Text style={styles.title}>Offline foundation debug</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.card}>
          <Text>Database initialized: {initialized ? "yes" : "no"}</Text>
          <Text>Schema version: {schemaVersion}</Text>
          <Text>Projects: {counts.projects}</Text>
          <Text>Survey areas: {counts.surveyAreas}</Text>
          <Text>Questionnaire versions: {counts.questionnaireVersions}</Text>
          <Text>Local interviews: {counts.interviews}</Text>
          <Text>Pending outbox: {counts.outbox}</Text>
          <Text>Failed outbox: {counts.failedOutbox}</Text>
          <Text>Conflict outbox: {counts.conflictOutbox}</Text>
          <Text>Synced modules: {counts.syncedModules}</Text>
        </View>
        <View style={styles.buttons}>
          <Button title="Refresh" onPress={() => void refresh()} />
          <Button title="Bootstrap Reference Data" onPress={() => void bootstrap()} />
          <Button title="Create Local Test Interview" onPress={() => void createTestInterview()} />
          <Button title="Open Latest Household Questionnaire" onPress={() => void openLatestHouseholdModule()} />
          <Button title="Add Repeat + Response" onPress={() => void addRepeatAndResponse()} />
          <Button title="Queue Latest Module" onPress={() => void enqueueLatestModule()} />
          <Button title="Sync Pending" onPress={() => void syncPending()} />
          <Button title="Retry Failed" onPress={() => void syncPending()} />
          <Button title="Refresh Sync Status" onPress={() => void refreshLatestRemoteStatus()} />
        </View>
        {interviews.map((interview) => (
          <View key={interview.id} style={styles.row}>
            <Text style={styles.rowTitle}>{interview.id}</Text>
            <Text>{interview.local_sync_status}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttons: {
    gap: 10,
    marginTop: 14
  },
  card: {
    backgroundColor: "#fffaf0",
    borderRadius: 12,
    gap: 6,
    marginTop: 18,
    padding: 16
  },
  content: {
    padding: 22
  },
  label: {
    color: "#47755d",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase"
  },
  message: {
    color: "#31463a",
    lineHeight: 22,
    marginTop: 12
  },
  row: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginTop: 10,
    padding: 12
  },
  rowTitle: {
    fontWeight: "700"
  },
  screen: {
    backgroundColor: "#f5f1e8",
    flex: 1
  },
  title: {
    color: "#16261f",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 8
  }
});
