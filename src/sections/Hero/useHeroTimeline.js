import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'

export const HERO_TIMING = { duration: 6.125, secondIn: 2.1, thirdIn: 4.2 }
const FRAME = 1 / 24

export function useHeroTimeline(rootRef, videoRef, reverseRef) {
  useLayoutEffect(() => {
    const root = rootRef.current
    const videos = [videoRef.current, reverseRef.current]
    const copies = [...root.querySelectorAll('.hero-copy')]
    const media = gsap.matchMedia()
    let disposed = false
    media.add('(prefers-reduced-motion: no-preference)', () => {
      videos[0].style.opacity = '1'
      videos[1].style.opacity = '0'
      const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
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
      // Hold the third message over the clean white-card endpoint.
      // The original scene times stay unchanged because only the tail was cut.
      timeline.to({}, { duration: HERO_TIMING.duration }, 0)


      let alive = true
      let active = 0, visible = false, ready = false, frame = 0, switching = false
      const sync = () => {
        const video = videos[active]
        const time = active === 0 ? video.currentTime : Math.max(0, video.duration - FRAME - video.currentTime)
        timeline.time(Math.min(time, timeline.duration()), false)
        const state = time < 2.1 ? 0 : time < 4.2 ? 1 : time < 6.8 ? 2 : -1
        copies.forEach((copy, index) => copy.setAttribute('aria-hidden', String(index !== state)))
        root.dataset.progress = (time / HERO_TIMING.duration).toFixed(3)
        root.dataset.direction = active === 0 ? 'forward' : 'reverse'
      }
      const tick = () => { sync(); frame = requestAnimationFrame(tick) }
      const allowed = () => alive && ready && visible && !document.hidden && !disposed
      const update = () => {
        cancelAnimationFrame(frame)
        videos.forEach((video, index) => { if (index !== active || !allowed()) video.pause() })
        if (allowed()) {
          videos[active].play().catch(() => { root.dataset.autoplayBlocked = 'true' })
          frame = requestAnimationFrame(tick)
        }
      }
      // Prepare the incoming frame while its fully decoded outgoing counterpart
      // remains visible. Skip the duplicate endpoint on subsequent passes.
      const prepare = video => { video.pause(); video.currentTime = FRAME }
      const swap = async () => {
        if (switching || !allowed()) return
        const incoming = videos[1 - active]
        if (incoming.readyState < 2 || incoming.seeking) return
        switching = true
        try {
          await incoming.play()
          if (!allowed()) { incoming.pause(); return }
          const outgoing = videos[active]
          incoming.style.opacity = '1'
          outgoing.style.opacity = '0'
          active = 1 - active
          prepare(outgoing)
          sync()
        } catch { root.dataset.autoplayBlocked = 'true' }
        finally { switching = false }
      }
      const prepareIncoming = () => { if (videos[1].currentTime === 0) prepare(videos[1]) }
      videos[1].addEventListener('loadedmetadata', prepareIncoming)
      if (videos[1].readyState >= 1) prepareIncoming()
      const onReady = () => { if (videos[active].ended) swap() }
      const onSeek = event => {
        if (event.target !== videos[active] && videos[active].ended) swap()
      }
      videos.forEach(video => {
        video.addEventListener('ended', swap)
        video.addEventListener('canplay', onReady)
        video.addEventListener('seeked', onSeek)
      })
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.intersectionRatio >= 0.15
        update()
      }, { threshold: [0, 0.15] })
      observer.observe(root)
      document.addEventListener('visibilitychange', update)
      const retry = () => { update(); if (videos[active].ended) swap() }
      root.addEventListener('pointerdown', retry)
      const select = event => {
        const time = [0, 2.85, 5.14][event.detail]
        if (time == null) return
        videos[active].currentTime = active === 0 ? time : videos[active].duration - FRAME - time
        sync()
      }
      root.addEventListener('hero:select', select)
      // Preserve the existing CSS opening reveal, including word stagger.
      Promise.all([document.fonts.ready, ...root.querySelectorAll('.word-inner')].map(item =>
        item instanceof Element ? Promise.all(item.getAnimations().map(animation => animation.finished.catch(() => {}))) : item
      )).then(() => { if (!disposed && alive) { ready = true; update() } })
      sync()
      return () => {
        alive = false
        ready = false
        videos[1].removeEventListener('loadedmetadata', prepareIncoming)
        cancelAnimationFrame(frame)
        observer.disconnect()
        videos.forEach(video => {
          video.pause()
          video.removeEventListener('ended', swap)
          video.removeEventListener('canplay', onReady)
          video.removeEventListener('seeked', onSeek)
        })
        document.removeEventListener('visibilitychange', update)
        root.removeEventListener('pointerdown', retry)
        root.removeEventListener('hero:select', select)
        timeline.revert()
      }
    })
    media.add('(prefers-reduced-motion: reduce)', () => {
      videos.forEach(video => video.pause())
      copies.forEach(copy => copy.removeAttribute('aria-hidden'))
    })
    return () => { disposed = true; media.revert() }
  }, [rootRef, videoRef, reverseRef])
}
