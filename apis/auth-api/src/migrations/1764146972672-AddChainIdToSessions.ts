import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChainIdToSessions1764146972672 implements MigrationInterface {
	name = "AddChainIdToSessions1764146972672";

	public async up(queryRunner: QueryRunner): Promise<void> {
		const defaultChainId =
			process.env.CHAIN_ID != null
				? Number.parseInt(process.env.CHAIN_ID, 10)
				: 50104;

		if (Number.isNaN(defaultChainId)) {
			throw new Error(
				`Invalid CHAIN_ID environment variable: "${process.env.CHAIN_ID}". Must be a valid number.`,
			);
		}

		await queryRunner.query(`ALTER TABLE "sessions" ADD "chain_id" integer`);

		await queryRunner.query(
			`UPDATE "sessions" SET "chain_id" = ${defaultChainId} WHERE "chain_id" IS NULL`,
		);

		await queryRunner.query(
			`ALTER TABLE "sessions" ALTER COLUMN "chain_id" SET NOT NULL`,
		);

		await queryRunner.query(
			`CREATE INDEX "idx_sessions_chain_id" ON "sessions" ("chain_id")`,
		);

		await queryRunner.query(
			`CREATE INDEX "idx_sessions_sub_chain" ON "sessions" ("sub", "chain_id")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_sessions_sub_chain"`);
		await queryRunner.query(`DROP INDEX "public"."idx_sessions_chain_id"`);
		await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "chain_id"`);
	}
}
