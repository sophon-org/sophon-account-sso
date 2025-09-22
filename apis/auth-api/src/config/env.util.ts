export function req(name: string): string {
	const v = process.env[name];
	if (!v) throw new Error(`Missing required env var: ${name}`);
	return v;
}

export function reqInt(name: string): number {
	const raw = req(name);
	const n = Number.parseInt(raw, 10);
	if (!Number.isFinite(n))
		throw new Error(`Invalid integer for ${name}: "${raw}"`);
	return n;
}
