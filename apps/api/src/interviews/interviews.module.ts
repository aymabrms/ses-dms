import { Module } from "@nestjs/common";

import { InterviewsController } from "./interviews.controller";
import { InterviewsService } from "./interviews.service";
import { QuestionnaireResponsesController } from "./questionnaire-responses.controller";
import { QuestionnaireResponsesService } from "./questionnaire-responses.service";

@Module({
  controllers: [InterviewsController, QuestionnaireResponsesController],
  providers: [InterviewsService, QuestionnaireResponsesService]
})
export class InterviewsModule {}
