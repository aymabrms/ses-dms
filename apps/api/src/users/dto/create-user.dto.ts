import { ApiProperty } from "@nestjs/swagger";
import { RecordStatus } from "@prisma/client";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ enum: RecordStatus, required: false })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
