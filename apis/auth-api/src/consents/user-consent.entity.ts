import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { ConsentKind } from "./dto/consent-kind.enum";

@Entity({ name: "user_consent" })
@Index("ix_user_consent_user", ["userId"])
@Index("ix_user_consent_endtime", ["endTime"])
@Index("ix_user_consent_user_kind_start", ["userId", "kind", "startTime"])
@Index("ux_user_consent_one_active_per_kind", ["userId", "kind"], {
	unique: true,
	where: '"end_time" IS NULL',
})
export class UserConsent {
	@PrimaryGeneratedColumn("uuid", { name: "id" })
	id!: string;

	@Column({ name: "user_id", type: "varchar", length: 64 })
	userId!: string;

	@Column({
		name: "kind",
		type: "enum",
		enum: ConsentKind,
		enumName: "consent_kind",
	})
	kind!: ConsentKind;

	@Column({ name: "start_time", type: "timestamptz" })
	startTime!: Date;

	@Column({ name: "end_time", type: "timestamptz", nullable: true })
	endTime: Date | null;

	@CreateDateColumn({ name: "created_at", type: "timestamptz" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
	updatedAt!: Date;
}
