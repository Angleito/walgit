import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

// Add useMediaQuery hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query)

      // Set initial value
      setMatches(media.matches)

      // Define callback
      const listener = () => {
        setMatches(media.matches)
      }

      // Add listener
      media.addEventListener("change", listener)

      // Clean up
      return () => media.removeEventListener("change", listener)
    }
    return undefined
  }, [query])

  return matches
}
