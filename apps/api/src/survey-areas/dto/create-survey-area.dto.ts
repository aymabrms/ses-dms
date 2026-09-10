import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateSurveyAreaDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}
