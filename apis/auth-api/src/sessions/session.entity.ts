import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("sessions")
export class Session {
	@PrimaryColumn("uuid")
	sid!: string;

	@Column({ name: "user_id", type: "text" })
	userId!: string;

	@Column({ name: "sub", type: "text" })
	sub!: string;

	@Column({ type: "text" })
	aud!: string;

	@Column({ name: "current_refresh_jti", type: "uuid" })
	currentRefreshJti!: string;

	@Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
	createdAt!: Date;

	@Column({ name: "revoked_at", type: "timestamptz", nullable: true })
	revokedAt!: Date | null;

	@Column({ name: "invalidate_before", type: "timestamptz", nullable: true })
	invalidateBefore!: Date | null;

	@Column({ name: "refresh_expires_at", type: "timestamptz" })
	refreshExpiresAt!: Date;

	// New fields you want:
	@Column({ name: "created_ip", type: "varchar", length: 64, nullable: true })
	createdIp!: string | null;

	@Column({ name: "created_user_agent", type: "text", nullable: true })
	createdUserAgent!: string | null;

	@Column({
		name: "last_refresh_ip",
		type: "varchar",
		length: 64,
		nullable: true,
	})
	lastRefreshIp!: string | null;

	@Column({ name: "last_refresh_user_agent", type: "text", nullable: true })
	lastRefreshUserAgent!: string | null;

	@Column({ name: "last_refresh_at", type: "timestamptz", nullable: true })
	lastRefreshAt!: Date | null;

	@Column({ name: "chain_id", type: "int" })
	chainId!: number;
}
