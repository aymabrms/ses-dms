import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CreatePersonDto } from "./dto/create-person.dto";
import { UpdatePersonDto } from "./dto/update-person.dto";
import { PersonsService } from "./persons.service";

@ApiTags("persons")
@Controller("persons")
export class PersonsController {
  constructor(@Inject(PersonsService) private readonly personsService: PersonsService) {}

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.personsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePersonDto) {
    return this.personsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdatePersonDto) {
    return this.personsService.update(id, dto);
  }
}
