import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Times are seconds in the ORIGINAL footage, inspected at 0.5 s intervals.
// Purple sweep: 2–3 s; white card: 4–5 s; light burst: 6.5–7.5 s.
export const HERO_TIMING = { duration: 7.916, secondIn: 2.1, thirdIn: 4.2, whiteIn: 7.0 }

export function useHeroTimeline(rootRef, videoRef) {
  useLayoutEffect(() => {
    const root = rootRef.current
    const video = videoRef.current
    const copies = [...root.querySelectorAll('.hero-copy')]
    let destroyed = false
    let desiredTime = 0
    let lastIssuedTime = -1
    let metadataReady = video.readyState >= 1
    let mediaFailed = false

    // One seek in flight. Coalesce fast scroll updates and seek to the latest
    // position when decoding finishes, instead of continuously cancelling seeks.
    const seekLatest = () => {
      if (destroyed || mediaFailed || !metadataReady || video.seeking) return
      const target = Math.min(desiredTime, Math.max(0, video.duration - 0.045))
      if (Math.abs(target - lastIssuedTime) < 1 / 48) return
      lastIssuedTime = target
      video.currentTime = target
    }
    const onMetadata = () => { metadataReady = true; seekLatest() }
    const onError = () => { mediaFailed = true; root.dataset.mediaError = 'true' }
    video.addEventListener('loadedmetadata', onMetadata)
    video.addEventListener('loadeddata', seekLatest)
    video.addEventListener('seeked', seekLatest)
    video.addEventListener('error', onError)

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const playhead = { time: 0 }
      const stage = root.querySelector('.hero-stage')
      let active = -1
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: () => {
          desiredTime = playhead.time
          seekLatest()
          const next = playhead.time < 2.1 ? 0 : playhead.time < 4.2 ? 1 : playhead.time < 6.8 ? 2 : -1
          if (next !== active) {
            active = next
            copies.forEach((copy, i) => copy.setAttribute('aria-hidden', String(i !== active)))
          }
          root.dataset.progress = (playhead.time / HERO_TIMING.duration).toFixed(3)
        },
        scrollTrigger: {
          id: 'spenda-hero', trigger: root, pin: stage,
          start: 'top top', end: () => `+=${Math.round(window.innerHeight * (window.innerWidth < 700 ? 3.5 : 4))}`,
          scrub: 0.45, anticipatePin: 1, invalidateOnRefresh: true,
        },
      })

      timeline.to(playhead, { time: HERO_TIMING.duration, duration: HERO_TIMING.duration }, 0)
      const exit = (copy, at) => {
        timeline.to(copy.querySelectorAll('.word'), {
          yPercent: -65, opacity: 0, rotation: -2,
          duration: 0.32, stagger: 0.035, ease: 'power2.in',
        }, at)
        timeline.to(copy.querySelector('p'), { y: -14, opacity: 0, duration: 0.24 }, at)
        timeline.to(copy, { autoAlpha: 0, duration: 0.01 }, at + 0.55)
      }
      const enter = (copy, at) => {
        timeline.fromTo(copy, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: true }, at)
        timeline.fromTo(copy.querySelectorAll('.word'),
          { yPercent: 85, opacity: 0, rotation: 3 },
          { yPercent: 0, opacity: 1, rotation: 0, duration: 0.46,
            stagger: 0.065, ease: 'power3.out', immediateRender: true }, at)
        timeline.fromTo(copy.querySelector('p'), { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.38, immediateRender: true }, at + 0.23)
      }
      exit(copies[0], 1.5)
      enter(copies[1], HERO_TIMING.secondIn)
      exit(copies[1], 3.55)
      enter(copies[2], HERO_TIMING.thirdIn)
      exit(copies[2], 6.15)
      timeline.to(root.querySelector('.site-header'), { autoAlpha: 0, y: -10, duration: 0.5 }, 6.35)
      timeline.to(root.querySelector('.hero-shade'), { opacity: 0, duration: 0.5 }, 6.35)
      timeline.to(root.querySelector('.hero-white'), { opacity: 1, duration: 0.85 }, HERO_TIMING.whiteIn)

      // Refresh on fonts arriving or restored media/layout without resetting scroll.
      document.fonts.ready.then(() => { if (!destroyed) ScrollTrigger.refresh() })
      return () => {
        timeline.scrollTrigger?.kill()
        timeline.kill()
        copies.forEach((copy, i) => copy.setAttribute('aria-hidden', String(i !== 0)))
      }
    })
    media.add('(prefers-reduced-motion: reduce)', () => {
      // CSS displays all three messages in normal flow; no pinning or video seek.
      copies.forEach((copy) => copy.removeAttribute('aria-hidden'))
      return () => copies.forEach((copy, i) => copy.setAttribute('aria-hidden', String(i !== 0)))
    })

    return () => {
      destroyed = true
      media.revert()
      video.removeEventListener('loadedmetadata', onMetadata)
      video.removeEventListener('loadeddata', seekLatest)
      video.removeEventListener('seeked', seekLatest)
      video.removeEventListener('error', onError)
    }
  }, [rootRef, videoRef])
}
