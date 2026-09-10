import { Module } from "@nestjs/common";

import { BusinessesController, HouseholdsController, LandParcelsController, OrganizationsController, StructuresController } from "./domain.controllers";
import { DomainService } from "./domain.service";

@Module({
  controllers: [HouseholdsController, OrganizationsController, BusinessesController, LandParcelsController, StructuresController],
  providers: [DomainService]
})
export class DomainModule {}
