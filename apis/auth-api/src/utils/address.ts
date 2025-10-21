import { BadRequestException } from "@nestjs/common";
import { Address, isAddress } from "viem";

export function normalizeAndValidateAddress(
	s: string | undefined | null,
): Address {
	const v = (s ?? "").trim().toLowerCase();
	if (!isAddress(v)) {
		throw new BadRequestException(`Invalid address provided: ${v}`);
	}
	return v as Address;
}
