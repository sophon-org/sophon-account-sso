import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AccessTokenGuard } from "../auth/guards/access-token.guard";
import type { AccessTokenPayload } from "../auth/types";
import { HyperindexService } from "./hyperindex.service";

function requireAddress(
	user: AccessTokenPayload & { sub?: string },
): `0x${string}` {
	const addr = user?.sub?.toLowerCase();
	if (!addr || !/^0x[0-9a-f]{40}$/.test(addr)) {
		// In your tokens, `sub` is set to the wallet address during sign-in
		// (see AuthService.verifySignatureWithSiweIssueTokens)
		throw new Error("Missing or invalid subject (address) in access token");
	}
	return addr as `0x${string}`;
}

@ApiTags("Me")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller("me")
export class MeController {
	constructor(private readonly hyperindex: HyperindexService) {}

	@Get("k1-owner-state")
	@ApiOkResponse({
		description:
			"K1OwnerState rows for the caller (derived from access token `sub`)",
		schema: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: { type: "string" },
					k1Owner: { type: "string" },
					accounts: { type: "array", items: { type: "string" } },
				},
			},
		},
	})
	async myK1OwnerState(@Req() req: Request) {
		const { user } = req as Request & { user: AccessTokenPayload };
		const address = requireAddress(user);
		// Return array shape; if you prefer Hasura-like top-level { data: { K1OwnerState } }, wrap it.
		return this.hyperindex.getK1OwnerStateByOwner(address);
		// const K1OwnerState = await this.hyperindex.getK1OwnerStateByOwner(address);
		// return { data: { K1OwnerState } };
	}
}
