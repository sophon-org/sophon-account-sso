import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
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

		console.error({
			path: req?.url,
			method: req?.method,
			status,
			error: exception instanceof Error ? exception.stack : exception,
		});

		res.status(status).json({
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: req?.url,
			...(typeof body === "string" ? { message: body } : body),
		});
	}
}
