import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.label}>SES/DMS</Text>
        <Text style={styles.title}>Field app foundation</Text>
        <Text style={styles.description}>
          This Phase 1 shell will become the offline-first survey application after the
          questionnaire domain model is reviewed.
        </Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f1e8"
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 28
  },
  label: {
    color: "#47755d",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2
  },
  title: {
    color: "#16261f",
    fontSize: 38,
    fontWeight: "700",
    marginTop: 14
  },
  description: {
    color: "#31463a",
    fontSize: 17,
    lineHeight: 26,
    marginTop: 24
  }
});
