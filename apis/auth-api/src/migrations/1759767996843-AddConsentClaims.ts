import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConsentClaims1759767996843 implements MigrationInterface {
	name = "AddConsentClaims1759767996843";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."consent_kind" AS ENUM('PERSONALIZATION_ADS', 'SHARING_DATA')`,
		);
		await queryRunner.query(
			`CREATE TABLE "user_consent" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying(64) NOT NULL, "kind" "public"."consent_kind" NOT NULL, "start_time" TIMESTAMP WITH TIME ZONE NOT NULL, "end_time" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b22925348311c2e41cc80b05171" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "ux_user_consent_one_active_per_kind" ON "user_consent" ("user_id", "kind") WHERE "end_time" IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "ix_user_consent_user_kind_start" ON "user_consent" ("user_id", "kind", "start_time") `,
		);
		await queryRunner.query(
			`CREATE INDEX "ix_user_consent_endtime" ON "user_consent" ("end_time") `,
		);
		await queryRunner.query(
			`CREATE INDEX "ix_user_consent_user" ON "user_consent" ("user_id") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "user_consent"`);
		await queryRunner.query(`DROP TYPE "public"."consent_kind"`);
	}
}
