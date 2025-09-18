import * as Joi from "joi";

export const validationSchema = Joi.object({
	ACCESS_TTL_S: Joi.number().integer().positive().required(),
	REFRESH_TTL_S: Joi.number().integer().positive().required(),
	NONCE_TTL_S: Joi.number().integer().positive().required(),

	COOKIE_ACCESS_MAX_AGE_S: Joi.number().integer().positive().required(),
	COOKIE_REFRESH_MAX_AGE_S: Joi.number().integer().positive().required(),
	COOKIE_DOMAIN: Joi.string().optional(),

	JWT_KID: Joi.string().required(),
	JWT_ISSUER: Joi.string().required(),
	NONCE_ISSUER: Joi.string().required(),
	REFRESH_ISSUER: Joi.string().required(),
	REFRESH_JWT_KID: Joi.string().required(),
	JWT_AUDIENCE: Joi.string().optional(),
	PARTNER_CDN: Joi.string()
		.uri()
		.default("https://cdn.sophon.xyz/partners/sdk"),

	DATABASE_URL: Joi.string().optional(),

	NODE_ENV: Joi.string()
		.valid("development", "test", "production")
		.default("development"),
});
