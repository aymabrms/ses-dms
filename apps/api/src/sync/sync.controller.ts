import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { SyncBootstrapQueryDto, SyncInterviewsDto } from "./dto/sync.dto";
import { SyncService } from "./sync.service";

@ApiTags("sync")
@Controller("sync")
export class SyncController {
  constructor(@Inject(SyncService) private readonly syncService: SyncService) {}

  @Get("bootstrap")
  bootstrap(@Query() query: SyncBootstrapQueryDto) {
    return this.syncService.bootstrap(query);
  }

  @Post("interviews")
  syncInterviews(@Body() dto: SyncInterviewsDto) {
    return this.syncService.syncInterviews(dto);
  }

  @Get("interviews/:interviewId/status")
  interviewStatus(@Param("interviewId", ParseUUIDPipe) interviewId: string) {
    return this.syncService.interviewStatus(interviewId);
  }
}
