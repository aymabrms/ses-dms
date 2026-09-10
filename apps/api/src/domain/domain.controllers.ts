import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { DomainService } from "./domain.service";
import {
  BusinessEmployeeDto,
  CreateBusinessDto,
  CreateHouseholdMembershipDto,
  CreateLandParcelDto,
  CreateOrganizationDto,
  CreateProjectAreaDto,
  CreateStructureDto,
  LandOwnerDto,
  OwnerDto,
  ProjectAreaQueryDto,
  StructureAssociationDto,
  StructureOccupancyDto,
  StructureQueryDto,
  StructureTagDto,
  UpdateBusinessDto,
  UpdateBusinessEmployeeDto,
  UpdateHouseholdMembershipDto,
  UpdateLandParcelDto,
  UpdateOrganizationDto,
  UpdateStructureDto
} from "./dto/domain.dto";

@ApiTags("households")
@Controller("households")
export class HouseholdsController {
  constructor(@Inject(DomainService) private readonly domain: DomainService) {}

  @Get()
  list(@Query() query: ProjectAreaQueryDto) { return this.domain.listHouseholds(query); }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) { return this.domain.getHousehold(id); }

  @Post()
  create(@Body() dto: CreateProjectAreaDto) { return this.domain.createHousehold(dto); }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CreateProjectAreaDto) { return this.domain.updateHousehold(id, dto); }

  @Get(":householdId/members")
  members(@Param("householdId", ParseUUIDPipe) householdId: string) { return this.domain.listHouseholdMembers(householdId); }

  @Post(":householdId/members")
  addMember(@Param("householdId", ParseUUIDPipe) householdId: string, @Body() dto: CreateHouseholdMembershipDto) { return this.domain.addHouseholdMember(householdId, dto); }

  @Patch(":householdId/members/:membershipId")
  updateMember(@Param("householdId", ParseUUIDPipe) householdId: string, @Param("membershipId", ParseUUIDPipe) membershipId: string, @Body() dto: UpdateHouseholdMembershipDto) { return this.domain.updateHouseholdMember(householdId, membershipId, dto); }
}

@ApiTags("organizations")
@Controller("organizations")
export class OrganizationsController {
  constructor(@Inject(DomainService) private readonly domain: DomainService) {}

  @Get()
  list() { return this.domain.listOrganizations(); }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) { return this.domain.getOrganization(id); }

  @Post()
  create(@Body() dto: CreateOrganizationDto) { return this.domain.createOrganization(dto); }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateOrganizationDto) { return this.domain.updateOrganization(id, dto); }
}

@ApiTags("businesses")
@Controller("businesses")
export class BusinessesController {
  constructor(@Inject(DomainService) private readonly domain: DomainService) {}

  @Get()
  list(@Query() query: ProjectAreaQueryDto) { return this.domain.listBusinesses(query); }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) { return this.domain.getBusiness(id); }

  @Post()
  create(@Body() dto: CreateBusinessDto) { return this.domain.createBusiness(dto); }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateBusinessDto) { return this.domain.updateBusiness(id, dto); }

  @Get(":businessId/owners")
  owners(@Param("businessId", ParseUUIDPipe) businessId: string) { return this.domain.listBusinessOwners(businessId); }

  @Post(":businessId/owners")
  addOwner(@Param("businessId", ParseUUIDPipe) businessId: string, @Body() dto: OwnerDto) { return this.domain.addBusinessOwner(businessId, dto); }

  @Patch(":businessId/owners/:ownershipId")
  updateOwner(@Param("businessId", ParseUUIDPipe) businessId: string, @Param("ownershipId", ParseUUIDPipe) ownershipId: string, @Body() dto: OwnerDto) { return this.domain.updateBusinessOwner(businessId, ownershipId, dto); }

  @Get(":businessId/employees")
  employees(@Param("businessId", ParseUUIDPipe) businessId: string) { return this.domain.listBusinessEmployees(businessId); }

  @Post(":businessId/employees")
  addEmployee(@Param("businessId", ParseUUIDPipe) businessId: string, @Body() dto: BusinessEmployeeDto) { return this.domain.addBusinessEmployee(businessId, dto); }

  @Patch(":businessId/employees/:employeeId")
  updateEmployee(@Param("businessId", ParseUUIDPipe) businessId: string, @Param("employeeId", ParseUUIDPipe) employeeId: string, @Body() dto: UpdateBusinessEmployeeDto) { return this.domain.updateBusinessEmployee(businessId, employeeId, dto); }
}

@ApiTags("land parcels")
@Controller("land-parcels")
export class LandParcelsController {
  constructor(@Inject(DomainService) private readonly domain: DomainService) {}

  @Get()
  list(@Query() query: ProjectAreaQueryDto) { return this.domain.listLandParcels(query); }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) { return this.domain.getLandParcel(id); }

  @Post()
  create(@Body() dto: CreateLandParcelDto) { return this.domain.createLandParcel(dto); }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateLandParcelDto) { return this.domain.updateLandParcel(id, dto); }

  @Get(":landParcelId/owners")
  owners(@Param("landParcelId", ParseUUIDPipe) landParcelId: string) { return this.domain.listLandOwners(landParcelId); }

  @Post(":landParcelId/owners")
  addOwner(@Param("landParcelId", ParseUUIDPipe) landParcelId: string, @Body() dto: LandOwnerDto) { return this.domain.addLandOwner(landParcelId, dto); }

  @Patch(":landParcelId/owners/:ownershipId")
  updateOwner(@Param("landParcelId", ParseUUIDPipe) landParcelId: string, @Param("ownershipId", ParseUUIDPipe) ownershipId: string, @Body() dto: LandOwnerDto) { return this.domain.updateLandOwner(landParcelId, ownershipId, dto); }
}

@ApiTags("structures")
@Controller("structures")
export class StructuresController {
  constructor(@Inject(DomainService) private readonly domain: DomainService) {}

  @Get()
  list(@Query() query: StructureQueryDto) { return this.domain.listStructures(query); }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) { return this.domain.getStructure(id); }

  @Post()
  create(@Body() dto: CreateStructureDto) { return this.domain.createStructure(dto); }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateStructureDto) { return this.domain.updateStructure(id, dto); }

  @Get(":structureId/tags")
  tags(@Param("structureId", ParseUUIDPipe) structureId: string) { return this.domain.listStructureTags(structureId); }

  @Post(":structureId/tags")
  addTag(@Param("structureId", ParseUUIDPipe) structureId: string, @Body() dto: StructureTagDto) { return this.domain.addStructureTag(structureId, dto); }

  @Patch(":structureId/tags/:tagId")
  updateTag(@Param("structureId", ParseUUIDPipe) structureId: string, @Param("tagId", ParseUUIDPipe) tagId: string, @Body() dto: StructureTagDto) { return this.domain.updateStructureTag(structureId, tagId, dto); }

  @Get(":structureId/associations")
  associations(@Param("structureId", ParseUUIDPipe) structureId: string) { return this.domain.listStructureAssociations(structureId); }

  @Post(":structureId/associations")
  addAssociation(@Param("structureId", ParseUUIDPipe) structureId: string, @Body() dto: StructureAssociationDto) { return this.domain.addStructureAssociation(structureId, dto); }

  @Get(":structureId/occupancies")
  occupancies(@Param("structureId", ParseUUIDPipe) structureId: string) { return this.domain.listStructureOccupancies(structureId); }

  @Post(":structureId/occupancies")
  addOccupancy(@Param("structureId", ParseUUIDPipe) structureId: string, @Body() dto: StructureOccupancyDto) { return this.domain.addStructureOccupancy(structureId, dto); }

  @Patch(":structureId/occupancies/:occupancyId")
  updateOccupancy(@Param("structureId", ParseUUIDPipe) structureId: string, @Param("occupancyId", ParseUUIDPipe) occupancyId: string, @Body() dto: StructureOccupancyDto) { return this.domain.updateStructureOccupancy(structureId, occupancyId, dto); }
}
