import { useEffect, useRef, useState } from 'react'
import security from '../../../videos/security.mp4'
import support from '../../../videos/24_7_support.mp4'
import friendly from '../../../videos/user_friendly_interface.mp4'
import './Experience.css'

const FEATURES = [
  { title: 'Security', description: 'Spenda helps you move from crypto to cash to everyday payments securely and without stress.', video: security },
  { title: '24/7 Support', description: 'Get help whenever you need it, our support team is available around the clock.', video: support },
  { title: 'User-friendly interface', description: 'A clean, intuitive experience designed so anyone can move money with confidence.', video: friendly },
]

export default function Experience() {
  const root = useRef(null)
  const controller = useRef(null)
  const [active, setActive] = useState(0)
  const [blocked, setBlocked] = useState(false)
  useEffect(() => {
    const section = root.current
    const videos = [...section.querySelectorAll('video')]
    const fills = [...section.querySelectorAll('.experience-fill')]
    let index = 0, visible = false, disposed = false, frame = 0
    const running = () => visible && !document.hidden && !disposed
    const progress = () => {
      const video = videos[index]
      if (Number.isFinite(video.duration) && video.duration > 0) {
        fills[index].style.transform = `scaleX(${Math.min(1, video.currentTime / video.duration)})`
      }
    }
    const tick = () => { progress(); frame = requestAnimationFrame(tick) }
    const play = () => {
      const video = videos[index]
      if (!running()) return
      video.play().then(() => {
        if (!running() || video !== videos[index]) video.pause()
        else setBlocked(false)
      }).catch(() => { if (!disposed && video === videos[index]) setBlocked(true) })
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      if (running()) {
        play()
        frame = requestAnimationFrame(tick)
      } else {
        videos.forEach(video => video.pause())

      }
    }
    const select = next => {
      videos.forEach(video => video.pause())
      index = next
      fills.forEach(fill => { fill.style.transform = 'scaleX(0)' })
      videos[index].currentTime = 0
      setActive(index)
      setBlocked(false)
      sync()
    }
    const ended = videos.map((video, i) => () => {
      if (i !== index || disposed) return
      fills[i].style.transform = 'scaleX(1)'
      if (i < videos.length - 1) select(i + 1)
      else select(0)
    })
    videos.forEach((video, i) => video.addEventListener('ended', ended[i]))
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.15
      sync()
    }, { threshold: [0, 0.15] })
    observer.observe(section)
    document.addEventListener('visibilitychange', sync)
    controller.current = { select, play }
    return () => {
      disposed = true
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      cancelAnimationFrame(frame)
      videos.forEach((video, i) => { video.pause(); video.removeEventListener('ended', ended[i]) })
      controller.current = null
    }
  }, [])

  return <section ref={root} className="experience" aria-labelledby="experience-heading">
    <header className="experience-heading">
      <h2 id="experience-heading">Built for speed, clarity, and control</h2>
      <p>Spenda helps you move from crypto to cash to everyday payments securely and without stress.</p>
    </header>
    <div className="experience-layout">
      <div className="experience-visual">
        {FEATURES.map((feature, index) => <video key={feature.title} src={feature.video} muted playsInline preload="auto"
          className={active === index ? 'is-active' : ''} aria-hidden={active !== index} aria-label={`${feature.title} animation`} />)}
        {blocked && <button className="experience-play" onClick={() => controller.current?.play()}>Play video</button>}
      </div>
      <div className="experience-features">
        {FEATURES.map((feature, index) => <button key={feature.title} className={`experience-feature ${active === index ? 'is-active' : ''}`}
          aria-pressed={active === index} onClick={() => controller.current?.select(index)}>
          <span className="experience-title">{feature.title}</span>
          <span className="experience-description">{feature.description}</span>
          <span className="experience-line" aria-hidden="true"><span className="experience-fill" /></span>
        </button>)}
      </div>
    </div>
  </section>
}

