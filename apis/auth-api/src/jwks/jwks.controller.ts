import { Controller, Get, type OnModuleInit } from "@nestjs/common";
import type { JWK } from "jose";
import { getPublicKey } from "../utils/jwt"; // or .ts in dev

@Controller("/.well-known")
export class JwksController implements OnModuleInit {
  private jwk: JWK | null = null;

  async onModuleInit(): Promise<void> {
    try {
      // Dynamic import of ESM-only package
      const { exportJWK } = await import("jose");
      const key = await getPublicKey();
      const jwk = await exportJWK(key);

      this.jwk = {
        ...jwk,
        alg: "RS256",
        use: "sig",
        kid: process.env.JWT_KID || "default-key",
      };
    } catch (err) {
      console.error("[JWKS] Failed to load public key:", err);
    }
  }

  @Get("jwks.json")
  getJwks() {
    return {
      keys: this.jwk ? [this.jwk] : [],
    };
  }
}
