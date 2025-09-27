import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from "@nestjs/common";
import * as Sentry from "@sentry/node";
import type { Request, Response } from "express";

type AuthUser = { id?: string | number; sub?: string | number } | undefined;
type AuthRequest = Request & { id?: string; user?: AuthUser };

@Catch()
export class SentryAwareAllExceptionsFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		if (host.getType() !== "http") {
			this.captureToSentry(exception);
			throw exception;
		}

		const ctx = host.switchToHttp();
		const res = ctx.getResponse<Response>();
		const req = ctx.getRequest<AuthRequest>();

		const isHttp = exception instanceof HttpException;
		const status = isHttp
			? (exception as HttpException).getStatus()
			: HttpStatus.INTERNAL_SERVER_ERROR;

		const isClientError = status >= 400 && status < 500;

		if (!(isClientError && ![401, 403, 429].includes(status))) {
			this.captureToSentry(exception, req);
		}

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

		const body = isHttp
			? (exception as HttpException).getResponse()
			: { message: "Internal server error" };

		console.error({
			path: req?.url,
			method: req?.method,
			status,
			error: exception instanceof Error ? exception.stack : exception,
			body,
		});

		if (!res.headersSent) {
			return res.status(status).json({
				statusCode: status,
				timestamp: new Date().toISOString(),
				path: req?.url,
				...(typeof body === "string" ? { message: body } : body),
			});
		}
	}

	private captureToSentry(exception: unknown, req?: AuthRequest) {
		Sentry.withScope((scope) => {
			if (req) {
				scope.setTag("request_id", String(req?.id ?? "n/a"));
				scope.setTag("method", req?.method ?? "");
				scope.setTag("url", req?.url ?? "");
				if (req?.user && (req.user.id ?? req.user.sub)) {
					scope.setUser({ id: String(req.user.id ?? req.user.sub) });
				} else {
					scope.setUser(null);
				}
			}
			Sentry.captureException(exception);
		});
	}
}
