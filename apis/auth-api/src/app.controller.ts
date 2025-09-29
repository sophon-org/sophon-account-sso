import { Controller, Get } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { name, version } from "../package.json";

@Controller()
export class AppController {
	constructor(
		@InjectPinoLogger(AppController.name)
		private readonly logger: PinoLogger,
	) {}

	@Get()
	getStatus() {
		this.logger.info({ route: "/", version }, "status");
		return { name, version, status: "ready" };
	}
}
