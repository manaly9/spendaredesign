import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './MobileNavigation.css'

export default function MobileNavigation({ onProduct, onDownload }) {
  const drawer = useRef(null)
  const trigger = useRef(null)
  const animation = useRef(null)
  const restore = useRef(null)
  const [open, setOpen] = useState(false)
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finish = (action) => {
    drawer.current.close()
    restore.current?.()
    restore.current = null
    setOpen(false)
    trigger.current?.focus({ preventScroll: true })
    action?.()
  }
  const close = (action, immediate = false) => {
    if (!drawer.current?.open) return
    animation.current?.cancel()
    if (immediate || reduced()) { finish(action); return }
    animation.current = drawer.current.animate([
      { transform: 'translateX(0)' }, { transform: 'translateX(100%)' },
    ], { duration: 380, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
    animation.current.onfinish = () => finish(action)
  }
  const show = () => {
    if (drawer.current.open) return
    animation.current?.cancel()
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    restore.current = () => { html.style.overflow = previous }
    drawer.current.showModal()
    setOpen(true)
    drawer.current.querySelector('button').focus()
    if (!reduced()) animation.current = drawer.current.animate([
      { transform: 'translateX(100%)' }, { transform: 'translateX(0)' },
    ], { duration: 400, easing: 'cubic-bezier(.22,1,.36,1)' })
  }
  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 701px)')
    const resize = () => {
      if (breakpoint.matches && drawer.current?.open) {
        animation.current?.cancel()
        drawer.current.close()
        restore.current?.()
        restore.current = null
        setOpen(false)
      }
    }
    breakpoint.addEventListener('change', resize)
    return () => {
      breakpoint.removeEventListener('change', resize)
      animation.current?.cancel()
      restore.current?.()
    }
  }, [])
  return <>
    <button className="mobile-menu-trigger" ref={trigger} aria-label="Open navigation menu" aria-controls="mobile-navigation" aria-expanded={open} onClick={show}>
      <span /><span /><span />
    </button>
    {createPortal(<dialog className="mobile-navigation" id="mobile-navigation" ref={drawer} aria-label="Mobile navigation"
      onCancel={event => { event.preventDefault(); close() }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
        if (event.key !== 'Tab') return
        const items = [...drawer.current.querySelectorAll('button, summary, a[href]')].filter(item => item.getClientRects().length && !item.disabled)
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }}>
      <button className="mobile-menu-close" aria-label="Close navigation menu" onClick={() => close()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg>
      </button>
      <nav aria-label="Mobile main navigation">
        <details className="mobile-products">
          <summary>Our Product</summary>
          <div>
            {['Everyday payments', 'Crypto deposits', 'Virtual USD card'].map((label, index) => <button key={label} onClick={() => close(() => onProduct(index))}>{label}</button>)}
          </div>
        </details>
        <span className="mobile-blog" role="link" aria-disabled="true" title="Blog link coming soon">Blog <small>Coming soon</small></span>
      </nav>
      <button className="mobile-download" onClick={() => close(onDownload)}>Download Now <span aria-hidden="true">&#8599;</span></button>
    </dialog>, document.body)}
  </>
}
