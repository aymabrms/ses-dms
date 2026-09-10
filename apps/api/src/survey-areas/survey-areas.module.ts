import { Module } from "@nestjs/common";

import { SurveyAreasController } from "./survey-areas.controller";
import { SurveyAreasService } from "./survey-areas.service";

@Module({
  controllers: [SurveyAreasController],
  providers: [SurveyAreasService]
})
export class SurveyAreasModule {}
