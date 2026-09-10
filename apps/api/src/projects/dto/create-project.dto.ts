import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
