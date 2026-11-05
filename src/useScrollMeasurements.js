import { useLayoutEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Observe stable layout layers, never animated children or pin spacers.
export function useScrollMeasurements(root) {
  useLayoutEffect(() => {
    let disposed = false
    let timer
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => { if (!disposed) ScrollTrigger.refresh() }, 120)
    }
    const observer = new ResizeObserver(refresh)
    observer.observe(root.current)
    document.fonts.ready.then(() => { if (!disposed) refresh() })
    document.fonts.addEventListener('loadingdone', refresh)
    return () => {
      disposed = true
      clearTimeout(timer)
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', refresh)
    }
  }, [root])
}
