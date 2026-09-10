import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsISO8601, IsOptional, IsString } from "class-validator";

export class UpdatePersonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maidenName?: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genderRaw?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryContactNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  primaryEmail?: string;
}
