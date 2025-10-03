import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsentsRepository } from "./consents.repository";
import { ConsentsService } from "./consents.service";
import { UserConsent } from "./user-consent.entity";

@Module({
	imports: [TypeOrmModule.forFeature([UserConsent])],
	providers: [ConsentsRepository, ConsentsService],
	exports: [ConsentsService, ConsentsRepository],
})
export class ConsentsModule {}
