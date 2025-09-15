export type SessionRecord = {
	sid: string;
	userId: string;
	aud: string;
	currentRefreshJti: string;
	createdAt: Date;
	revokedAt: Date | null;
	invalidateBefore: Date | null;
	refreshExpiresAt: Date;
};
