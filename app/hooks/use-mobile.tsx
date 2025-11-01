"use client";

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Check if matchMedia is supported
    if (!window.matchMedia) {
      // Fallback for browsers that don't support matchMedia
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return;
    }
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Use addListener for older browsers that don't support addEventListener
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange)
    } else if (mql.addListener) {
      // Fallback for older browsers
      mql.addListener(onChange)
    }
    
    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Cleanup
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange)
      } else if (mql.removeListener) {
        // Fallback for older browsers
        mql.removeListener(onChange)
      }
    }
  }, [])

  return isMobile
}
