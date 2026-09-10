import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class ProjectAreaQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  surveyAreaId?: string;
}

export class CreateProjectAreaDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiProperty()
  @IsUUID()
  surveyAreaId!: string;
}

export class CreateHouseholdMembershipDto {
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
  @Type(() => Number)
  @IsNumber()
  memberOrder?: number;
}

export class UpdateHouseholdMembershipDto {
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
  @Type(() => Number)
  @IsNumber()
  memberOrder?: number;
}

export class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationTypeRaw?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationTypeRaw?: string;
}

export class CreateBusinessDto extends CreateProjectAreaDto {
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

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  startedAt?: string;
}

export class UpdateBusinessDto {
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

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  startedAt?: string;
}

export class OwnerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownershipTypeRaw?: string;
}

export class LandOwnerDto extends OwnerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proofOfOwnershipRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  acquisitionMethodRaw?: string;
}

export class BusinessEmployeeDto {
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

export class UpdateBusinessEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employmentStatusRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workAssignmentRaw?: string;
}

export class CreateLandParcelDto extends CreateProjectAreaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
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

export class UpdateLandParcelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
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

export class CreateStructureDto extends CreateProjectAreaDto {
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

export class UpdateStructureDto {
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

export class StructureQueryDto extends ProjectAreaQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  landParcelId?: string;
}

export class StructureTagDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tagValue!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tagTypeRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  surveyAreaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class StructureAssociationDto {
  @ApiProperty()
  @IsUUID()
  childStructureId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  associationTypeRaw?: string;
}

export class StructureOccupancyDto {
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
  personId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupancyTypeRaw?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  endedAt?: string;
}
