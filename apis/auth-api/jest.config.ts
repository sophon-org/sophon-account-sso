import type { Config } from "jest";

const config: Config = {
	verbose: true,
	coveragePathIgnorePatterns: [
		"app.module.ts",
		"main.ts",
		".controller.ts",
		".module.ts",
		".dto.ts",
		".schema.ts",
		".*\\.decorator\\.ts",
		"__tests__",
		".*seed.*\\.ts",
	],
	moduleNameMapper: {
		"^src/(.*)$": "<rootDir>/src/$1",
		"^@/(.*)$": "<rootDir>/$1",
		"^@auth/(.*)$": "<rootDir>/auth/$1",
		"^@users/(.*)$": "<rootDir>/users/$1",
		"^@hyperindex/(.*)$": "<rootDir>/hyperindex/$1",
	},
	moduleFileExtensions: ["js", "json", "ts"],
	moduleDirectories: ["node_modules", "<rootDir>/src"],
	rootDir: ".",
	testRegex: ".*\\.spec\\.ts$",
	transform: {
		"^.+\\.(t|j)s$": "ts-jest",
	},
	collectCoverageFrom: ["**/*.(t|j)s"],
	coverageReporters: ["json", "lcov", "text", "clover", "html"],
	coverageDirectory: "../coverage",
	coverageThreshold: {
		global: {
			branches: 90, // min. branch coverage
			functions: 90, // min. function coverage
			lines: 90, // min. line coverage
			statements: 90, // min. statement coverage
		},
	},
	testEnvironment: "node",
	transformIgnorePatterns: ["/node_modules/(?!(jose)/)"],
};

export default config;
