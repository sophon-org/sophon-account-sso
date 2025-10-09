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
@Index("ix_user_consent_sub", ["sub"])
@Index("ix_user_consent_endtime", ["endTime"])
@Index("ix_user_consent_sub_kind_start", ["sub", "kind", "startTime"])
@Index("ux_user_consent_one_active_per_kind_sub", ["sub", "kind"], {
	unique: true,
	where: '"end_time" IS NULL',
})
export class UserConsent {
	@PrimaryGeneratedColumn("uuid", { name: "id" })
	id!: string;

	@Column({ name: "sub", type: "varchar", length: 42 })
	sub!: string;

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
