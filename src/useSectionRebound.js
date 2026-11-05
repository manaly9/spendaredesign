import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// The hero/phone/card handoff already has a coordinated entrance timeline.
// Only independent boundary layers receive this additive settling offset.
export function useSectionRebound() {
  useLayoutEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const cleanups = []
      for (const [selector, layer] of [
        ['.bank-transfer', '.bank-copy'],
        ['.essentials', '.essentials-position'],
      ]) {
        const section = document.querySelector(selector)
        const target = section?.querySelector(layer)
        if (!target) continue
        let tween
        let lastPlay = -Infinity
        const rebound = direction => {
          if (ScrollTrigger.isRefreshing || performance.now() - lastPlay < 650) return
          lastPlay = performance.now()
          tween?.kill()
          const distance = window.innerWidth < 768 ? 8 : 12
          tween = gsap.timeline()
            .to(target, { '--section-rebound': `${direction * distance}px`, duration: 0.12, ease: 'sine.out' })
            .to(target, { '--section-rebound': '0px', duration: 0.4, ease: 'back.out(1.05)' })
        }
        const trigger = ScrollTrigger.create({
          id: `spenda-boundary-${selector.slice(1)}`, trigger: section,
          start: 'top 80%', end: 'top 20%',
          onEnter: () => rebound(1), onEnterBack: () => rebound(-1),
        })
        cleanups.push(() => {
          trigger.kill()
          tween?.kill()
          target.style.removeProperty('--section-rebound')
        })
      }
      return () => cleanups.forEach(cleanup => cleanup())
    })
    return () => media.revert()
  }, [])
}
