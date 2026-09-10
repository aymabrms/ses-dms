import { Module } from "@nestjs/common";

import { QuestionnaireVersionsController } from "./questionnaire-versions.controller";
import { QuestionnaireVersionsService } from "./questionnaire-versions.service";

@Module({
  controllers: [QuestionnaireVersionsController],
  providers: [QuestionnaireVersionsService]
})
export class QuestionnaireVersionsModule {}
