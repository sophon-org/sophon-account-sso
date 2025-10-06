// src/observability/sentry.init.ts
import * as Sentry from "@sentry/node";

export function initSentry() {
	const dsn = process.env.SENTRY_DSN;
	const env = process.env.APP_ENV ?? "development";
	if (!dsn || env === "local") return;

	Sentry.init({
		dsn,
		environment: env,
		sendDefaultPii: false,
		beforeSend(event) {
			const headers = event.request?.headers as
				| Record<string, unknown>
				| undefined;
			if (headers) {
				delete headers.authorization;
				delete headers.cookie;
			}
			return event;
		},
	});
}
