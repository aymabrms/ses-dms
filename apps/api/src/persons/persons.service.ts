import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreatePersonDto } from "./dto/create-person.dto";
import { UpdatePersonDto } from "./dto/update-person.dto";

type PersonPayload = Omit<CreatePersonDto, "birthDate"> & { birthDate?: Date };

@Injectable()
export class PersonsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const person = await this.prisma.person.findUnique({ where: { id } });

    if (!person) {
      throw new NotFoundException("Person not found");
    }

    return person;
  }

  create(dto: CreatePersonDto) {
    return this.prisma.person.create({ data: this.toPayload(dto) });
  }

  async update(id: string, dto: UpdatePersonDto) {
    await this.findOne(id);
    return this.prisma.person.update({ where: { id }, data: this.toPayload(dto) });
  }

  private toPayload(dto: CreatePersonDto | UpdatePersonDto): PersonPayload {
    return {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined
    };
  }
}
