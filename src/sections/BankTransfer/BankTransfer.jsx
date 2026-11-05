import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { BANK_TILES } from './bankTiles.js'
import { createBankPhysics } from './bankPhysics.js'
import './BankTransfer.css'

gsap.registerPlugin(ScrollTrigger)

export default function BankTransfer() {
  const root = useRef(null)
  const landed = useRef(false)
  const physics = useRef(null)
  const tiltPermission = useRef({ asked: false, grants: [] })
  const [tiltStatus, setTiltStatus] = useState('idle')

  useLayoutEffect(() => {
    const section = root.current
    const media = gsap.matchMedia()
    media.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)', mobile: '(max-width: 600px)' }, context => {
      const moving = context.conditions.motion
      const mobile = context.conditions.mobile
      const falls = [...section.querySelectorAll('.bank-tile-fall')]
      const buttons = [...section.querySelectorAll('.bank-tile')]
      const words = section.querySelectorAll('.bank-word')
      const paragraph = section.querySelector('.bank-description')
      const simulation = moving ? createBankPhysics(section, setTiltStatus, tiltPermission.current) : null
      physics.current = simulation
      const coordinates = BANK_TILES.map(tile => mobile ? tile.mobileX : tile.x)
      const nearest = index => BANK_TILES.map((_, i) => i).filter(i => i !== index)
        .sort((a, b) => Math.abs(coordinates[a] - coordinates[index]) - Math.abs(coordinates[b] - coordinates[index])).slice(0, 2)
      const ready = () => {
        landed.current = true
        section.dataset.settled = 'true'
        buttons.forEach(button => { button.disabled = false })
        simulation?.start()
      }

      if (moving && !landed.current) {
        section.dataset.settled = 'false'
        buttons.forEach(button => { button.disabled = true })
        gsap.set(falls, { autoAlpha: 0 })
        const entrance = gsap.timeline({ paused: true, onComplete: ready })
          .fromTo(words, { yPercent: 85, opacity: 0, rotation: 3 }, {
            yPercent: 0, opacity: 1, rotation: 0, duration: 0.46, stagger: 0.065, ease: 'power3.out',
          }, 0)
          .fromTo(paragraph, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, ease: 'power3.out' }, 0.23)

        falls.forEach((tile, index) => {
          const at = 0.55 + index * 0.15
          const drop = 0.5 + (index % 3) * 0.035
          const spin = (index % 2 ? -1 : 1) * (8 + index % 4 * 3)
          const impact = at + drop
          entrance.fromTo(tile, { y: -(mobile ? 160 : 240) - index % 4 * 32, rotation: spin }, {
            y: 3, rotation: spin * -0.1, duration: drop, ease: 'power2.in',
          }, at)
            .to(tile, { autoAlpha: 1, duration: 0.13, ease: 'power1.out' }, at)
            .to(tile, { y: -(6 + index % 3 * 2), rotation: spin * 0.07, duration: 0.14, ease: 'power2.out' }, impact)
            .to(tile, { y: 0, rotation: 0, duration: 0.28, ease: 'power2.inOut' }, impact + 0.14)
          // A landing nudges already-landed adjacent tiles, on a separate layer.
          nearest(index).filter(i => i < index).forEach(neighbor => {
            const direction = coordinates[neighbor] < coordinates[index] ? -1 : 1
            entrance.to(buttons[neighbor], { x: direction * 3, rotation: direction * 0.8, duration: 0.09, ease: 'power1.out' }, impact)
              .to(buttons[neighbor], { x: 0, rotation: 0, duration: 0.24, ease: 'power2.out' }, impact + 0.09)
          })
        })
        entrance.to({}, { duration: 0.15 })
        ScrollTrigger.create({
          id: 'spenda-bank-transfer', trigger: section, start: 'top 35%', end: 'bottom top',
          onEnter: () => entrance.play(), onEnterBack: () => entrance.resume(),
          onLeave: () => entrance.pause(), onLeaveBack: () => entrance.pause(),
        })
      } else {
        gsap.set([words, paragraph, ...falls], { clearProps: 'transform,opacity,visibility' })
        ready()
      }

      return () => {
        simulation?.destroy()
        if (physics.current === simulation) physics.current = null
        gsap.killTweensOf(buttons)
      }
    }, section)
    return () => media.revert()
  }, [])

  return (
    <section className="bank-transfer" ref={root} aria-labelledby="bank-heading">
      <header className="bank-copy">
        <h2 id="bank-heading" aria-label="Seamless Bank Transfer">
          {'Seamless Bank Transfer'.split(' ').map(word => <span className="bank-word" aria-hidden="true" key={word}>{word}</span>)}
        </h2>
        <p className="bank-description">Move your Naira to Nigerian bank accounts with ease. Fast, simple transfers designed to keep your money moving.</p>
      </header>
      <div className="bank-pile" aria-label="Nigerian bank tiles">
        {BANK_TILES.map(tile => (
          <div className="bank-tile-slot" key={tile.id} data-bank={tile.id} style={{
            '--tile-x': `${tile.x}%`, '--tile-bottom': `${tile.bottom}%`, '--tile-size': `${tile.size}%`,
            '--tile-angle': `${tile.angle}deg`, '--tile-z': tile.z,
            '--mobile-x': `${tile.mobileX}%`, '--mobile-bottom': `${tile.mobileBottom}%`,
          }}>
            <div className="bank-tile-fall">
              <div className="bank-tile-physics">
              <button className="bank-tile" type="button" aria-label={`${tile.name} bank tile`}>
                <img src={tile.src} alt={tile.name} width="1254" height="1254" draggable="false" />
              </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bank-controls">
        <button type="button" onClick={() => physics.current?.enableTilt()} disabled={tiltStatus !== 'idle'}>Enable Tilt Interaction</button>
        <button type="button" onClick={() => physics.current?.reset()}>Reset Arrangement</button>
        <span className="bank-tilt-status" role="status">{({
          requesting: 'Waiting for motion access…', active: 'Tilt interaction enabled.',
          denied: 'Motion access declined. Mouse and touch still work.',
          unavailable: 'Tilt is unavailable here. Mouse and touch still work.',
        })[tiltStatus] || ''}</span>
      </div>
    </section>
  )
}
