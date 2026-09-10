import { Pressable, StyleSheet, Text, View } from "react-native";

import { ResponseState } from "../../types/offline";

const states: Array<{ label: string; value: ResponseState }> = [
  { label: "Answered", value: "ANSWERED" },
  { label: "No response", value: "NO_RESPONSE" },
  { label: "N/A", value: "NOT_APPLICABLE" },
  { label: "Unknown", value: "UNKNOWN" },
  { label: "Needs validation", value: "REQUIRES_VALIDATION" }
];

export function ResponseStateControl({ onChange, value }: { onChange: (value: ResponseState) => void; value: ResponseState }) {
  return (
    <View style={styles.wrap}>
      {states.map((state) => {
        const selected = state.value === value;
        return (
          <Pressable key={state.value} onPress={() => onChange(state.value)} style={[styles.state, selected && styles.selected]}>
            <Text style={selected ? styles.selectedText : styles.text}>{state.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  selected: { backgroundColor: "#735c2c", borderColor: "#735c2c" },
  selectedText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  state: { borderColor: "#d9cba8", borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  text: { color: "#5c4b26", fontSize: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }
});
