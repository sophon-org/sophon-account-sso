import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import * as Sentry from "@sentry/node";
import { Request } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

type AuthUser = { id?: string | number; sub?: string | number } | undefined;
type AuthRequest = Request & { id?: string; user?: AuthUser };

@Injectable()
export class SentryContextInterceptor implements NestInterceptor {
	intercept(
		context: ExecutionContext,
		next: CallHandler<unknown>,
	): Observable<unknown> {
		const req = context.switchToHttp().getRequest<AuthRequest>();

		// v8: set tags/user on current scope (requestHandler created it)
		Sentry.setTag("request_id", String(req?.id ?? "n/a"));
		if (req?.user && (req.user.id ?? req.user.sub)) {
			Sentry.setUser({ id: String(req.user.id ?? req.user.sub) });
		} else {
			Sentry.setUser(null);
		}

		return next.handle().pipe(
			tap({
				error: (err) => {
					Sentry.captureException(err);
				},
			}),
		);
	}
}
