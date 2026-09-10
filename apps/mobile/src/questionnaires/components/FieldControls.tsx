import { Text, TextInput, View, StyleSheet, Pressable } from "react-native";

import { FieldType, QuestionOption } from "../types";

interface FieldControlProps {
  type: FieldType;
  value: unknown;
  options?: QuestionOption[];
  onChange: (value: unknown) => void;
  onBlur?: () => void;
}

export function FieldControl({ onBlur, onChange, options = [], type, value }: FieldControlProps) {
  if (type === "STATIC_TEXT") return <Text style={styles.staticText}>{String(value ?? "")}</Text>;
  if (type === "BOOLEAN") return <Segmented options={[{ label: "Yes", value: true }, { label: "No", value: false }]} value={value} onChange={onChange} />;
  if (type === "SINGLE_SELECT") return <Segmented options={options} value={value} onChange={onChange} />;
  if (type === "MULTI_SELECT") return <MultiSelect options={options} value={Array.isArray(value) ? value.map(String) : []} onChange={onChange} />;

  const keyboardType = type === "INTEGER" || type === "DECIMAL" || type === "MONEY" ? "numeric" : "default";
  const placeholder = type === "DATE" ? "YYYY-MM-DD" : type === "TIME" ? "HH:mm" : undefined;
  return <TextInput multiline={type === "TEXTAREA"} onBlur={onBlur} onChangeText={onChange} placeholder={placeholder} style={[styles.input, type === "TEXTAREA" && styles.textarea]} keyboardType={keyboardType} value={value === null || value === undefined ? "" : String(value)} />;
}

function Segmented({ onChange, options, value }: { onChange: (value: unknown) => void; options: Array<{ label: string; value: unknown }>; value: unknown }) {
  return (
    <View style={styles.optionWrap}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable key={String(option.value)} onPress={() => onChange(option.value)} style={[styles.option, selected && styles.optionSelected]}>
            <Text style={selected ? styles.optionSelectedText : styles.optionText}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MultiSelect({ onChange, options, value }: { onChange: (value: unknown) => void; options: QuestionOption[]; value: string[] }) {
  return (
    <View style={styles.optionWrap}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Pressable key={option.value} onPress={() => onChange(selected ? value.filter((candidate) => candidate !== option.value) : [...value, option.value])} style={[styles.option, selected && styles.optionSelected]}>
            <Text style={selected ? styles.optionSelectedText : styles.optionText}>{selected ? "✓ " : ""}{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: "#fff", borderColor: "#c8d0c6", borderRadius: 8, borderWidth: 1, fontSize: 16, padding: 12 },
  option: { backgroundColor: "#fff", borderColor: "#c8d0c6", borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  optionSelected: { backgroundColor: "#1f5f45", borderColor: "#1f5f45" },
  optionSelectedText: { color: "#fff", fontWeight: "700" },
  optionText: { color: "#24382f" },
  optionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  staticText: { color: "#516359", lineHeight: 21 },
  textarea: { minHeight: 96, textAlignVertical: "top" }
});
