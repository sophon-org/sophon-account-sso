export interface CustomRPCError extends Error {
  details?: string;
}

export interface SophonJWTToken {
  value: string;
  expiresAt: number;
}
