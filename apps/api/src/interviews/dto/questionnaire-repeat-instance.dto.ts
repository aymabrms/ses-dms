import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateRepeatInstanceDto {
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

export class UpdateRepeatInstanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  groupCode?: string;

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
