import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CreateInterviewDto } from "./dto/create-interview.dto";
import { CreateInterviewModuleDto } from "./dto/create-interview-module.dto";
import { ListInterviewsDto } from "./dto/list-interviews.dto";
import { UpdateInterviewDto } from "./dto/update-interview.dto";
import { InterviewsService } from "./interviews.service";

@ApiTags("interviews")
@Controller("interviews")
export class InterviewsController {
  constructor(@Inject(InterviewsService) private readonly interviewsService: InterviewsService) {}

  @Get()
  findAll(@Query() query: ListInterviewsDto) {
    return this.interviewsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.interviewsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInterviewDto) {
    return this.interviewsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateInterviewDto) {
    return this.interviewsService.update(id, dto);
  }

  @Get(":interviewId/modules")
  findModules(@Param("interviewId", ParseUUIDPipe) interviewId: string) {
    return this.interviewsService.findModules(interviewId);
  }

  @Post(":interviewId/modules")
  createModule(@Param("interviewId", ParseUUIDPipe) interviewId: string, @Body() dto: CreateInterviewModuleDto) {
    return this.interviewsService.createModule(interviewId, dto);
  }
}
