import { Module } from "@nestjs/common";
import { JwksController } from "./jwks.controller.js";
import { JwtKeysModule } from "../aws/jwt-keys.module";

@Module({
	imports: [JwtKeysModule],
	controllers: [JwksController],
})
export class JwksModule {}
