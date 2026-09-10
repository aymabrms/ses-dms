import { ApiPropertyOptional } from "@nestjs/swagger";
import { InterviewStatus } from "@prisma/client";
import { IsEnum, IsISO8601, IsOptional, IsUUID } from "class-validator";

export class UpdateInterviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  surveyAreaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  enumeratorUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  respondentPersonId?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  surveyDate?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  finishedAt?: string;

  @ApiPropertyOptional({ enum: InterviewStatus })
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;
}
