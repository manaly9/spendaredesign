import { useEffect, useRef } from 'react'
import { useHeroTimeline } from './useHeroTimeline.js'
import './Hero.css'
import MobileNavigation from './MobileNavigation.jsx'

import forwardVideo from '../../../videos/Spenda_card_product_animation_forward.mp4'
import reverseVideo from '../../../videos/Spenda_card_product_animation - reverse.mp4'

const states = [
  {
    lines: ['Crypto made simple.', 'For everyday life.'],
    description: 'Deposit crypto, convert to Naira and make everyday payments, all in one connected experience.',
  },
  {
    lines: ['Deposit USDT,', 'USDC and more.'],
    description: 'Bring your supported digital assets into Spenda through a simple deposit experience.',
  },
  {
    lines: ['Meet your virtual', 'USD card.'],
    description: 'A digital card designed to give you more ways to pay online.',
  },
]

function WordHeading({ lines, first }) {
  let wordIndex = 0
  const Tag = first ? 'h1' : 'h2'
  return (
    <Tag className="hero-heading" aria-label={lines.join(' ')}>
      {lines.map((line) => (
        <span className="heading-line" aria-hidden="true" key={line}>
          {line.split(' ').map((word) => (
            <span className="word" key={word}>
              <span className="word-inner" style={{ '--word-index': wordIndex++ }}>{word}</span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  )
}

function Brand() {
  return (
    <a className="brand" href="#main" aria-label="Spenda home">
      {/* Temporary approximation. Replace with official brand SVG when supplied. */}
      <svg className="brand-symbol" viewBox="0 0 28 34" fill="currentColor" aria-hidden="true">
        <path d="M14 1h11v13H11V4a3 3 0 0 1 3-3ZM3 18h14v10a5 5 0 0 1-5 5H1V20a2 2 0 0 1 2-2Z" />
      </svg>
      <span>Spenda</span>
    </a>
  )
}

export default function Hero() {
  const root = useRef(null)
  const video = useRef(null)
  const reverse = useRef(null)
  const dialog = useRef(null)
  const products = useRef(null)
  useHeroTimeline(root, video, reverse)

  useEffect(() => {
    const closeOutside = (event) => {
      if (products.current && !products.current.contains(event.target)) products.current.open = false
    }
    const closeEscape = (event) => {
      if (event.key === 'Escape' && products.current) products.current.open = false
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [])

  function goToState(index) {
    products.current.open = false
    root.current.dispatchEvent(new CustomEvent('hero:select', { detail: index }))
    root.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <section className="hero" ref={root} aria-label="Spenda introduction">
        <div className="hero-stage">
          <div className="hero-media" aria-hidden="true">
            <video ref={video} className="hero-video" muted playsInline preload="auto"
              poster="/media/hero/spenda-card-poster.jpg" disablePictureInPicture
              tabIndex={-1}>
              <source src={forwardVideo} type="video/mp4" />
            </video>
            <video ref={reverse} className="hero-video" muted playsInline preload="auto"
              style={{ opacity: 0 }} disablePictureInPicture tabIndex={-1}>
              <source src={reverseVideo} type="video/mp4" />
            </video>
          </div>
          <div className="hero-shade" aria-hidden="true" />
          <header className="site-header">
            <Brand />
            <nav className="main-nav" aria-label="Main navigation">
              <details className="products-menu" ref={products}>
                <summary>Our Products <svg viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" /></svg></summary>
                <div className="products-panel">
                  <button onClick={() => goToState(0)}>Everyday payments</button>
                  <button onClick={() => goToState(1)}>Crypto deposits</button>
                  <button onClick={() => goToState(2)}>Virtual USD card</button>
                </div>
              </details>
              <span className="blog-placeholder" role="link" aria-disabled="true" title="Blog link coming soon">Blog</span>
            </nav>
            <button className="download-button" onClick={() => dialog.current.showModal()}>
              Download <span className="download-now">Now</span>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v12m-5-5 5 5 5-5M4 18h12" /></svg>
            </button>
            <MobileNavigation onProduct={goToState} onDownload={() => dialog.current.showModal()} />
          </header>

          <div className="hero-copy-stack">
            {states.map((state, index) => (
              <article className={`hero-copy hero-copy-${index + 1}`} key={state.lines[0]}
                aria-hidden={index !== 0 ? 'true' : undefined}>
                <WordHeading lines={state.lines} first={index === 0} />
                <p className="hero-description">{state.description}</p>
              </article>
            ))}
          </div>
          <div className="hero-white" aria-hidden="true" />
        </div>
      </section>
      <dialog className="download-dialog" ref={dialog} onClick={(event) => {
        if (event.target === dialog.current) dialog.current.close()
      }}>
        <button className="dialog-close" aria-label="Close download window" onClick={() => dialog.current.close()}>Ã—</button>
        <h2>Take Spenda with you.</h2>
        <p>App download links will be available soon.</p>
        <div className="store-badges">
          <img src="/media/app-store.png" alt="Download on the App Store" width="251" height="83" />
          <img src="/media/play-store.png" alt="Get it on Play Store" width="249" height="83" />
        </div>
      </dialog>
    </>
  )
}

