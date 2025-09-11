import { DataSource } from "typeorm";
import { Session } from "../sessions/session.entity";

export default new DataSource({
	type: "postgres",
	url: process.env.DATABASE_URL,
	entities: [__dirname + "/**/*.entity.{ts,js}"],
	migrations: [__dirname + "/migrations/*.{ts,js}"],
	migrationsTableName: "auth_migrations",
	synchronize: false,
});
