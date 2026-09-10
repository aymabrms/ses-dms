-- Root-level responses have NULL repeatInstanceId, so a normal compound unique
-- constraint would not prevent duplicate root answers in PostgreSQL.
CREATE UNIQUE INDEX "questionnaire_responses_module_question_root_key"
ON "questionnaire_responses"("interviewModuleId", "questionCode")
WHERE "repeatInstanceId" IS NULL;

CREATE UNIQUE INDEX "questionnaire_responses_module_question_repeat_key"
ON "questionnaire_responses"("interviewModuleId", "questionCode", "repeatInstanceId")
WHERE "repeatInstanceId" IS NOT NULL;
