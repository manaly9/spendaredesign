import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import received from '../../../other_images/phone_popups (1).png'
import successful from '../../../other_images/phone_popups (2).png'
import email from '../../../other_images/phone_popups (3).png'
import './NotificationCards.css'

const NOTIFICATIONS = [
  { id: 'success', image: successful, width: 1122, height: 245, direction: 'left', position: 'notification-success', loadingDuration: 0.55, delay: 0,
    description: 'Stablecoin transfer successful. Your transfer of 1000 USDC is complete.' },
  { id: 'received', image: received, width: 1122, height: 248, direction: 'right', position: 'notification-received', loadingDuration: 0.6, delay: 1.5,
    description: 'Transfer received: 1000 USDC.' },
  { id: 'email', image: email, width: 1122, height: 402, direction: 'left', position: 'notification-email', loadingDuration: 0.65, delay: 3,
    description: 'Spenda email confirming a completed stablecoin transfer.' },
]

export default function NotificationCards({ notifications = NOTIFICATIONS }) {
  const root = useRef(null)

  useLayoutEffect(() => {
    const container = root.current
    const section = container.closest('.phone-dashboard')
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const cards = [...container.querySelectorAll('.phone-notification')]
      const originX = (card, config) => card.offsetWidth * 0.85 * (config.direction === 'left' ? 1 : -1)
      const originY = (card) => window.innerWidth <= 600 ? Math.min(0, 495 - card.offsetTop) : 12
      // Let the existing phone entrance establish the device before the first
      // card emerges. Individual delays remain relative to the notification sequence.
      const sequenceStart = 0.95
      const cycle = gsap.timeline({ id: 'spenda-notifications', paused: true, repeat: -1, repeatDelay: 0.65 })
      cards.forEach((card, index) => {
        const config = notifications[index]
        const image = card.querySelector('.notification-artwork')
        const skeleton = card.querySelector('.notification-skeleton')
        const start = sequenceStart + config.delay
        gsap.set(card, { autoAlpha: 0, x: originX(card, config), y: originY(card) })
        gsap.set(image, { opacity: 0 })
        gsap.set(skeleton, { opacity: 1 })
        cycle.set(card, { x: () => originX(card, config), y: () => originY(card), autoAlpha: 0 }, start)
          .set(image, { opacity: 0 }, start)
          .set(skeleton, { opacity: 1 }, start)
          .to(card, { autoAlpha: 1, duration: 0.22, ease: 'power1.out' }, start)
          .to(card, { x: 0, y: 0, duration: 0.85, ease: 'back.out(1.1)' }, start)
          .to(skeleton, { opacity: 0, duration: 0.25, ease: 'sine.inOut' }, start + config.loadingDuration)
          .to(image, { opacity: 1, duration: 0.3, ease: 'sine.inOut' }, start + config.loadingDuration)
      })
      const exitAt = sequenceStart + Math.max(...notifications.map(item => item.delay + Math.max(0.85, item.loadingDuration + 0.3))) + 1.8
      cards.forEach((card, index) => {
        cycle.to(card, {
          x: () => originX(card, notifications[index]), y: () => originY(card),
          autoAlpha: 0, duration: 0.65, ease: 'power2.inOut',
        }, exitAt + index * 0.14)
      })
      const sync = () => {
        const playing = section.dataset.demoActive === 'true' && !document.hidden
        container.dataset.playing = String(playing)
        if (playing) cycle.resume()
        else cycle.pause()
      }
      section.addEventListener('demoactivity', sync)
      document.addEventListener('visibilitychange', sync)
      sync()
      return () => {
        section.removeEventListener('demoactivity', sync)
        document.removeEventListener('visibilitychange', sync)
        cycle.kill()
      }
    }, container)
    return () => media.revert()
  }, [notifications])

  return (
    <div className="notification-system" ref={root}>
      {notifications.map((notification) => (
        <div key={notification.id} className={`phone-notification ${notification.position}`} data-notification={notification.id}
          style={{ aspectRatio: `${notification.width} / ${notification.height}` }}>
          <div className="notification-skeleton" aria-hidden="true">
            <span className="notification-skeleton-icon" />
            <span className="notification-skeleton-lines"><i /><i /><i /></span>
          </div>
          <img className="notification-artwork" src={notification.image} alt={notification.description} width={notification.width} height={notification.height} />
        </div>
      ))}
    </div>
  )
}
