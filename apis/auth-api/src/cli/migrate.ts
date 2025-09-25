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
	const ran = await ds.runMigrations();
	if (ran.length === 0) {
		console.log("No pending migrations.");
	} else {
		for (const m of ran) console.log(`Applied: ${m.name}`);
	}
	await ds.destroy();
}

main().catch((err) => {
	console.error("Migration run failed:", err);
	process.exit(1);
});
