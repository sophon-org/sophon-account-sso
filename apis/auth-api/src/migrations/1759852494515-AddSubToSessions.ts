import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubToSessions1759852494515 implements MigrationInterface {
	name = "AddSubToSessions1759852494515";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user_consent" DROP CONSTRAINT "chk_user_consent_sub_eth"`,
		);
		await queryRunner.query(`ALTER TABLE "sessions" ADD "sub" text`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "sub"`);
		await queryRunner.query(
			`ALTER TABLE "user_consent" ADD CONSTRAINT "chk_user_consent_sub_eth" CHECK (((sub)::text ~ '^0x[0-9a-f]{40}$'::text))`,
		);
	}
}
