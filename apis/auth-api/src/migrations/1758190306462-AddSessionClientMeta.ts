import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessionClientMeta1758190306462 implements MigrationInterface {
	name = "AddSessionClientMeta1758190306462";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_sessions_user"`);
		await queryRunner.query(`DROP INDEX "public"."idx_sessions_aud"`);
		await queryRunner.query(`DROP INDEX "public"."idx_sessions_refresh_exp"`);
		await queryRunner.query(
			`ALTER TABLE "sessions" ADD "created_ip" character varying(64)`,
		);
		await queryRunner.query(
			`ALTER TABLE "sessions" ADD "created_user_agent" text`,
		);
		await queryRunner.query(
			`ALTER TABLE "sessions" ADD "last_refresh_ip" character varying(64)`,
		);
		await queryRunner.query(
			`ALTER TABLE "sessions" ADD "last_refresh_user_agent" text`,
		);
		await queryRunner.query(
			`ALTER TABLE "sessions" ADD "last_refresh_at" TIMESTAMP WITH TIME ZONE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "sessions" DROP COLUMN "last_refresh_at"`,
		);
		await queryRunner.query(
			`ALTER TABLE "sessions" DROP COLUMN "last_refresh_user_agent"`,
		);
		await queryRunner.query(
			`ALTER TABLE "sessions" DROP COLUMN "last_refresh_ip"`,
		);
		await queryRunner.query(
			`ALTER TABLE "sessions" DROP COLUMN "created_user_agent"`,
		);
		await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "created_ip"`);
		await queryRunner.query(
			`CREATE INDEX "idx_sessions_refresh_exp" ON "sessions" ("refresh_expires_at") `,
		);
		await queryRunner.query(
			`CREATE INDEX "idx_sessions_aud" ON "sessions" ("aud") `,
		);
		await queryRunner.query(
			`CREATE INDEX "idx_sessions_user" ON "sessions" ("user_id") `,
		);
	}
}
