export type SessionRecord = {
	sid: string;
	userId: string;
	aud: string;
	currentRefreshJti: string;
	createdAt: Date;
	revokedAt: Date | null;
	invalidateBefore: Date | null;
	refreshExpiresAt: Date;

	lastRefreshIp: string | null;
	lastRefreshUserAgent: string | null;
	lastRefreshAt: Date | null;

	createdIp: string | null;
	createdUserAgent: string | null;
};
