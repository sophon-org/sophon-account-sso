import type { JwtPayload } from "jsonwebtoken";

export type AccessTokenPayload = JwtPayload & {
	userId: string;
	scope: string; // space-separated
};

export interface AuthenticatedRequest extends Request {
	user: AccessTokenPayload;
}
