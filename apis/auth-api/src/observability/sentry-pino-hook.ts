import * as Sentry from "@sentry/node";

type PinoLogMethod = (...args: unknown[]) => void;

interface PinoLogObject {
	level?: number | string;
	msg?: unknown;
	err?: unknown;
	context?: string;
	request_id?: string;
	req?: { id?: string } & Record<string, unknown>;
	reqId?: string;
	"x-request-id"?: string;
	[key: string]: unknown;
}

const LEVEL_NUM: Record<string, number> = {
	trace: 10,
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
	fatal: 60,
};

function normalizeLevel(lvl: unknown): number {
	if (typeof lvl === "number") return lvl;
	if (typeof lvl === "string") return LEVEL_NUM[lvl] ?? 30;
	return 30;
}

export function sentryPinoHook(): {
	logMethod: (args: unknown[], method: PinoLogMethod) => void;
} {
	return {
		logMethod(args: unknown[], method: PinoLogMethod): void {
			try {
				const [first, second] = args;
				const obj = (first ?? {}) as PinoLogObject;
				const msg = second as unknown;
				const level = normalizeLevel(obj.level);

				if (level >= 50) {
					const tags = {
						context: obj.context,
						request_id:
							obj.request_id ||
							obj.req?.id ||
							obj.reqId ||
							(obj["x-request-id"] as string | undefined),
					};

					const { req: _req, res: _res, err: _ignored, ...extra } = obj;

					const err = obj.err;
					if (err instanceof Error) {
						Sentry.captureException(err, { tags, extra });
					} else {
						Sentry.captureMessage(String(msg ?? obj.msg ?? "pino error"), {
							level: level === 60 ? "fatal" : "error",
							tags,
							extra,
						});
					}
				} else if (level === 40) {
					Sentry.addBreadcrumb({
						level: "warning",
						message: String(msg ?? obj.msg ?? ""),
						data: obj,
					});
				}
			} catch {
				// never crash on logging
			}
			method(...args);
		},
	};
}
