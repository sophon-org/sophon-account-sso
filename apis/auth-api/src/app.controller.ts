import { Controller, Get } from "@nestjs/common";
import { name, version } from "../package.json";

@Controller()
export class AppController {
	@Get()
	getStatus() {
		return {
			name,
			version,
			status: "ready",
		};
	}
}
