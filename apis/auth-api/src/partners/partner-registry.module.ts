import { Module } from "@nestjs/common";
import { PartnerRegistryService } from "./partner-registry.service";

@Module({
	providers: [PartnerRegistryService],
	exports: [PartnerRegistryService],
})
export class PartnerRegistryModule {}
