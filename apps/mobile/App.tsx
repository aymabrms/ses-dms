import { StatusBar } from "expo-status-bar";
import { useState } from "react";

import { OfflineDebugScreen } from "./src/screens/OfflineDebugScreen";
import { HouseholdQuestionnaireScreen } from "./src/screens/HouseholdQuestionnaireScreen";

export default function App() {
  const [householdModuleId, setHouseholdModuleId] = useState<string | null>(null);

  return (
    <>
      {householdModuleId ? <HouseholdQuestionnaireScreen moduleId={householdModuleId} onBack={() => setHouseholdModuleId(null)} /> : <OfflineDebugScreen onOpenHouseholdModule={setHouseholdModuleId} />}
      <StatusBar style="dark" />
    </>
  );
}
