import { Controller, Get, Inject, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { ListQuestionnaireVersionsDto } from "./dto/list-questionnaire-versions.dto";
import { QuestionnaireVersionsService } from "./questionnaire-versions.service";

@ApiTags("questionnaire versions")
@Controller("questionnaire-versions")
export class QuestionnaireVersionsController {
  constructor(
    @Inject(QuestionnaireVersionsService)
    private readonly questionnaireVersionsService: QuestionnaireVersionsService
  ) {}

  @Get()
  findAll(@Query() query: ListQuestionnaireVersionsDto) {
    return this.questionnaireVersionsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.questionnaireVersionsService.findOne(id);
  }
}
