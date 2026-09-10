import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ModuleStatus, QuestionnaireModuleType } from "@prisma/client";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

export class CreateInterviewModuleDto {
  @ApiProperty()
  @IsUUID()
  questionnaireVersionId!: string;

  @ApiProperty({ enum: QuestionnaireModuleType })
  @IsEnum(QuestionnaireModuleType)
  moduleType!: QuestionnaireModuleType;

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

  @ApiPropertyOptional({ enum: ModuleStatus })
  @IsOptional()
  @IsEnum(ModuleStatus)
  status?: ModuleStatus;
}
