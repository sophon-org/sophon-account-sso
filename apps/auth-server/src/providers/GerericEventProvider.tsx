"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { AuthServerActions, useAuthHandler } from "../lib/events";
import { useCallback } from "react";

export const GenericEventProvider = () => {
  const { user, handleLogOut } = useDynamicContext();

  const handleLogout = useCallback(
    (payload: AuthServerActions["logout"]) => {
      console.log("🔥 logout", payload);
      if (user) {
        console.log("called dynamic logout function, user:", user);
        handleLogOut();
      }
    },
    [user, handleLogOut]
  );

  useAuthHandler("logout", handleLogout);

  return <></>;
};
