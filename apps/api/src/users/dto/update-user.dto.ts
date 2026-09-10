import { ApiPropertyOptional } from "@nestjs/swagger";
import { RecordStatus } from "@prisma/client";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  displayName?: string;

  @ApiPropertyOptional({ enum: RecordStatus })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
