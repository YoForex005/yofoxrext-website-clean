"use client";

import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export function ActivityTracker() {
  const { user } = useAuth();
  const { isActive, activeTime } = useActivityTracker(!!user);

  // Activity logging disabled - no console spam
  useEffect(() => {
    if (user && isActive) {
      // console.log(`[Activity Tracker] User active for ${activeTime} seconds`);
    }
  }, [user, isActive, activeTime]);

  // This component doesn't render anything - it just tracks activity
  return null;
}
