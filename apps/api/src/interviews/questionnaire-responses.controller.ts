import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CreateRepeatInstanceDto, UpdateRepeatInstanceDto } from "./dto/questionnaire-repeat-instance.dto";
import { BulkWriteResponsesDto } from "./dto/questionnaire-response.dto";
import { QuestionnaireResponsesService } from "./questionnaire-responses.service";

@ApiTags("questionnaire responses")
@Controller("interviews/:interviewId/modules/:moduleId")
export class QuestionnaireResponsesController {
  constructor(@Inject(QuestionnaireResponsesService) private readonly responsesService: QuestionnaireResponsesService) {}

  @Get("responses")
  listResponses(@Param("interviewId", ParseUUIDPipe) interviewId: string, @Param("moduleId", ParseUUIDPipe) moduleId: string) {
    return this.responsesService.listResponses(interviewId, moduleId);
  }

  @Put("responses")
  writeResponses(@Param("interviewId", ParseUUIDPipe) interviewId: string, @Param("moduleId", ParseUUIDPipe) moduleId: string, @Body() dto: BulkWriteResponsesDto) {
    return this.responsesService.writeResponses(interviewId, moduleId, dto);
  }

  @Get("repeat-instances")
  listRepeatInstances(@Param("interviewId", ParseUUIDPipe) interviewId: string, @Param("moduleId", ParseUUIDPipe) moduleId: string) {
    return this.responsesService.listRepeatInstances(interviewId, moduleId);
  }

  @Post("repeat-instances")
  createRepeatInstance(@Param("interviewId", ParseUUIDPipe) interviewId: string, @Param("moduleId", ParseUUIDPipe) moduleId: string, @Body() dto: CreateRepeatInstanceDto) {
    return this.responsesService.createRepeatInstance(interviewId, moduleId, dto);
  }

  @Patch("repeat-instances/:repeatInstanceId")
  updateRepeatInstance(
    @Param("interviewId", ParseUUIDPipe) interviewId: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Param("repeatInstanceId", ParseUUIDPipe) repeatInstanceId: string,
    @Body() dto: UpdateRepeatInstanceDto
  ) {
    return this.responsesService.updateRepeatInstance(interviewId, moduleId, repeatInstanceId, dto);
  }

  @Get("validation-issues")
  listValidationIssues(@Param("interviewId", ParseUUIDPipe) interviewId: string, @Param("moduleId", ParseUUIDPipe) moduleId: string) {
    return this.responsesService.listValidationIssues(interviewId, moduleId);
  }
}
