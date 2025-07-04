import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.string(),
    DEPLOYER_PRIVATE_KEY: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_DYNAMIC_PROVIDER_ID: z.string(),
    NEXT_PUBLIC_DEPLOYER_ADDRESS: z.string(),
    NEXT_PUBLIC_CHAIN_ID: z
      .string()
      .transform((val) => Number.parseInt(val.toString(), 10)),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY,
    NEXT_PUBLIC_DYNAMIC_PROVIDER_ID:
      process.env.NEXT_PUBLIC_DYNAMIC_PROVIDER_ID,
    NEXT_PUBLIC_DEPLOYER_ADDRESS: process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
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
