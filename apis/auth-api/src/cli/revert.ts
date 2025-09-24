import "dotenv/config";
import path from "node:path";
import { DataSource } from "typeorm";
import { getDbUrl } from "../database/get-db-url";

const asBool = (v?: string) => v === "true" || v === "1";

async function main() {
	const url = await getDbUrl();
	const ENTITIES = path.join(__dirname, "..", "**/*.entity.{js,ts}");
	const MIGRATIONS = path.join(__dirname, "..", "migrations/*.{js,ts}");

	const ds = new DataSource({
		type: "postgres",
		url,
		ssl: asBool(process.env.DB_SSL) ? { rejectUnauthorized: false } : undefined,
		migrationsTableName: "auth_migrations",
		entities: [ENTITIES],
		migrations: [MIGRATIONS],
		synchronize: false,
	});

	await ds.initialize();
	await ds.undoLastMigration();
	console.log("Reverted last migration.");
	await ds.destroy();
}

main().catch((err) => {
	console.error("Migration revert failed:", err);
	process.exit(1);
});
