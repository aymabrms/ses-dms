import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectsService } from "./projects.service";

@ApiTags("projects")
@Controller("projects")
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }
}
