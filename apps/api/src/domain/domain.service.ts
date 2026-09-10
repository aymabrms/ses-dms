import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
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

@Injectable()
export class DomainService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listHouseholds(query: ProjectAreaQueryDto) {
    return this.prisma.household.findMany({ orderBy: { createdAt: "desc" }, where: query });
  }

  async getHousehold(id: string) {
    const household = await this.prisma.household.findUnique({ include: { memberships: true }, where: { id } });
    if (!household) throw new NotFoundException("Household not found");
    return household;
  }

  async createHousehold(dto: CreateProjectAreaDto) {
    await this.validateProjectArea(dto.projectId, dto.surveyAreaId);
    return this.prisma.household.create({ data: dto });
  }

  async updateHousehold(id: string, dto: CreateProjectAreaDto) {
    await this.getHousehold(id);
    await this.validateProjectArea(dto.projectId, dto.surveyAreaId);
    return this.prisma.household.update({ data: dto, where: { id } });
  }

  async listHouseholdMembers(householdId: string) {
    await this.getHousehold(householdId);
    return this.prisma.householdMembership.findMany({ orderBy: { memberOrder: "asc" }, where: { householdId } });
  }

  async addHouseholdMember(householdId: string, dto: CreateHouseholdMembershipDto) {
    await this.getHousehold(householdId);
    await this.ensurePerson(dto.personId);
    await this.validateHouseholdRelationshipLookup(dto.relationshipLookupValueId);
    await this.ensureNoHouseholdDuplicate(householdId, dto.personId);
    return this.prisma.householdMembership.create({ data: { ...dto, householdId } });
  }

  async updateHouseholdMember(householdId: string, membershipId: string, dto: UpdateHouseholdMembershipDto) {
    await this.getHousehold(householdId);
    await this.validateHouseholdRelationshipLookup(dto.relationshipLookupValueId);
    const membership = await this.prisma.householdMembership.findFirst({ where: { householdId, id: membershipId } });
    if (!membership) throw new NotFoundException("Household membership not found");
    return this.prisma.householdMembership.update({ data: dto, where: { id: membershipId } });
  }

  listOrganizations() {
    return this.prisma.organization.findMany({ orderBy: { createdAt: "desc" } });
  }

  async getOrganization(id: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (!organization) throw new NotFoundException("Organization not found");
    return organization;
  }

  createOrganization(dto: CreateOrganizationDto) {
    return this.prisma.organization.create({ data: dto });
  }

  async updateOrganization(id: string, dto: UpdateOrganizationDto) {
    await this.getOrganization(id);
    return this.prisma.organization.update({ data: dto, where: { id } });
  }

  listBusinesses(query: ProjectAreaQueryDto) {
    return this.prisma.business.findMany({ orderBy: { createdAt: "desc" }, where: query });
  }

  async getBusiness(id: string) {
    const business = await this.prisma.business.findUnique({ include: { employees: true, ownerships: true }, where: { id } });
    if (!business) throw new NotFoundException("Business not found");
    return business;
  }

  async createBusiness(dto: CreateBusinessDto) {
    await this.validateProjectArea(dto.projectId, dto.surveyAreaId);
    return this.prisma.business.create({ data: { ...dto, startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined } });
  }

  async updateBusiness(id: string, dto: UpdateBusinessDto) {
    await this.getBusiness(id);
    return this.prisma.business.update({ data: { ...dto, startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined }, where: { id } });
  }

  async listBusinessOwners(businessId: string) {
    await this.getBusiness(businessId);
    return this.prisma.businessOwnership.findMany({ where: { businessId } });
  }

  async addBusinessOwner(businessId: string, dto: OwnerDto) {
    await this.getBusiness(businessId);
    await this.validateOwner(dto.personId, dto.organizationId);
    return this.prisma.businessOwnership.create({ data: { ...dto, businessId } });
  }

  async updateBusinessOwner(businessId: string, ownershipId: string, dto: OwnerDto) {
    await this.getBusiness(businessId);
    await this.validateOwner(dto.personId, dto.organizationId);
    await this.ensureBusinessOwner(businessId, ownershipId);
    return this.prisma.businessOwnership.update({ data: dto, where: { id: ownershipId } });
  }

  async listBusinessEmployees(businessId: string) {
    await this.getBusiness(businessId);
    return this.prisma.businessEmployee.findMany({ where: { businessId } });
  }

  async addBusinessEmployee(businessId: string, dto: BusinessEmployeeDto) {
    await this.getBusiness(businessId);
    await this.ensurePerson(dto.personId);
    await this.ensureNoBusinessEmployeeDuplicate(businessId, dto.personId);
    return this.prisma.businessEmployee.create({ data: { ...dto, businessId } });
  }

  async updateBusinessEmployee(businessId: string, employeeId: string, dto: UpdateBusinessEmployeeDto) {
    await this.getBusiness(businessId);
    await this.ensureBusinessEmployee(businessId, employeeId);
    return this.prisma.businessEmployee.update({ data: dto, where: { id: employeeId } });
  }

  listLandParcels(query: ProjectAreaQueryDto) {
    return this.prisma.landParcel.findMany({ orderBy: { createdAt: "desc" }, where: query });
  }

  async getLandParcel(id: string) {
    const landParcel = await this.prisma.landParcel.findUnique({ include: { ownerships: true }, where: { id } });
    if (!landParcel) throw new NotFoundException("Land parcel not found");
    return landParcel;
  }

  async createLandParcel(dto: CreateLandParcelDto) {
    await this.validateProjectArea(dto.projectId, dto.surveyAreaId);
    return this.prisma.landParcel.create({ data: dto });
  }

  async updateLandParcel(id: string, dto: UpdateLandParcelDto) {
    await this.getLandParcel(id);
    return this.prisma.landParcel.update({ data: dto, where: { id } });
  }

  async listLandOwners(landParcelId: string) {
    await this.getLandParcel(landParcelId);
    return this.prisma.landOwnership.findMany({ where: { landParcelId } });
  }

  async addLandOwner(landParcelId: string, dto: LandOwnerDto) {
    await this.getLandParcel(landParcelId);
    await this.validateOwner(dto.personId, dto.organizationId);
    return this.prisma.landOwnership.create({ data: { ...dto, landParcelId } });
  }

  async updateLandOwner(landParcelId: string, ownershipId: string, dto: LandOwnerDto) {
    await this.getLandParcel(landParcelId);
    await this.validateOwner(dto.personId, dto.organizationId);
    await this.ensureLandOwner(landParcelId, ownershipId);
    return this.prisma.landOwnership.update({ data: dto, where: { id: ownershipId } });
  }

  listStructures(query: StructureQueryDto) {
    return this.prisma.structure.findMany({ orderBy: { createdAt: "desc" }, where: query });
  }

  async getStructure(id: string) {
    const structure = await this.prisma.structure.findUnique({ include: { occupancies: true, tags: true }, where: { id } });
    if (!structure) throw new NotFoundException("Structure not found");
    return structure;
  }

  async createStructure(dto: CreateStructureDto) {
    await this.validateProjectArea(dto.projectId, dto.surveyAreaId);
    await this.validateStructureLand(dto.projectId, dto.landParcelId);
    return this.prisma.structure.create({ data: dto });
  }

  async updateStructure(id: string, dto: UpdateStructureDto) {
    const structure = await this.getStructure(id);
    await this.validateStructureLand(structure.projectId, dto.landParcelId);
    return this.prisma.structure.update({ data: dto, where: { id } });
  }

  async listStructureTags(structureId: string) {
    await this.getStructure(structureId);
    return this.prisma.structureTag.findMany({ where: { structureId } });
  }

  async addStructureTag(structureId: string, dto: StructureTagDto) {
    const structure = await this.getStructure(structureId);
    await this.validateOptionalSurveyArea(structure.projectId, dto.surveyAreaId);
    await this.ensureNoStructureTagDuplicate(structureId, dto.tagValue, dto.sourceRaw);
    return this.prisma.structureTag.create({ data: { ...dto, projectId: structure.projectId, structureId } });
  }

  async updateStructureTag(structureId: string, tagId: string, dto: StructureTagDto) {
    const structure = await this.getStructure(structureId);
    await this.validateOptionalSurveyArea(structure.projectId, dto.surveyAreaId);
    const tag = await this.prisma.structureTag.findFirst({ where: { id: tagId, structureId } });
    if (!tag) throw new NotFoundException("Structure tag not found");
    return this.prisma.structureTag.update({ data: { ...dto, projectId: structure.projectId }, where: { id: tagId } });
  }

  async listStructureAssociations(structureId: string) {
    await this.getStructure(structureId);
    return this.prisma.structureAssociation.findMany({ where: { parentStructureId: structureId } });
  }

  async addStructureAssociation(structureId: string, dto: StructureAssociationDto) {
    if (structureId === dto.childStructureId) throw new BadRequestException("Structure cannot be associated with itself");
    const [parent, child] = await Promise.all([this.getStructure(structureId), this.getStructure(dto.childStructureId)]);
    if (parent.projectId !== child.projectId) throw new BadRequestException("Associated structures must belong to the same project");
    const duplicate = await this.prisma.structureAssociation.findFirst({ where: { childStructureId: dto.childStructureId, parentStructureId: structureId } });
    if (duplicate) throw new ConflictException("Structure association already exists");
    return this.prisma.structureAssociation.create({ data: { ...dto, parentStructureId: structureId } });
  }

  async listStructureOccupancies(structureId: string) {
    await this.getStructure(structureId);
    return this.prisma.structureOccupancy.findMany({ where: { structureId } });
  }

  async addStructureOccupancy(structureId: string, dto: StructureOccupancyDto) {
    const structure = await this.getStructure(structureId);
    await this.validateOccupancy(structure.projectId, dto);
    return this.prisma.structureOccupancy.create({ data: this.toOccupancyData(structureId, dto) });
  }

  async updateStructureOccupancy(structureId: string, occupancyId: string, dto: StructureOccupancyDto) {
    const structure = await this.getStructure(structureId);
    await this.validateOccupancy(structure.projectId, dto);
    const occupancy = await this.prisma.structureOccupancy.findFirst({ where: { id: occupancyId, structureId } });
    if (!occupancy) throw new NotFoundException("Structure occupancy not found");
    return this.prisma.structureOccupancy.update({ data: this.toOccupancyData(structureId, dto), where: { id: occupancyId } });
  }

  private async validateProjectArea(projectId: string, surveyAreaId: string) {
    const [project, surveyArea] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.surveyArea.findUnique({ where: { id: surveyAreaId } })
    ]);
    if (!project) throw new BadRequestException("Referenced project does not exist");
    if (!surveyArea) throw new BadRequestException("Referenced survey area does not exist");
    if (surveyArea.projectId !== projectId) throw new BadRequestException("Survey area must belong to the selected project");
  }

  private async ensurePerson(personId: string) {
    if (!(await this.prisma.person.findUnique({ where: { id: personId } }))) throw new BadRequestException("Referenced person does not exist");
  }

  private async validateOwner(personId?: string, organizationId?: string) {
    if ((personId ? 1 : 0) + (organizationId ? 1 : 0) !== 1) throw new BadRequestException("Exactly one of personId or organizationId is required");
    if (personId) await this.ensurePerson(personId);
    if (organizationId && !(await this.prisma.organization.findUnique({ where: { id: organizationId } }))) throw new BadRequestException("Referenced organization does not exist");
  }

  private async validateHouseholdRelationshipLookup(lookupValueId?: string) {
    if (!lookupValueId) return;
    const value = await this.prisma.lookupValue.findUnique({ include: { lookupSet: true }, where: { id: lookupValueId } });
    if (!value) throw new BadRequestException("Referenced relationship lookup value does not exist");
    if (value.lookupSet.code !== "HOUSEHOLD_RELATIONSHIP") throw new BadRequestException("Relationship lookup value must belong to HOUSEHOLD_RELATIONSHIP");
  }

  private async validateStructureLand(projectId: string, landParcelId?: string) {
    if (!landParcelId) return;
    const land = await this.prisma.landParcel.findUnique({ where: { id: landParcelId } });
    if (!land) throw new BadRequestException("Referenced land parcel does not exist");
    if (land.projectId !== projectId) throw new BadRequestException("Structure cannot link to a land parcel from another project");
  }

  private async validateOptionalSurveyArea(projectId: string, surveyAreaId?: string) {
    if (!surveyAreaId) return;
    const area = await this.prisma.surveyArea.findUnique({ where: { id: surveyAreaId } });
    if (!area) throw new BadRequestException("Referenced survey area does not exist");
    if (area.projectId !== projectId) throw new BadRequestException("Survey area must belong to the structure project");
  }

  private async validateOccupancy(projectId: string, dto: StructureOccupancyDto) {
    if ((dto.householdId ? 1 : 0) + (dto.businessId ? 1 : 0) + (dto.personId ? 1 : 0) !== 1) throw new BadRequestException("Exactly one occupant type is required");
    if (dto.startedAt && dto.endedAt && new Date(dto.startedAt) > new Date(dto.endedAt)) throw new BadRequestException("startedAt must be before or equal to endedAt");
    if (dto.householdId) {
      const h = await this.prisma.household.findUnique({ where: { id: dto.householdId } });
      if (!h) throw new BadRequestException("Referenced household does not exist");
      if (h.projectId !== projectId) throw new BadRequestException("Household occupant must belong to the structure project");
    }
    if (dto.businessId) {
      const b = await this.prisma.business.findUnique({ where: { id: dto.businessId } });
      if (!b) throw new BadRequestException("Referenced business does not exist");
      if (b.projectId !== projectId) throw new BadRequestException("Business occupant must belong to the structure project");
    }
    if (dto.personId) await this.ensurePerson(dto.personId);
  }

  private toOccupancyData(structureId: string, dto: StructureOccupancyDto) {
    return { ...dto, endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined, startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined, structureId };
  }

  private async ensureNoHouseholdDuplicate(householdId: string, personId: string) {
    if (await this.prisma.householdMembership.findFirst({ where: { householdId, personId } })) throw new ConflictException("Household membership already exists");
  }

  private async ensureNoBusinessEmployeeDuplicate(businessId: string, personId: string) {
    if (await this.prisma.businessEmployee.findFirst({ where: { businessId, personId } })) throw new ConflictException("Business employee already exists");
  }

  private async ensureNoStructureTagDuplicate(structureId: string, tagValue: string, sourceRaw?: string) {
    if (await this.prisma.structureTag.findFirst({ where: { sourceRaw, structureId, tagValue } })) throw new ConflictException("Structure tag already exists for this structure/source");
  }

  private async ensureBusinessOwner(businessId: string, id: string) {
    if (!(await this.prisma.businessOwnership.findFirst({ where: { businessId, id } }))) throw new NotFoundException("Business ownership not found");
  }

  private async ensureLandOwner(landParcelId: string, id: string) {
    if (!(await this.prisma.landOwnership.findFirst({ where: { id, landParcelId } }))) throw new NotFoundException("Land ownership not found");
  }

  private async ensureBusinessEmployee(businessId: string, id: string) {
    if (!(await this.prisma.businessEmployee.findFirst({ where: { businessId, id } }))) throw new NotFoundException("Business employee not found");
  }
}
