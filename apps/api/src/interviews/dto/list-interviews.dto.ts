import { ApiPropertyOptional } from "@nestjs/swagger";
import { InterviewStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

export class ListInterviewsDto {
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

  @ApiPropertyOptional({ enum: InterviewStatus })
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;
}
