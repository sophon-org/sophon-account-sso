import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("sessions")
export class Session {
	@PrimaryColumn()
	sid: string;

	@Column({ name: "user_id" })
	userId: string;

	@Column()
	aud: string;

	@Column({ name: "current_refresh_jti" })
	currentRefreshJti: string;

	@Column({ name: "created_at", type: "timestamp", default: () => "now()" })
	createdAt: Date;

	@Column({ name: "revoked_at", type: "timestamp", nullable: true })
	revokedAt: Date | null;

	@Column({ name: "invalidate_before", type: "timestamp", nullable: true })
	invalidateBefore: Date | null;

	@Column({ name: "refresh_expires_at", type: "timestamp" })
	refreshExpiresAt: Date;
}
