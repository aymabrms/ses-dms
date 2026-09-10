import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("system")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOkResponse({ description: "Reports that the API shell is available." })
  getHealth() {
    return { status: "ok" };
  }
}
