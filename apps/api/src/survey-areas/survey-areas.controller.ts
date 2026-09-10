import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CreateSurveyAreaDto } from "./dto/create-survey-area.dto";
import { ListSurveyAreasDto } from "./dto/list-survey-areas.dto";
import { UpdateSurveyAreaDto } from "./dto/update-survey-area.dto";
import { SurveyAreasService } from "./survey-areas.service";

@ApiTags("survey areas")
@Controller("survey-areas")
export class SurveyAreasController {
  constructor(@Inject(SurveyAreasService) private readonly surveyAreasService: SurveyAreasService) {}

  @Get()
  findAll(@Query() query: ListSurveyAreasDto) {
    return this.surveyAreasService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.surveyAreasService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSurveyAreaDto) {
    return this.surveyAreasService.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateSurveyAreaDto) {
    return this.surveyAreasService.update(id, dto);
  }
}
