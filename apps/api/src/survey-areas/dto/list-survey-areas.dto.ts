import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class ListSurveyAreasDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
