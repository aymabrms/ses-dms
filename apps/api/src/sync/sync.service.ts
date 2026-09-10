import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ResponseState, SyncRequestStatus, ValidationSeverity } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { SyncBootstrapQueryDto, SyncInterviewsDto, SyncModuleDto, SyncRepeatInstanceDto, SyncResponseDto } from "./dto/sync.dto";

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
        for (const module of interview.modules) {
          results.push(await this.syncModule(interview.interviewId, module));
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
