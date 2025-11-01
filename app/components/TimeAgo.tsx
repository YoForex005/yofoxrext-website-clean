
"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";

interface TimeAgoProps {
  date: Date | string;
  className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const [mounted, setMounted] = React.useState(false);
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeAgo = formatDistanceToNow(dateObj, { addSuffix: true });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client render, show static content
  if (!mounted) {
    return <span className={className} suppressHydrationWarning>{timeAgo}</span>;
  }

  // After mounting, show live updating content
  return <span className={className}>{timeAgo}</span>;
}
