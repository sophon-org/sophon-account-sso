import { DataSource } from "typeorm";
import { Session } from "../sessions/session.entity";

export default new DataSource({
	type: "postgres",
	url: process.env.DATABASE_URL,
	entities: [Session],
	migrations: ["src/migrations/*.ts"], // use dist/*.js in prod
	migrationsTableName: "typeorm_migrations",
	synchronize: false,
});
