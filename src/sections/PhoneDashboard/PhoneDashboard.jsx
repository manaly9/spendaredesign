import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import frame from '../../../other_images/phone_frame.png'
import NotificationCards from './NotificationCards.jsx'
import CardsScreen from '../VirtualCard/CardsScreen.jsx'
import VirtualCardShowcase from '../VirtualCard/VirtualCardShowcase.jsx'
import transferVideo from '../../../phone_section_video/spenda_bank_transfer_walkthrough.mp4'
import './PhoneDashboard.css'

gsap.registerPlugin(ScrollTrigger)

// Prepend the real crypto deposit clip here when supplied. No placeholder step.
const PHONE_DEMOS = [{ id: 'bank-transfer', src: transferVideo, label: 'Spenda bank transfer walkthrough' }]

function useDemoPlayback(videoRef, activeRef, rootRef, demos) {
  const [index, setIndex] = useState(0)
  const [blocked, setBlocked] = useState(false)
  const positions = useRef(new Map())

  useEffect(() => {
    const video = videoRef.current
    const root = rootRef.current
    const id = demos[index].id
    let disposed = false
    const sync = () => {
      const shouldPlay = activeRef.current && !document.hidden
      if (!shouldPlay) {
        positions.current.set(id, video.currentTime)
        video.pause()
      } else if (video.paused) {
        video.play().then(() => { if (!disposed) setBlocked(false) }).catch(() => {
          if (!disposed && activeRef.current && !document.hidden) setBlocked(true)
        })
      }
    }
    const restore = () => {
      const position = positions.current.get(id)
      if (position != null) video.currentTime = position
      sync()
    }
    const save = () => positions.current.set(id, video.currentTime)
    const ended = () => {
      save()
      if (index + 1 < demos.length) setIndex(index + 1)
    }
    root.addEventListener('demoactivity', sync)
    document.addEventListener('visibilitychange', sync)
    video.addEventListener('loadedmetadata', restore)
    video.addEventListener('timeupdate', save)
    video.addEventListener('ended', ended)
    if (video.readyState >= 1) restore()
    return () => {
      disposed = true
      save()
      video.pause()
      root.removeEventListener('demoactivity', sync)
      document.removeEventListener('visibilitychange', sync)
      video.removeEventListener('loadedmetadata', restore)
      video.removeEventListener('timeupdate', save)
      video.removeEventListener('ended', ended)
    }
  }, [index, demos, videoRef, activeRef, rootRef])

  return { demo: demos[index], blocked, resume: () => {
    videoRef.current.play().then(() => setBlocked(false)).catch(() => setBlocked(true))
  } }
}

export default function PhoneDashboard({ demos = PHONE_DEMOS }) {
  const root = useRef(null)
  const video = useRef(null)
  const active = useRef(false)
  const { demo, blocked, resume } = useDemoPlayback(video, active, root, demos)

  useLayoutEffect(() => {
    const section = root.current
    const setActive = (value) => {
      if (active.current === value) return
      active.current = value
      section.dataset.demoActive = String(value)
      section.dispatchEvent(new Event('demoactivity'))
    }
    const media = gsap.matchMedia()
    media.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, (context) => {
      const moving = context.conditions.motion
      const entrance = moving ? gsap.timeline({ paused: true })
        .from(section.querySelectorAll('.phone-word'), {
          yPercent: 85, opacity: 0, rotation: 3, duration: 0.46, stagger: 0.065, ease: 'power2.out',
        })
        .from('.phone-description', { y: 14, opacity: 0, duration: 0.38 }, 0.23)
        .from('.phone-device', { y: 95, opacity: 0, duration: 1.1, ease: 'power2.out' }, 0.45) : null

      // The white section stays in normal flow. Its edge moves one-to-one
      // with scrolling, while the existing content entrance settles by arrival.
      ScrollTrigger.create({
        id: 'spenda-phone-entrance', trigger: section,
        start: 'top bottom', end: 'top top',
        animation: entrance || undefined,
        scrub: moving ? 0.2 : false,
        invalidateOnRefresh: true,
      })
      // Playback changes only at the demonstration boundaries, never on timeline updates.
      // The exit boundary can become the next scene's start without changing the player.
      const boundary = ScrollTrigger.create({
        id: 'spenda-phone-demo', trigger: section, start: moving ? 'top 10%' : 'top 20%',
        endTrigger: moving ? undefined : section.querySelector('[data-next-scene-boundary]'),
        end: () => {
          const showcase = ScrollTrigger.getById('spenda-card-showcase')
          return moving && showcase ? showcase.start + (showcase.end - showcase.start) * 0.12 : 'top 35%'
        },
        onToggle: (self) => {
          setActive(self.isActive)
        },
      })
      setActive(boundary.isActive)
      return () => setActive(false)
    }, section)
    return () => media.revert()
  }, [])

  return (
    <section className="phone-dashboard" ref={root} aria-labelledby="phone-heading">
      <div className="phone-naira" aria-hidden="true">₦</div>
      <header className="phone-copy">
        <h2 id="phone-heading" aria-label="From crypto. To Naira.">
          {'From crypto. To Naira.'.split(' ').map((word) => <span className="phone-word" aria-hidden="true" key={word}>{word}</span>)}
        </h2>
        <p className="phone-description">Turn supported digital assets into Naira automatically, making your money ready for transfers, payments and more.</p>
      </header>
      <div className="phone-composition">
        <div className="phone-notification-layer"><NotificationCards /></div>
        <div className="phone-device">
          <div className="phone-screen">
            <video ref={video} src={demo.src} aria-label={demo.label} muted playsInline loop={demo.id === demos.at(-1).id} preload="auto" disablePictureInPicture />
            <CardsScreen />
          </div>
          <img className="phone-frame" src={frame} alt="" width="736" height="1449" />
          {blocked && <button className="phone-play" onClick={resume}>Play walkthrough</button>}
        </div>
      </div>
      <div className="phone-transition-boundary" data-next-scene-boundary aria-hidden="true" />
      <VirtualCardShowcase />
    </section>
  )
}
