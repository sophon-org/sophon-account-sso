import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConsentClaims1759767996843 implements MigrationInterface {
	name = "AddConsentClaims1759767996843";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."consent_kind" AS ENUM('PERSONALIZATION_ADS', 'SHARING_DATA')`,
		);

		await queryRunner.query(`
      CREATE TABLE "user_consent" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sub" character varying(42) NOT NULL,
        "kind" "public"."consent_kind" NOT NULL,
        "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_time" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_b22925348311c2e41cc80b05171" PRIMARY KEY ("id"),
        CONSTRAINT "chk_user_consent_sub_eth" CHECK ("sub" ~ '^0x[0-9a-f]{40}$')
      )
    `);

		await queryRunner.query(
			`CREATE UNIQUE INDEX "ux_user_consent_one_active_per_kind_sub" ON "user_consent" ("sub", "kind") WHERE "end_time" IS NULL`,
		);
		await queryRunner.query(
			`CREATE INDEX "ix_user_consent_sub_kind_start" ON "user_consent" ("sub", "kind", "start_time")`,
		);
		await queryRunner.query(
			`CREATE INDEX "ix_user_consent_endtime" ON "user_consent" ("end_time")`,
		);
		await queryRunner.query(
			`CREATE INDEX "ix_user_consent_sub" ON "user_consent" ("sub")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "user_consent"`);
		await queryRunner.query(`DROP TYPE "public"."consent_kind"`);
	}
}

