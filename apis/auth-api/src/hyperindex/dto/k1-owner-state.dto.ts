export type Address = `0x${string}`;

export class K1OwnerStateDto {
	id!: string;
	k1Owner!: Address;
	accounts!: Address[];
}
