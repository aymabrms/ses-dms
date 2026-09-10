import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseState } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";

export class ResponseItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  repeatInstanceId?: string;

  @ApiProperty({ enum: ResponseState })
  @IsEnum(ResponseState)
  responseState!: ResponseState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  valueText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  valueNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  valueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  valueJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  capturedAt?: string;
}

export class BulkWriteResponsesDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  expectedRevision!: number;

  @ApiProperty({ type: [ResponseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseItemDto)
  responses!: ResponseItemDto[];
}
