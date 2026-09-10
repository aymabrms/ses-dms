import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ValidationSeverity } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateValidationIssueDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  questionnaireResponseId?: string;

  @ApiProperty({ enum: ValidationSeverity })
  @IsEnum(ValidationSeverity)
  severity!: ValidationSeverity;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message!: string;
}
