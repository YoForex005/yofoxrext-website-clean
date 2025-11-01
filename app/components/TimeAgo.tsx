
"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";

interface TimeAgoProps {
  date: Date | string;
  className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = React.useState<string>("");
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  React.useEffect(() => {
    // Only calculate time on client side
    setTimeAgo(formatDistanceToNow(dateObj, { addSuffix: true }));
  }, [dateObj]);

  // Return empty span during SSR to prevent hydration mismatch
  return <span className={className} suppressHydrationWarning>{timeAgo}</span>;
}
