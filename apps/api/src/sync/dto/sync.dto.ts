import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseState } from "@prisma/client";
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
  @Min(1)
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

export class SyncInterviewDto {
  @ApiProperty()
  @IsUUID()
  interviewId!: string;

  @ApiProperty({ type: [SyncModuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncModuleDto)
  modules!: SyncModuleDto[];
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
