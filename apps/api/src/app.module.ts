import { Module } from "@nestjs/common";

import { DomainModule } from "./domain/domain.module";
import { InterviewsModule } from "./interviews/interviews.module";
import { HealthController } from "./health.controller";
import { PersonsModule } from "./persons/persons.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectsModule } from "./projects/projects.module";
import { QuestionnaireVersionsModule } from "./questionnaire-versions/questionnaire-versions.module";
import { SurveyAreasModule } from "./survey-areas/survey-areas.module";
import { UsersModule } from "./users/users.module";

@Module({
  controllers: [HealthController],
  imports: [
    PrismaModule,
    ProjectsModule,
    SurveyAreasModule,
    UsersModule,
    QuestionnaireVersionsModule,
    PersonsModule,
    InterviewsModule,
    DomainModule
  ]
})
export class AppModule {}
