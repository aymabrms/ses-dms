import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsOptional, IsUUID } from "class-validator";

export class CreateInterviewDto {
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

  @ApiProperty({ format: "date-time" })
  @IsISO8601()
  surveyDate!: string;

  @ApiProperty({ format: "date-time" })
  @IsISO8601()
  startedAt!: string;
}
