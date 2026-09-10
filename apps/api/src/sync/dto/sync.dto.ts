import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ModuleStatus, QuestionnaireModuleType, ResponseState } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";

export class SyncBootstrapQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

export class SyncRepeatInstanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  groupCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentRepeatInstanceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  sequenceNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedPersonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedHouseholdMembershipId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedBusinessEmployeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linkedStructureId?: string;
}

export class SyncResponseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  repeatInstanceId?: string;

  @ApiProperty({ enum: ResponseState })
  @IsEnum(ResponseState)
  responseState!: ResponseState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  valueText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  valueNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  valueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  valueJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  capturedAt?: string;
}

export class SyncModuleDto {
  @ApiProperty()
  @IsUUID()
  moduleId!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @ApiPropertyOptional({ type: [SyncRepeatInstanceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncRepeatInstanceDto)
  repeatInstances?: SyncRepeatInstanceDto[];

  @ApiPropertyOptional({ type: [SyncResponseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncResponseDto)
  responses?: SyncResponseDto[];
}

export class SyncPersonDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maidenName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genderRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryContactNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryEmail?: string;
}

export class SyncInterviewCreateDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiProperty()
  @IsUUID()
  surveyAreaId!: string;

  @ApiProperty()
  @IsUUID()
  enumeratorUserId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  respondentPersonId?: string;

  @ApiProperty()
  @IsDateString()
  surveyDate!: string;

  @ApiProperty()
  @IsDateString()
  startedAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  finishedAt?: string;
}

export class SyncProjectAreaRecordDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiProperty()
  @IsUUID()
  surveyAreaId!: string;
}

export class SyncHouseholdMembershipDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  householdId!: string;

  @ApiProperty()
  @IsUUID()
  personId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relationshipToHeadRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relationshipLookupValueId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  memberOrder?: number;
}

export class SyncBusinessDto extends SyncProjectAreaRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  natureOfBusinessRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownershipTypeRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startedAt?: string;
}

export class SyncBusinessEmployeeDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsUUID()
  businessId!: string;

  @ApiProperty()
  @IsUUID()
  personId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employmentStatusRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workAssignmentRaw?: string;
}

export class SyncLandParcelDto extends SyncProjectAreaRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  areaValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  areaUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landUseRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownershipTypeRaw?: string;
}

export class SyncStructureDto extends SyncProjectAreaRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  landParcelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  structureUseRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  structureTypeRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  structureConditionRaw?: string;
}

export class SyncCreateModuleDto extends SyncModuleDto {
  @ApiPropertyOptional({ enum: QuestionnaireModuleType })
  @IsOptional()
  @IsEnum(QuestionnaireModuleType)
  moduleType?: QuestionnaireModuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  questionnaireVersionId?: string;

  @ApiPropertyOptional({ enum: ModuleStatus })
  @IsOptional()
  @IsEnum(ModuleStatus)
  status?: ModuleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  householdId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  landParcelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  structureId?: string;
}

export class SyncInterviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  interviewId?: string;

  @ApiPropertyOptional({ type: SyncInterviewCreateDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SyncInterviewCreateDto)
  interview?: SyncInterviewCreateDto;

  @ApiPropertyOptional({ type: [SyncPersonDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncPersonDto)
  persons?: SyncPersonDto[];

  @ApiPropertyOptional({ type: [SyncProjectAreaRecordDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncProjectAreaRecordDto)
  households?: SyncProjectAreaRecordDto[];

  @ApiPropertyOptional({ type: [SyncHouseholdMembershipDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncHouseholdMembershipDto)
  householdMemberships?: SyncHouseholdMembershipDto[];

  @ApiPropertyOptional({ type: [SyncBusinessDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncBusinessDto)
  businesses?: SyncBusinessDto[];

  @ApiPropertyOptional({ type: [SyncBusinessEmployeeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncBusinessEmployeeDto)
  businessEmployees?: SyncBusinessEmployeeDto[];

  @ApiPropertyOptional({ type: [SyncLandParcelDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncLandParcelDto)
  landParcels?: SyncLandParcelDto[];

  @ApiPropertyOptional({ type: [SyncStructureDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncStructureDto)
  structures?: SyncStructureDto[];

  @ApiProperty({ type: [SyncCreateModuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCreateModuleDto)
  modules!: SyncCreateModuleDto[];
}

export class SyncInterviewsDto {
  @ApiProperty()
  @IsUUID()
  syncRequestId!: string;

  @ApiProperty({ type: [SyncInterviewDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncInterviewDto)
  interviews!: SyncInterviewDto[];
}
