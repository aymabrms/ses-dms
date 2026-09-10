import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ResponseState, SyncRequestStatus, ValidationSeverity } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import {
  SyncBootstrapQueryDto,
  SyncBusinessDto,
  SyncBusinessEmployeeDto,
  SyncCreateModuleDto,
  SyncHouseholdMembershipDto,
  SyncInterviewCreateDto,
  SyncInterviewDto,
  SyncInterviewsDto,
  SyncLandParcelDto,
  SyncModuleDto,
  SyncPersonDto,
  SyncProjectAreaRecordDto,
  SyncRepeatInstanceDto,
  SyncResponseDto,
  SyncStructureDto
} from "./dto/sync.dto";

type Tx = Prisma.TransactionClient;
type ModuleWithInterview = Prisma.InterviewModuleGetPayload<{ include: { interview: true } }>;

@Injectable()
export class SyncService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async bootstrap(query: SyncBootstrapQueryDto) {
    const [projects, surveyAreas, questionnaireVersions, lookupSets, lookupValues] = await Promise.all([
      this.prisma.project.findMany({ orderBy: { code: "asc" }, where: query.projectId ? { id: query.projectId } : undefined }),
      this.prisma.surveyArea.findMany({ orderBy: [{ projectId: "asc" }, { name: "asc" }], where: { projectId: query.projectId } }),
      this.prisma.questionnaireVersion.findMany({
        orderBy: [{ moduleType: "asc" }, { versionCode: "asc" }],
        where: query.projectId ? { isActive: true, OR: [{ projectId: query.projectId }, { projectId: null }] } : { isActive: true }
      }),
      this.prisma.lookupSet.findMany({ orderBy: { code: "asc" } }),
      this.prisma.lookupValue.findMany({ orderBy: [{ lookupSetId: "asc" }, { sortOrder: "asc" }, { code: "asc" }] })
    ]);

    return { lookupSets, lookupValues, projects, questionnaireVersions, surveyAreas };
  }

  async interviewStatus(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({ include: { modules: true }, where: { id: interviewId } });
    if (!interview) throw new NotFoundException("Interview not found");

    const modules = await Promise.all(
      interview.modules.map(async (module) => {
        const validationIssueCount = await this.prisma.validationIssue.count({ where: { interviewModuleId: module.id, status: "OPEN" } });
        return {
          moduleId: module.id,
          moduleStatus: module.status,
          moduleType: module.moduleType,
          revision: module.revision,
          validationIssueCount
        };
      })
    );

    return { interviewId: interview.id, status: interview.status, modules };
  }

  async syncInterviews(dto: SyncInterviewsDto) {
    const existing = await this.prisma.syncRequest.findUnique({ where: { clientRequestId: dto.syncRequestId } });
    const requestJson = dto as unknown as Prisma.InputJsonValue;

    if (existing) {
      if (existing.status === SyncRequestStatus.COMPLETED && existing.responseJson) {
        return existing.responseJson;
      }

      throw new ConflictException("syncRequestId is already being processed");
    }

    const receipt = await this.prisma.syncRequest.create({ data: { clientRequestId: dto.syncRequestId, requestJson, status: SyncRequestStatus.PENDING } });

    try {
      const results = [] as Array<Record<string, unknown>>;
      for (const interview of dto.interviews) {
        if (interview.interview) {
          results.push(...(await this.createInterviewGraph(interview)));
        } else {
          if (!interview.interviewId) throw new BadRequestException("interviewId is required for existing interview sync");
          for (const module of interview.modules) {
            results.push(await this.syncModule(interview.interviewId, module));
          }
        }
      }

      const response = { results };
      await this.prisma.syncRequest.update({
        data: { completedAt: new Date(), responseJson: response as Prisma.InputJsonValue, status: SyncRequestStatus.COMPLETED },
        where: { id: receipt.id }
      });
      return response;
    } catch (error) {
      await this.prisma.syncRequest.update({ data: { status: SyncRequestStatus.FAILED }, where: { id: receipt.id } });
      throw error;
    }
  }

  private async syncModule(interviewId: string, moduleDto: SyncModuleDto) {
    const module = await this.prisma.interviewModule.findUnique({ include: { interview: true }, where: { id: moduleDto.moduleId } });
    if (!module || module.interviewId !== interviewId) {
      throw new BadRequestException("Sync module must belong to the selected interview");
    }

    if (module.revision !== moduleDto.expectedRevision) {
      return { currentRevision: module.revision, interviewId, moduleId: moduleDto.moduleId, status: "CONFLICT" };
    }

    this.validateResponseItems(moduleDto.responses ?? []);
    await this.validateRepeatInstanceDtos(module, moduleDto.repeatInstances ?? []);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.interviewModule.updateMany({
        data: { revision: { increment: 1 } },
        where: { id: moduleDto.moduleId, interviewId, revision: moduleDto.expectedRevision }
      });

      if (updated.count !== 1) {
        const current = await tx.interviewModule.findUniqueOrThrow({ where: { id: moduleDto.moduleId } });
        return { currentRevision: current.revision, interviewId, moduleId: moduleDto.moduleId, status: "CONFLICT" };
      }

      for (const repeat of moduleDto.repeatInstances ?? []) {
        await this.upsertRepeatInstance(tx, moduleDto.moduleId, repeat);
      }

      await this.validateResponseRepeatReferences(tx, moduleDto.moduleId, moduleDto.responses ?? []);

      for (const response of moduleDto.responses ?? []) {
        const saved = await this.writeResponse(tx, moduleDto.moduleId, response);
        await this.createTechnicalIssuesForResponse(tx, interviewId, moduleDto.moduleId, saved.id, response);
      }

      const current = await tx.interviewModule.findUniqueOrThrow({ where: { id: moduleDto.moduleId } });
      return { interviewId, moduleId: moduleDto.moduleId, revision: current.revision, status: "ACCEPTED" };
    });
  }

  private async createInterviewGraph(dto: SyncInterviewDto) {
    if (!dto.interview) throw new BadRequestException("interview is required for create-on-sync");
    const interview = dto.interview;

    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.validateCreateGraphReferences(tx, dto);

        for (const person of dto.persons ?? []) await this.upsertPerson(tx, person);

        await this.upsertInterview(tx, interview);

        for (const household of dto.households ?? []) await this.upsertHousehold(tx, household, interview.projectId);
        for (const business of dto.businesses ?? []) await this.upsertBusiness(tx, business, interview.projectId);
        for (const land of dto.landParcels ?? []) await this.upsertLandParcel(tx, land, interview.projectId);
        for (const structure of dto.structures ?? []) await this.upsertStructure(tx, structure, interview.projectId);
        for (const membership of dto.householdMemberships ?? []) await this.upsertHouseholdMembership(tx, membership);
        for (const employee of dto.businessEmployees ?? []) await this.upsertBusinessEmployee(tx, employee);

        const results = [] as Array<Record<string, unknown>>;
        for (const module of dto.modules) {
          const createdModule = await this.upsertInterviewModule(tx, interview.id, module);
          for (const repeat of module.repeatInstances ?? []) await this.upsertRepeatInstance(tx, createdModule.id, repeat);
          await this.validateResponseRepeatReferences(tx, createdModule.id, module.responses ?? []);
          for (const response of module.responses ?? []) {
            const saved = await this.writeResponse(tx, createdModule.id, response);
            await this.createTechnicalIssuesForResponse(tx, interview.id, createdModule.id, saved.id, response);
          }
          results.push({ interviewId: interview.id, moduleId: createdModule.id, revision: createdModule.revision, status: "ACCEPTED" });
        }

        return results;
      });
    } catch (error) {
      return [
        {
          interviewId: dto.interview.id,
          message: error instanceof Error ? error.message : "Create-on-sync rejected",
          status: "REJECTED"
        }
      ];
    }
  }

  private async validateCreateGraphReferences(tx: Tx, dto: SyncInterviewDto) {
    const interview = dto.interview;
    if (!interview) throw new BadRequestException("interview is required for create-on-sync");

    const [project, surveyArea, enumerator, respondent] = await Promise.all([
      tx.project.findUnique({ where: { id: interview.projectId } }),
      tx.surveyArea.findUnique({ where: { id: interview.surveyAreaId } }),
      tx.user.findUnique({ where: { id: interview.enumeratorUserId } }),
      interview.respondentPersonId ? tx.person.findUnique({ where: { id: interview.respondentPersonId } }) : Promise.resolve(null)
    ]);

    if (!project) throw new BadRequestException("Referenced project does not exist");
    if (!surveyArea) throw new BadRequestException("Referenced survey area does not exist");
    if (surveyArea.projectId !== interview.projectId) throw new BadRequestException("Survey area must belong to the selected project");
    if (!enumerator) throw new BadRequestException("Referenced enumerator user does not exist");

    const bundlePersonIds = new Set((dto.persons ?? []).map((person) => person.id));
    if (interview.respondentPersonId && !respondent && !bundlePersonIds.has(interview.respondentPersonId)) throw new BadRequestException("Referenced respondent person does not exist");

    for (const module of dto.modules) {
      if (!module.moduleType) throw new BadRequestException("moduleType is required when creating a module");
      if (!module.questionnaireVersionId) throw new BadRequestException("questionnaireVersionId is required when creating a module");
      this.validateResponseItems(module.responses ?? []);
      const version = await tx.questionnaireVersion.findUnique({ where: { id: module.questionnaireVersionId } });
      if (!version) throw new BadRequestException("Referenced questionnaire version does not exist");
      if (version.moduleType !== module.moduleType) throw new BadRequestException("Module type must match questionnaire version module type");
    }
  }

  private async upsertPerson(tx: Tx, person: SyncPersonDto) {
    const data = {
      birthDate: person.birthDate ? new Date(person.birthDate) : null,
      firstName: person.firstName ?? null,
      genderRaw: person.genderRaw ?? null,
      id: person.id,
      lastName: person.lastName ?? null,
      maidenName: person.maidenName ?? null,
      middleName: person.middleName ?? null,
      primaryContactNumber: person.primaryContactNumber ?? null,
      primaryEmail: person.primaryEmail ?? null
    };
    return tx.person.upsert({ create: data, update: data, where: { id: person.id } });
  }

  private async upsertInterview(tx: Tx, interview: SyncInterviewCreateDto) {
    const data = {
      enumeratorUserId: interview.enumeratorUserId,
      finishedAt: interview.finishedAt ? new Date(interview.finishedAt) : null,
      id: interview.id,
      projectId: interview.projectId,
      respondentPersonId: interview.respondentPersonId ?? null,
      startedAt: new Date(interview.startedAt),
      surveyAreaId: interview.surveyAreaId,
      surveyDate: new Date(interview.surveyDate)
    };
    return tx.interview.upsert({ create: data, update: data, where: { id: interview.id } });
  }

  private async upsertHousehold(tx: Tx, household: SyncProjectAreaRecordDto, expectedProjectId: string) {
    this.validateProjectAreaRecord(household, expectedProjectId);
    return tx.household.upsert({ create: household, update: household, where: { id: household.id } });
  }

  private async upsertBusiness(tx: Tx, business: SyncBusinessDto, expectedProjectId: string) {
    this.validateProjectAreaRecord(business, expectedProjectId);
    const data = { ...business, startedAt: business.startedAt ? new Date(business.startedAt) : null };
    return tx.business.upsert({ create: data, update: data, where: { id: business.id } });
  }

  private async upsertLandParcel(tx: Tx, land: SyncLandParcelDto, expectedProjectId: string) {
    this.validateProjectAreaRecord(land, expectedProjectId);
    return tx.landParcel.upsert({ create: land, update: land, where: { id: land.id } });
  }

  private async upsertStructure(tx: Tx, structure: SyncStructureDto, expectedProjectId: string) {
    this.validateProjectAreaRecord(structure, expectedProjectId);
    return tx.structure.upsert({ create: structure, update: structure, where: { id: structure.id } });
  }

  private async upsertHouseholdMembership(tx: Tx, membership: SyncHouseholdMembershipDto) {
    return tx.householdMembership.upsert({ create: membership, update: membership, where: { id: membership.id } });
  }

  private async upsertBusinessEmployee(tx: Tx, employee: SyncBusinessEmployeeDto) {
    return tx.businessEmployee.upsert({ create: employee, update: employee, where: { id: employee.id } });
  }

  private async upsertInterviewModule(tx: Tx, interviewId: string, module: SyncCreateModuleDto) {
    if (!module.moduleType || !module.questionnaireVersionId) throw new BadRequestException("moduleType and questionnaireVersionId are required when creating a module");
    const data = {
      businessId: module.businessId ?? null,
      householdId: module.householdId ?? null,
      id: module.moduleId,
      interviewId,
      landParcelId: module.landParcelId ?? null,
      moduleType: module.moduleType,
      questionnaireVersionId: module.questionnaireVersionId,
      revision: 1,
      status: module.status ?? "DRAFT",
      structureId: module.structureId ?? null
    };
    return tx.interviewModule.upsert({ create: data, update: data, where: { id: module.moduleId } });
  }

  private validateProjectAreaRecord(record: SyncProjectAreaRecordDto, expectedProjectId: string) {
    if (record.projectId !== expectedProjectId) throw new BadRequestException("Created records must belong to the interview project");
  }

  private async upsertRepeatInstance(tx: Tx, moduleId: string, repeat: SyncRepeatInstanceDto) {
    const data = { ...repeat, interviewModuleId: moduleId };
    if (!repeat.id) return tx.questionnaireRepeatInstance.create({ data });

    const existing = await tx.questionnaireRepeatInstance.findUnique({ where: { id: repeat.id } });
    if (existing && existing.interviewModuleId !== moduleId) throw new BadRequestException("Repeat instance must belong to the selected interview module");
    if (existing) return tx.questionnaireRepeatInstance.update({ data, where: { id: repeat.id } });
    return tx.questionnaireRepeatInstance.create({ data });
  }

  private async writeResponse(tx: Tx, moduleId: string, response: SyncResponseDto) {
    const existing = await tx.questionnaireResponse.findFirst({
      where: { interviewModuleId: moduleId, questionCode: response.questionCode, repeatInstanceId: response.repeatInstanceId ?? null }
    });
    const data = this.toResponseData(moduleId, response);
    if (existing) return tx.questionnaireResponse.update({ data, where: { id: existing.id } });
    return tx.questionnaireResponse.create({ data });
  }

  private toResponseData(moduleId: string, response: SyncResponseDto): Prisma.QuestionnaireResponseUncheckedCreateInput {
    return {
      capturedAt: response.capturedAt ? new Date(response.capturedAt) : null,
      id: response.id,
      interviewModuleId: moduleId,
      questionCode: response.questionCode,
      rawValue: response.rawValue ?? null,
      repeatInstanceId: response.repeatInstanceId ?? null,
      responseState: response.responseState,
      valueBoolean: response.valueBoolean ?? null,
      valueDate: response.valueDate ? new Date(response.valueDate) : null,
      valueJson: response.valueJson ? (response.valueJson as Prisma.InputJsonValue) : Prisma.JsonNull,
      valueNumber: response.valueNumber ?? null,
      valueText: response.valueText ?? null
    };
  }

  private validateResponseItems(responses: SyncResponseDto[]) {
    for (const response of responses) {
      const typedValues = [response.valueText, response.valueNumber, response.valueBoolean, response.valueDate, response.valueJson].filter((value) => value !== undefined);
      if (typedValues.length > 1) throw new BadRequestException("Only one typed value field may be supplied per questionnaire response");
    }
  }

  private async validateRepeatInstanceDtos(module: ModuleWithInterview, repeats: SyncRepeatInstanceDto[]) {
    const repeatIds = new Set(repeats.map((repeat) => repeat.id).filter((id): id is string => Boolean(id)));

    for (const repeat of repeats) {
      if (repeat.parentRepeatInstanceId) {
        if (repeat.parentRepeatInstanceId === repeat.id) throw new BadRequestException("Repeat instance cannot be its own parent");
        const parent = await this.prisma.questionnaireRepeatInstance.findUnique({ where: { id: repeat.parentRepeatInstanceId } });
        if (!parent && !repeatIds.has(repeat.parentRepeatInstanceId)) throw new BadRequestException("Referenced parent repeat instance does not exist");
        if (parent && parent.interviewModuleId !== module.id) throw new BadRequestException("Parent repeat instance must belong to the selected interview module");
      }

      if (repeat.linkedPersonId && !(await this.prisma.person.findUnique({ where: { id: repeat.linkedPersonId } }))) throw new BadRequestException("Referenced linked person does not exist");

      if (repeat.linkedHouseholdMembershipId) {
        const membership = await this.prisma.householdMembership.findUnique({ include: { household: true }, where: { id: repeat.linkedHouseholdMembershipId } });
        if (!membership) throw new BadRequestException("Referenced linked household membership does not exist");
        if (membership.household.projectId !== module.interview.projectId) throw new BadRequestException("Linked household membership must belong to the interview project");
      }

      if (repeat.linkedBusinessEmployeeId) {
        const employee = await this.prisma.businessEmployee.findUnique({ include: { business: true }, where: { id: repeat.linkedBusinessEmployeeId } });
        if (!employee) throw new BadRequestException("Referenced linked business employee does not exist");
        if (employee.business.projectId !== module.interview.projectId) throw new BadRequestException("Linked business employee must belong to the interview project");
      }

      if (repeat.linkedStructureId) {
        const structure = await this.prisma.structure.findUnique({ where: { id: repeat.linkedStructureId } });
        if (!structure) throw new BadRequestException("Referenced linked structure does not exist");
        if (structure.projectId !== module.interview.projectId) throw new BadRequestException("Linked structure must belong to the interview project");
      }
    }
  }

  private async validateResponseRepeatReferences(tx: Tx, moduleId: string, responses: SyncResponseDto[]) {
    const repeatIds = [...new Set(responses.map((response) => response.repeatInstanceId).filter((id): id is string => Boolean(id)))];
    if (repeatIds.length === 0) return;
    const repeats = await tx.questionnaireRepeatInstance.findMany({ where: { id: { in: repeatIds } } });
    const repeatsById = new Map(repeats.map((repeat) => [repeat.id, repeat]));
    for (const repeatId of repeatIds) {
      const repeat = repeatsById.get(repeatId);
      if (!repeat) throw new BadRequestException(`Referenced repeat instance does not exist: ${repeatId}`);
      if (repeat.interviewModuleId !== moduleId) throw new BadRequestException("Repeat instance must belong to the selected interview module");
    }
  }

  private async createTechnicalIssuesForResponse(tx: Tx, interviewId: string, moduleId: string, responseId: string, response: SyncResponseDto) {
    const hasValue = this.hasAnyValue(response);
    if (response.responseState === ResponseState.ANSWERED && !hasValue) {
      await tx.validationIssue.create({ data: { code: "ANSWERED_WITHOUT_VALUE", interviewId, interviewModuleId: moduleId, message: "Response is marked ANSWERED but no value was supplied.", questionnaireResponseId: responseId, severity: ValidationSeverity.WARNING } });
    }
    if (response.responseState === ResponseState.NO_RESPONSE && hasValue) {
      await tx.validationIssue.create({ data: { code: "NO_RESPONSE_WITH_VALUE", interviewId, interviewModuleId: moduleId, message: "Response is marked NO_RESPONSE but a value was supplied.", questionnaireResponseId: responseId, severity: ValidationSeverity.WARNING } });
    }
  }

  private hasAnyValue(response: SyncResponseDto) {
    return [response.valueText, response.valueNumber, response.valueBoolean, response.valueDate, response.valueJson, response.rawValue].some((value) => value !== undefined && value !== null);
  }
}
