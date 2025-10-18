import { createContext } from "react";
import type { AuthPortalContextType } from "../types";

export const AuthPortalContext = createContext<AuthPortalContextType | null>(null);
