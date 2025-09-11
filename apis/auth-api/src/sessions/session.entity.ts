import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("sessions")
export class Session {
	@PrimaryColumn()
	sid: string;

	@Column()
	user_id: string;

	@Column()
	aud: string;

	@Column()
	current_refresh_jti: string;

	@Column({ type: "timestamp", default: () => "now()" })
	created_at: Date;

	@Column({ type: "timestamp", nullable: true })
	revoked_at: Date | null;

	@Column({ type: "timestamp", nullable: true })
	invalidate_before: Date | null;

	@Column({ type: "timestamp" })
	refresh_expires_at: Date;
}
