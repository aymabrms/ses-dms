import { StatusBar } from "expo-status-bar";

import { OfflineDebugScreen } from "./src/screens/OfflineDebugScreen";

export default function App() {
  return (
    <>
      <OfflineDebugScreen />
      <StatusBar style="dark" />
    </>
  );
}
