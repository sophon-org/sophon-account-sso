export const PERMISSION_ALLOWED_FIELDS = [
	"discord",
	"email",
	"google",
	"telegram",
	"x",
	"apple",
] as const;
export type PermissionAllowedField = (typeof PERMISSION_ALLOWED_FIELDS)[number];
export const isPermissionAllowedField = (
	v: string,
): v is PermissionAllowedField =>
	(PERMISSION_ALLOWED_FIELDS as readonly string[]).includes(v);

export const packScope = (fields: readonly PermissionAllowedField[]) =>
	[...new Set(fields)].join(" ");

export const unpackScope = (scope?: string) =>
	scope
		? (scope
				.split(/\s+/)
				.filter(isPermissionAllowedField) as PermissionAllowedField[])
		: [];
