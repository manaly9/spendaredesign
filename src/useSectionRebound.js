import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Clip dedicated boundary wrappers without transforming their contents.
export function useSectionRebound() {
  useLayoutEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const cleanups = []
      for (const target of document.querySelectorAll('[data-transition]')) {
        const selector = target.dataset.transition
        let tween
        let lastPlay = -Infinity
        const rebound = () => {
          if (ScrollTrigger.isRefreshing || performance.now() - lastPlay < 650) return
          lastPlay = performance.now()
          tween?.kill()
          const distance = window.innerWidth < 768 ? 7 : 12
          tween = gsap.timeline()
            .to(target, { clipPath: `inset(${distance}px)`, duration: 0.12, ease: 'power2.out' })
            .to(target, { clipPath: 'inset(0px)', duration: 0.43, ease: 'back.out(1.15)' })
        }
        const trigger = ScrollTrigger.create({
          id: `spenda-boundary-${selector}`, trigger: target,
          start: 'top 80%', end: 'top 20%',
          onEnter: rebound, onEnterBack: rebound,
        })
        cleanups.push(() => {
          trigger.kill()
          tween?.kill()
          target.style.removeProperty('clip-path')
        })
      }
      return () => cleanups.forEach(cleanup => cleanup())
    })
    return () => media.revert()
  }, [])
}
