import "dotenv/config";
import { DataSource } from "typeorm";
import { dbConfig } from "../config/db.config";

const ENTITIES = `${__dirname}/../**/*.entity.{ts,js}`;
const MIGRATIONS = `${__dirname}/../migrations/*.{ts,js}`;

const db = dbConfig();

export default new DataSource({
	type: "postgres",
	url: db.url,
	entities: [ENTITIES],
	migrations: [MIGRATIONS],
	migrationsTableName: "auth_migrations",
	synchronize: false,
});
