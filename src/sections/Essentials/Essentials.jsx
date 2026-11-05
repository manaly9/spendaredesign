import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useScrollMeasurements } from '../../useScrollMeasurements.js'
import airtime from '../../../videos/airtime_purchase_video.mp4'
import data from '../../../videos/spenda_buy_data_payment_animation.mp4'
import electricity from '../../../videos/spenda_electricity_payment_animation (4).mp4'
import subscriptions from '../../../videos/list_subscription_video2.mp4'
import airtimeIcon from '../../../other_icons/airtime_icons (1).png'
import cryptoIcon from '../../../other_icons/crypto_icons (3).png'
import dstv from '../../../other_icons/dstv.png'
import netflix from '../../../other_icons/netflix.png'
import spotify from '../../../other_icons/spotify.png'
import './Essentials.css'

gsap.registerPlugin(ScrollTrigger)
const CARDS = [
  { title: 'Airtime Top Up', description: 'Stay connected with ease.', video: airtime },
  { title: 'Mobile Data', description: 'Keep your world connected with simple data top-ups.', video: data },
  { title: 'Electricity Bills', description: 'Power your everyday with convenient electricity payments.', video: electricity },
  { title: 'Subscriptions', description: 'Enjoy more of what you love.', video: subscriptions },
]
const ICONS = [airtimeIcon, cryptoIcon, dstv, netflix, spotify, cryptoIcon]

export default function Essentials() {
  const root = useRef(null)
  useScrollMeasurements(root)
  useLayoutEffect(() => {
    const section = root.current
    const videos = [...section.querySelectorAll('video')]
    let alive = true
    const requestedPlayback = new WeakSet()
    const pause = video => {
      requestedPlayback.delete(video)
      video.pause()
    }
    const play = video => {
      requestedPlayback.add(video)
      if (!video.paused) return
      video.play()?.then(() => {
        if (!alive || !requestedPlayback.has(video)) { video.pause(); return }
        if (alive) video.closest('article').removeAttribute('data-play-blocked')
      }).catch(() => {
        if (alive) video.closest('article').setAttribute('data-play-blocked', '')
      })
    }
    const media = gsap.matchMedia()
    media.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)' }, context => {
      if (context.conditions.reduced) {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
          const video = entry.target.querySelector('video')
          if (entry.isIntersecting) play(video)
          else pause(video)
        }), { threshold: 0.2 })
        section.querySelectorAll('article').forEach(card => observer.observe(card))
        return () => { observer.disconnect(); videos.forEach(pause) }
      }
      const viewport = section.querySelector('.essentials-viewport')
      const track = section.querySelector('.essentials-track')
      const captions = section.querySelectorAll('.essentials-caption')
      const icons = section.querySelectorAll('.essentials-icon')
      let expanded = false
      let started = false
      let visible = false
      let gallery
      const syncVideos = () => {
        const position = Math.max(0, Math.min(3, -Number(gsap.getProperty(track, 'xPercent')) / 100))
        videos.forEach((video, index) => {
          const shown = Math.abs(index - position) < 0.999
          video.closest('article').setAttribute('aria-hidden', String(!shown))
          if (visible && shown && !document.hidden) play(video)
          else pause(video)
        })
      }
      const expansion = gsap.timeline({ paused: true, onComplete: () => {
        expanded = true
        section.dataset.expanded = 'true'
      } })
        .to(viewport, { '--reveal-width': '100%', '--reveal-height': '100%', duration: 1.4, ease: 'power3.inOut' }, 0)
        .to(section, { backgroundColor: '#000000', duration: 1.3, ease: 'power2.inOut' }, 0)
        .to(section.querySelector('.essentials-type'), { color: '#292929', duration: 1.3 }, 0)
        .to(icons, { autoAlpha: 0.7, duration: 0.7, stagger: 0.05 }, 0.6)
        .to(captions, { autoAlpha: 1, duration: 0.4 }, 1)
      const start = () => {
        if (started) return
        started = true
        expansion.play()
      }
      gallery = gsap.timeline({
        onUpdate: () => {
          // Scrub smoothing can advance after ScrollTrigger's callback. Resolve
          // the outer reveal before the inner track renders its first movement.
          if (gallery?.time() > 0.7 && !expanded) expansion.progress(1)
          syncVideos()
        },
        scrollTrigger: {
          id: 'spenda-essentials', trigger: section, pin: section,
          start: 'top top', end: () => `+=${window.innerHeight * 4.4}`,
          scrub: 0.35, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: self => {
            if (self.progress > 0) start()
            // Advancing into the filmstrip always resolves Phase A first.
            if (self.progress >= 0.7 / 5.65 && !expanded) expansion.progress(1)
          },
        },
      })
      gallery.to({}, { duration: 0.7 })
      for (let index = 1; index < CARDS.length; index++) {
        gallery.to(track, {
          xPercent: -100 * index, duration: 1, ease: 'back.inOut(0.25)',
          modifiers: { xPercent: value => Math.max(-300, Math.min(0, parseFloat(value))) },
        })
          .to({}, { duration: 0.65 })
      }
      const ambient = [
        gsap.to(section.querySelector('.essentials-marquee'), {
          xPercent: -50, duration: 65, repeat: -1, ease: 'none', paused: true,
        }),
        ...Array.from(icons, (icon, index) => {
          const distance = window.innerWidth < 600 ? 0.45 : 1
          return gsap.fromTo(icon,
            { x: -3 * distance, y: -4 * distance, rotation: -2 },
            { x: (index % 2 ? 7 : -7) * distance,
              y: (index % 3 ? 10 : -8) * distance, rotation: index % 2 ? 4 : -4,
              duration: 3.6 + index * 0.7, repeat: -1, yoyo: true,
              ease: 'sine.inOut', paused: true }).progress(index / 7)
        }),
      ]
      const syncAmbient = () => ambient.forEach(animation => {
        if (visible && !document.hidden) animation.resume()
        else animation.pause()
      })
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting
        syncAmbient()
        if (entries[0].intersectionRatio >= 0.55) start()
        syncVideos()
      }, { threshold: [0, 0.01, 0.55] })
      observer.observe(section)
      // Independent, slow background drift; never touches the gallery track.

      const onVisibility = () => {
        syncAmbient()
        if (document.hidden) videos.forEach(pause)
        else syncVideos()
      }
      document.addEventListener('visibilitychange', onVisibility)
      return () => {
        observer.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
        videos.forEach(pause)
        delete section.dataset.expanded
      }
    }, section)
    return () => { alive = false; media.revert() }
  }, [])

  return <section className="essentials" ref={root} aria-label="Zero complexity. Everyday essentials.">
    <div className="essentials-type" aria-hidden="true"><div className="essentials-marquee">{[0, 1].map(copy => <span key={copy}>Zero complexity. Everyday essentials.</span>)}</div></div>
    <div className="essentials-decoration" aria-hidden="true">
      {ICONS.map((src, index) => <img className={`essentials-icon essentials-icon-${index}`} src={src} key={index} alt="" />)}
    </div>
    <div className="essentials-position">
      <div className="essentials-viewport">
        <div className="essentials-track">
          {CARDS.map(card => <article className="essentials-card" key={card.title}>
            <video src={card.video} muted playsInline loop preload="auto" aria-label={`${card.title} demonstration`} />
            <div className="essentials-caption"><h2>{card.title}</h2><p>{card.description}</p></div>
            <button className="essentials-play" type="button" onClick={event => {
              const article = event.currentTarget.closest('article')
              article.querySelector('video').play().then(() => article.removeAttribute('data-play-blocked')).catch(() => {})
            }}>Play video</button>
          </article>)}
        </div>
      </div>
    </div>
  </section>
}

