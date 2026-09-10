import { ApiPropertyOptional } from "@nestjs/swagger";
import { QuestionnaireModuleType } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsUUID } from "class-validator";

export class ListQuestionnaireVersionsDto {
  @ApiPropertyOptional({ enum: QuestionnaireModuleType })
  @IsOptional()
  @IsEnum(QuestionnaireModuleType)
  moduleType?: QuestionnaireModuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isActive?: boolean;
}
