import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const VALID_CHAIN_IDS = ['531050104', '50104'] as const;

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.string(),
    DEPLOYER_PRIVATE_KEY: z.string(),
    HYPERINDEX_ENDPOINT: z.string().url(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_DEPLOYER_ADDRESS: z.string(),
    NEXT_PUBLIC_CHAIN_ID: z
      .enum(VALID_CHAIN_IDS)
      .transform((val) => Number.parseInt(val.toString(), 10)),

    NEXT_PUBLIC_AUTH_SERVER_ENDPOINT: z.string().url(),
    NEXT_PUBLIC_SERVER_LOGS_ENABLED: z
      .string()
      .transform((it) => it === 'true'),
    NEXT_PUBLIC_SHOW_TEST_SCREEN: z
      .string()
      .optional()
      .transform((it) => it === 'true'),
    NEXT_PUBLIC_EMBEDDED_FLOW_ENABLED: z
      .string()
      .optional()
      .transform((it) => it === 'true'),
    NEXT_PUBLIC_EMBEDDED_FLOW_ORIGIN: z.string().url().optional(),
    NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_SHIELD_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_OPENFORT_API_ENDPOINT: z.string().url(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY,
    NEXT_PUBLIC_DEPLOYER_ADDRESS: process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    HYPERINDEX_ENDPOINT: process.env.HYPERINDEX_ENDPOINT,
    NEXT_PUBLIC_AUTH_SERVER_ENDPOINT:
      process.env.NEXT_PUBLIC_AUTH_SERVER_ENDPOINT,
    NEXT_PUBLIC_SERVER_LOGS_ENABLED:
      process.env.NEXT_PUBLIC_SERVER_LOGS_ENABLED,
    NEXT_PUBLIC_SHOW_TEST_SCREEN: process.env.NEXT_PUBLIC_SHOW_TEST_SCREEN,
    NEXT_PUBLIC_EMBEDDED_FLOW_ENABLED:
      process.env.NEXT_PUBLIC_EMBEDDED_FLOW_ENABLED,
    NEXT_PUBLIC_EMBEDDED_FLOW_ORIGIN:
      process.env.NEXT_PUBLIC_EMBEDDED_FLOW_ORIGIN,
    NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_OPENFORT_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SHIELD_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SHIELD_PUBLISHABLE_KEY,
    NEXT_PUBLIC_OPENFORT_API_ENDPOINT:
      process.env.NEXT_PUBLIC_OPENFORT_API_ENDPOINT,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
