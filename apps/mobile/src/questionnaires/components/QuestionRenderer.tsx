import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ResponseState } from "../../types/offline";
import { FieldControl } from "./FieldControls";
import { ResponseStateControl } from "./ResponseStateControl";
import { RuntimeResponse, ValidationMessage } from "../runtime";
import { QuestionDefinition } from "../types";

interface QuestionRendererProps {
  question: QuestionDefinition;
  response?: RuntimeResponse;
  messages?: ValidationMessage[];
  onSave: (question: QuestionDefinition, value: unknown, responseState: ResponseState) => void;
}

export function QuestionRenderer({ messages = [], onSave, question, response }: QuestionRendererProps) {
  const [draft, setDraft] = useState<unknown>(response?.value ?? "");
  const responseState = response?.responseState ?? "ANSWERED";

  useEffect(() => {
    setDraft(response?.value ?? "");
  }, [response?.value]);

  useEffect(() => {
    if (!["TEXT", "TEXTAREA", "INTEGER", "DECIMAL", "MONEY"].includes(question.type)) return;
    const handle = setTimeout(() => onSave(question, normalizeValue(question.type, draft), responseState), 650);
    return () => clearTimeout(handle);
  }, [draft, onSave, question, responseState]);

  if (question.type === "STATIC_TEXT") {
    return <Text style={styles.help}>{question.label}</Text>;
  }

  function saveImmediate(nextValue: unknown) {
    setDraft(nextValue);
    if (!["TEXT", "TEXTAREA", "INTEGER", "DECIMAL", "MONEY"].includes(question.type)) onSave(question, normalizeValue(question.type, nextValue), responseState);
  }

  function updateState(nextState: ResponseState) {
    onSave(question, normalizeValue(question.type, draft), nextState);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{question.label}{question.required ? " *" : ""}</Text>
      {question.helpText ? <Text style={styles.help}>{question.helpText}</Text> : null}
      {question.triggerRecommendation ? <Text style={styles.recommendation}>{question.triggerRecommendation.level}: {question.triggerRecommendation.message}</Text> : null}
      <FieldControl type={question.type} value={draft} options={question.options} onChange={saveImmediate} onBlur={() => onSave(question, normalizeValue(question.type, draft), responseState)} />
      <ResponseStateControl value={responseState} onChange={updateState} />
      {messages.map((message) => <Text key={`${message.code}-${message.message}`} style={message.severity === "WARNING" ? styles.warning : styles.error}>{message.message}</Text>)}
    </View>
  );
}

function normalizeValue(type: string, value: unknown) {
  if (value === "") return null;
  if (type === "INTEGER" || type === "DECIMAL" || type === "MONEY") {
    const numeric = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
    return Number.isFinite(numeric) ? numeric : value;
  }
  return value;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fdfbf6", borderRadius: 12, gap: 8, padding: 12 },
  error: { color: "#a33120", fontSize: 12, marginTop: 4 },
  help: { color: "#607066", lineHeight: 20 },
  label: { color: "#18271f", fontSize: 15, fontWeight: "700" },
  recommendation: { backgroundColor: "#fff3cd", borderRadius: 8, color: "#6c5300", fontSize: 12, fontWeight: "700", padding: 8 },
  warning: { color: "#8b6508", fontSize: 12, marginTop: 4 }
});
