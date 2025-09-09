import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const res = ctx.getResponse();
		const req = ctx.getRequest();

		const isHttp = exception instanceof HttpException;
		const status = isHttp
			? exception.getStatus()
			: HttpStatus.INTERNAL_SERVER_ERROR;

		const body = isHttp
			? (exception as HttpException).getResponse()
			: { message: "Internal server error" };

		if (req?.url?.startsWith?.("/auth")) {
			res?.set?.("Cache-Control", "no-store");
			res?.set?.("Pragma", "no-cache");
		}

		if (status === HttpStatus.UNAUTHORIZED && !res?.get?.("WWW-Authenticate")) {
			res?.set?.(
				"WWW-Authenticate",
				'Bearer realm="refresh", error="invalid_token"',
			);
		}

		console.error({
			path: req?.url,
			method: req?.method,
			status,
			error: exception instanceof Error ? exception.stack : exception,
			body,
		});

		return res.status(status).json({
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: req?.url,
			...(typeof body === "string" ? { message: body } : body),
		});
	}
}
