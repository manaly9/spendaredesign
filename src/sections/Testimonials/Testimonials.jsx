import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { TESTIMONIALS } from './testimonials.js'
import { TESTIMONIAL_ASSETS } from './testimonialAssets.js'
import './Testimonials.css'

function Review({ review, duplicate }) {
  return <article className="testimonial-card" tabIndex={duplicate ? undefined : 0}>
    <blockquote>{review.quote}</blockquote>
    <footer><img className="testimonial-avatar" src={TESTIMONIAL_ASSETS.avatar} alt="" width="23" height="23" /><span>{review.name}</span><img className="testimonial-source" src={review.platformIcon} alt={review.source} width="28" height="28" /></footer>
  </article>
}

export default function Testimonials() {
  const root = useRef(null)
  useLayoutEffect(() => {
    const section = root.current
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      let visible = false
      const cleanups = []
      const rows = [...section.querySelectorAll('.testimonial-row')].map((row, index) => {
        const track = row.querySelector('.testimonial-track')
        const control = row.querySelector('.testimonial-control')
        let hovered = false, focused = false, manual = false
        const tween = gsap.fromTo(track, { xPercent: index ? -50 : 0 }, {
          xPercent: index ? 0 : -50, duration: 110, ease: 'none', repeat: -1, paused: true,
        })
        const sync = () => {
          const paused = !visible || document.hidden || hovered || focused || manual
          tween.paused(paused)
          control.textContent = manual ? 'Resume row' : 'Pause row'
          control.setAttribute('aria-pressed', String(manual))
        }
        const enter = event => { if (event.target.closest('.testimonial-card')) { hovered = true; sync() } }
        const leave = event => { if (!event.relatedTarget || !row.contains(event.relatedTarget) || !event.relatedTarget.closest('.testimonial-card')) { hovered = false; sync() } }
        const focus = () => { focused = true; sync() }
        const blur = event => { if (!row.contains(event.relatedTarget)) { focused = false; sync() } }
        const toggle = () => { manual = !manual; sync() }
        const touch = event => { if (event.pointerType === 'touch' && event.target.closest('.testimonial-card')) toggle() }
        const handlers = [['pointerover', enter], ['pointerout', leave], ['focusin', focus], ['focusout', blur], ['pointerup', touch]]
        handlers.forEach(([name, handler]) => row.addEventListener(name, handler))
        control.addEventListener('click', toggle)
        cleanups.push(() => {
          tween.kill()
          handlers.forEach(([name, handler]) => row.removeEventListener(name, handler))
          control.removeEventListener('click', toggle)
        })
        return sync
      })
      const entrance = gsap.timeline({ paused: true })
        .from(section.querySelectorAll('.testimonial-word'), { y: 22, opacity: 0, stagger: .045, duration: .45, ease: 'power2.out' })
        .from(section.querySelector('.testimonials-heading p'), { opacity: 0, y: 10, duration: .4 }, .25)
        .from(section.querySelectorAll('.testimonial-row'), { opacity: 0, duration: .5, stagger: .12 }, .4)
      const sync = () => rows.forEach(update => update())
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting
        if (visible) entrance.play()
        sync()
      }, { threshold: 0 })
      observer.observe(section)
      document.addEventListener('visibilitychange', sync)
      return () => {
        observer.disconnect()
        document.removeEventListener('visibilitychange', sync)
        entrance.kill()
        cleanups.forEach(cleanup => cleanup())
      }
    }, section)
    return () => media.revert()
  }, [])
  const heading = "Don't take our word for it. Take theirs."
  return <section className="testimonials" ref={root} aria-labelledby="testimonials-heading">
    <header className="testimonials-heading">
      <h2 id="testimonials-heading" aria-label={heading}>{heading.split(' ').map((word, i) => <span className="testimonial-word" aria-hidden="true" key={i}>{word} </span>)}</h2>
      <p>Discover what people are saying about their experience with Spenda.</p>
    </header>
    {[TESTIMONIALS, [...TESTIMONIALS.slice(4), ...TESTIMONIALS.slice(0, 4)]].map((reviews, row) => <div className="testimonial-row" key={row} aria-label={`Customer reviews, row ${row + 1}`}>
      <div className="testimonial-window"><div className="testimonial-track">
        {[0, 1].map(copy => <div className="testimonial-group" key={copy} aria-hidden={copy ? 'true' : undefined}>
          {reviews.map(review => <Review key={review.name} review={review} duplicate={copy === 1} />)}
        </div>)}
      </div></div>
      <button className="testimonial-control" type="button" aria-pressed="false">Pause row</button>
    </div>)}
  </section>
}



