export enum ConsentKind {
	PERSONALIZATION_ADS = "PERSONALIZATION_ADS",
	SHARING_DATA = "SHARING_DATA",
}

// Short key mapping
export const CONSENT_SHORT: Record<ConsentKind, "pa" | "sd"> = {
	[ConsentKind.PERSONALIZATION_ADS]: "pa",
	[ConsentKind.SHARING_DATA]: "sd",
};
