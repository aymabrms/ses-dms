import { StyleSheet, Text, View } from "react-native";

import { ResponseState } from "../../types/offline";
import { QuestionRenderer } from "./QuestionRenderer";
import { indexResponses, isQuestionVisible, responseKey, RuntimeResponse, ValidationMessage } from "../runtime";
import { QuestionDefinition, SectionDefinition } from "../types";

interface SectionRendererProps {
  section: SectionDefinition;
  responses: RuntimeResponse[];
  messages: ValidationMessage[];
  onSave: (question: QuestionDefinition, value: unknown, responseState: ResponseState) => void;
}

export function SectionRenderer({ messages, onSave, responses, section }: SectionRendererProps) {
  const responseMap = indexResponses(responses);
  const visibleQuestions = section.questions.filter((question) => isQuestionVisible(question, responseMap));
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{section.title}</Text>
      {section.description ? <Text style={styles.description}>{section.description}</Text> : null}
      {visibleQuestions.length === 0 ? <Text style={styles.description}>This section uses repeat-group rows below.</Text> : null}
      {visibleQuestions.map((question) => (
        <QuestionRenderer key={question.code} question={question} response={responseMap.get(responseKey(question.code))} messages={messages.filter((message) => message.code === question.code && !message.repeatInstanceId)} onSave={onSave} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  description: { color: "#607066", lineHeight: 21 },
  title: { color: "#14241c", fontSize: 22, fontWeight: "800" },
  wrap: { gap: 12 }
});
