import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SpendaCard from './SpendaCard.jsx'
import './VirtualCardShowcase.css'
import { useScrollMeasurements } from '../../useScrollMeasurements.js'

gsap.registerPlugin(ScrollTrigger)

const USE_CASES = [
  { id: 'shopping', title: 'Global Shopping', description: 'Discover a more convenient way to make eligible purchases from international online stores.', at: 5.8 },
  { id: 'subscriptions', title: 'Subscriptions', description: 'Pay for eligible entertainment, streaming and digital subscriptions using your virtual USD card.', at: 6.6 },
  { id: 'tools', title: 'Software & Tools', description: 'Keep your creative tools, productivity software and online services within reach.', at: 7.35 },
  { id: 'advertising', title: 'Digital Advertising', description: 'Pay for eligible online advertising campaigns and digital business expenses with greater flexibility.', at: 8.05 },
]

function WaveHeading({ children, className }) {
  return <h2 className={className} aria-label={children}>
    {children.split(' ').map((word, index) => <span className="card-word" aria-hidden="true" key={`${word}-${index}`}>{word}</span>)}
  </h2>
}

export default function VirtualCardShowcase() {
  const root = useRef(null)
  useScrollMeasurements(root)

  useLayoutEffect(() => {
    const stage = root.current
    const section = stage.closest('.phone-dashboard')
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const screen = section.querySelector('.cards-app-screen')
      const source = section.querySelector('.cards-screen-card')
      const shared = stage.querySelector('.card-shared')
      const intro = stage.querySelector('.card-introduction')
      const heading = stage.querySelector('.card-showcase-heading')
      const cases = [...stage.querySelectorAll('.card-use-case-content')]
      const black = shared.querySelector('.card-art-black')
      const white = shared.querySelector('.card-art-white')
      const composition = section.querySelector('.phone-composition')
      const originalStyles = new Map([
        ...stage.querySelectorAll('*'), screen, source, composition,
        section.querySelector('.phone-copy'), section.querySelector('.phone-notification-layer'),
        section.querySelector('.phone-naira'), section.querySelector('.phone-transition-boundary'),
      ].map(element => [element, element.getAttribute('style')]))
      // Layout coordinates ignore current transforms, so refreshes while expanded
      // still measure the original card inside the same, persistent phone.
      const sourceBox = () => {
        const composition = section.querySelector('.phone-composition')
        const scale = Number(gsap.getProperty(composition, 'scaleX')) || 1
        const bounds = composition.getBoundingClientRect()
        const card = source.getBoundingClientRect()
        const screenBounds = screen.getBoundingClientRect()
        const slot = screen.parentElement.getBoundingClientRect()
        return {
          x: (card.left - screenBounds.left + slot.left - bounds.left) / scale + composition.offsetLeft,
          y: (card.top - bounds.top) / scale + composition.offsetTop,
          width: card.width / scale,
        }
      }
      const cardWidth = () => window.innerWidth <= 600 ? Math.min(window.innerWidth * 0.44, 220) : Math.min(window.innerWidth * 0.28, 420)
      const cardX = () => section.clientWidth * 0.5 - cardWidth() * 0.5
      const cardY = () => stage.clientHeight * (window.innerWidth <= 600 ? 0.32 : 0.48) - cardWidth() / (1280 / 822) * 0.5
      const cardIntroY = () => cardY() + (window.innerWidth <= 600 ? window.innerHeight * 0.09 : 0)
      gsap.set(screen, { xPercent: 105, autoAlpha: 0 })
      gsap.set([intro, heading, ...cases, shared], { autoAlpha: 0 })
      gsap.set(black, { opacity: 1 })
      gsap.set(white, { opacity: 0 })
      gsap.set(shared, { x: sourceBox().x, y: sourceBox().y, width: sourceBox().width, transformPerspective: 1100 })

      const timeline = gsap.timeline({
        id: 'spenda-card-master', defaults: { ease: 'none' },
        scrollTrigger: {
          id: 'spenda-card-showcase', trigger: section, pin: section,
          start: 'top top', end: () => `+=${window.innerHeight * (window.innerWidth <= 600 ? 3.2 : 4.2)}`,
          scrub: 0.35, anticipatePin: 1, invalidateOnRefresh: true,
        },
        onUpdate: () => {
          stage.dataset.progress = timeline.progress().toFixed(3)
          const time = timeline.time()
          intro.setAttribute('aria-hidden', String(time < 1.2 || time >= 3.1))
          heading.setAttribute('aria-hidden', String(time < 4.4 || time >= 5.75))
          cases.forEach((item, index) => item.setAttribute('aria-hidden', String(time < USE_CASES[index].at)))
        },
      })
      // The first 12% preserves an ordinary, playing phone demonstration.
      timeline.to({}, { duration: 10 }, 0)
        .to(section.querySelector('.phone-copy'), { autoAlpha: 0, duration: 0.3 }, 1.2)
        .to(section.querySelector('.phone-notification-layer'), { autoAlpha: 0, duration: 0.4 }, 1.2)
        .to(section.querySelector('.phone-naira'), { autoAlpha: 0, duration: 0.4 }, 1.2)
        .set(screen, { autoAlpha: 1 }, 1.2)
        .to(screen, { xPercent: 0, duration: 0.9, ease: 'back.out(1.05)' }, 1.2)
        .set(intro, { autoAlpha: 1 }, 1.4)
        .fromTo(intro.querySelectorAll('.card-word'), { yPercent: 85, opacity: 0, rotation: 3 }, {
          yPercent: 0, opacity: 1, rotation: 0, duration: 0.46, stagger: 0.065, ease: 'power3.out',
        }, 1.4)
        .fromTo(intro.querySelector('p'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, ease: 'power3.out' }, 1.63)
        .to(intro, { autoAlpha: 0, duration: 0.3 }, 2.8)
        .fromTo(shared, { x: () => sourceBox().x, y: () => sourceBox().y, width: () => sourceBox().width, rotation: 0 }, {
          x: cardX, y: cardIntroY, width: cardWidth, rotation: -6, duration: 1.6, ease: 'power2.inOut', immediateRender: false,
        }, 2.8)
        .set(shared, { autoAlpha: 1 }, 2.8)
        .set(source, { opacity: 0 }, 2.8)
        .to(black, { opacity: 0, duration: 0.85, ease: 'sine.inOut' }, 3.35)
        .to(white, { opacity: 1, duration: 0.85, ease: 'sine.inOut' }, 3.35)
        .to(section.querySelector('.phone-composition'), { autoAlpha: 0, scale: 0.88, duration: 1.1, ease: 'power2.inOut' }, 3.05)
        .to(section.querySelector('.phone-transition-boundary'), { autoAlpha: 0, duration: 0.4 }, 2.8)
        .to(section, { backgroundColor: '#000100', duration: 1.6, ease: 'sine.inOut' }, 2.8)
        .set(heading, { autoAlpha: 1 }, 4.4)
        .fromTo(heading.querySelector('.card-product-label'), { opacity: 0, y: 8 }, {
          opacity: 1, y: 0, duration: 0.3, ease: 'power3.out',
        }, 4.4)
        .fromTo(heading.querySelectorAll('.card-word'), { yPercent: 85, opacity: 0, rotation: 3 }, {
          yPercent: 0, opacity: 1, rotation: 0, duration: 0.46, stagger: 0.065, ease: 'power3.out',
        }, 4.45)
        .fromTo(heading.querySelector('.card-showcase-description'), { opacity: 0, y: 12 }, {
          opacity: 1, y: 0, duration: 0.35, ease: 'power3.out',
        }, 4.7)
        .to(heading, { autoAlpha: 0, y: -10, duration: 0.5, ease: 'power2.inOut' }, 5.25)
        .to(shared, { y: cardY, rotation: 7, rotationY: -3, duration: 0.75, ease: 'sine.inOut' }, 5.25)
        .to(shared, { rotation: 17, rotationY: 3, duration: 0.85, ease: 'sine.inOut' }, 6)
        .to(shared, { rotation: 54, rotationY: 0, duration: 1.05, ease: 'sine.inOut' }, 6.85)
        .to(shared, { rotation: 90, rotationY: 0, duration: 0.9, ease: 'sine.inOut' }, 7.9)

      cases.forEach((item, index) => timeline.fromTo(item, { autoAlpha: 0, y: 18 }, {
        autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out',
      }, USE_CASES[index].at))

      const clearSemantics = () => [intro, heading, ...cases].forEach(item => item.removeAttribute('aria-hidden'))
      return () => {
        // matchMedia reverts the timeline, its pin, and all measured styles.
        // Killing it here would discard the state needed for a complete revert.
        // Restore original inline styles after nested fromTo start states revert,
        // including when the visitor changes their motion preference mid-scene.
        originalStyles.forEach((style, element) => {
          if (style === null) element.removeAttribute('style')
          else element.setAttribute('style', style)
        })
        // These nodes are owned entirely by this scene and have no authored
        // inline styles. Discard cached fromTo start states on StrictMode replay.
        stage.querySelectorAll('*').forEach(element => element.removeAttribute('style'))
        screen.removeAttribute('style')
        source.removeAttribute('style')
        clearSemantics()
      }
    }, section)
    return () => media.revert()
  }, [])

  return (
    <section className="virtual-card-showcase" ref={root} aria-label="Spenda virtual USD card">
      <header className="card-introduction">
        <WaveHeading className="card-intro-heading">Your world. One virtual card.</WaveHeading>
        <p>One virtual card for more of your online spending needs.</p>
      </header>
      <div className="card-showcase-heading">
        <p className="card-product-label">Spenda Visa Platinum Card</p>
        <WaveHeading>Spend beyond borders.</WaveHeading>
        <p className="card-showcase-description">One virtual card. More ways to pay for the things that move your world.</p>
      </div>
      <SpendaCard className="card-shared" appearance="transform" />
      <div className="card-use-cases">
        {USE_CASES.map(item => <article className={`card-use-case card-use-case-${item.id}`} key={item.id}>
          <div className="card-use-case-content"><h3 aria-label={item.title}>{item.title === 'Subscriptions' ? item.title : (
            item.title === 'Software & Tools' ? ['Software &', 'Tools'] : item.title.split(' ')
          ).map(line => <span key={line}>{line}{' '}</span>)}</h3><p>{item.description}</p></div>
        </article>)}
      </div>
    </section>
  )
}
