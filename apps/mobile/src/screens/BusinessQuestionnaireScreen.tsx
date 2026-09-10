import { QuestionnaireScreen } from "./QuestionnaireScreen";

export function BusinessQuestionnaireScreen({ moduleId, onBack }: { moduleId: string; onBack: () => void }) {
  return <QuestionnaireScreen moduleId={moduleId} onBack={onBack} />;
}
