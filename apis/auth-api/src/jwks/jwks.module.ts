import { Module } from "@nestjs/common";
import { JwtKeysModule } from "../aws/jwt-keys.module";
import { JwksController } from "./jwks.controller.js";

@Module({
	imports: [JwtKeysModule],
	controllers: [JwksController],
})
export class JwksModule {}
