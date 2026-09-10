import { StatusBar } from "expo-status-bar";
import { useState } from "react";

import { OfflineDebugScreen } from "./src/screens/OfflineDebugScreen";
import { QuestionnaireScreen } from "./src/screens/QuestionnaireScreen";

export default function App() {
  const [questionnaireModuleId, setQuestionnaireModuleId] = useState<string | null>(null);

  return (
    <>
      {questionnaireModuleId ? <QuestionnaireScreen moduleId={questionnaireModuleId} onBack={() => setQuestionnaireModuleId(null)} onOpenModule={setQuestionnaireModuleId} /> : <OfflineDebugScreen onOpenQuestionnaireModule={setQuestionnaireModuleId} />}
      <StatusBar style="dark" />
    </>
  );
}
