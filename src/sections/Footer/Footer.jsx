import { useEffect, useRef } from 'react'
import token from '../../../videos/footer_tokens_new.mp4'
import artwork from '../../../reference_images/footer_icone_images.png'
import footerReference from '../../../reference_images/footer_correct_refrence.png'
import { FOOTER_LINKS } from './footerAssets.js'
import './Footer.css'

function Destination({ item, children, className }) {
  return item.href
    ? <a className={className} href={item.href}>{children}</a>
    : <span className={className} aria-disabled="true" title={`${item.label}: link coming soon`}>{children}</span>
}
function DownloadBadges() {
  return <div className="footer-badges">{FOOTER_LINKS.stores.map(item => <Destination key={item.label} item={item}>
    <img src={item.image} alt={item.label} width="200" height="66" />
  </Destination>)}</div>
}

export default function Footer() {
  const video = useRef(null)
  useEffect(() => {
    const element = video.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false, alive = true
    const sync = () => {
      if (visible && !document.hidden && !reduced.matches) {
        element.play().then(() => {
          if (!alive || !visible || document.hidden || reduced.matches) element.pause()
        }).catch(() => {})
      } else element.pause()
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync() })
    observer.observe(element)
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    return () => {
      alive = false
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
      element.pause()
    }
  }, [])
  return <div className="site-closing">
    <section className="download-cta" id="download-spenda" aria-labelledby="download-heading">
      <video className="footer-token" ref={video} src={token} muted playsInline loop preload="auto" aria-hidden="true" />
      <h2 id="download-heading">Ready to make your money move?</h2>
      <p>Deposit crypto, convert to Naira, transfer and pay for everyday essentials with Spenda.</p>
      <DownloadBadges />
      <p className="footer-pending">App download links coming soon.</p>
    </section>
    <footer className="site-footer">
      <div className="footer-columns">
        <div className="footer-download footer-brand">
          <svg className="footer-spenda-logo" viewBox="20 48 135 40" role="img" aria-label="Spenda">
            <image href={footerReference} width="592" height="296" />
          </svg>
          <svg className="footer-ndpc-logo" viewBox="22 110 48 19" role="img" aria-label="Nigeria Data Protection Commission">
            <image href={footerReference} width="592" height="296" />
          </svg>
        </div>
        <nav aria-label="Footer products"><h3>Product</h3><ul>
          {['Crypto deposit', 'Naira deposit', 'Stablecoin transfer'].map(label => <li key={label}><span aria-disabled="true" title="Link coming soon">{label}</span></li>)}
          <li><a href="#bank-heading">Instant bank transfers</a></li>
          <li><span aria-disabled="true" title="Link coming soon">Virtual cards</span></li>
        </ul></nav>
        <nav aria-label="Footer company"><h3>Company</h3><ul>{FOOTER_LINKS.company.map(item => <li key={item.label}><Destination item={item}>{item.label}</Destination></li>)}</ul></nav>
        <div className="footer-contact"><h3>Contact Us</h3><a href="mailto:support@spenda.africa">support@spenda.africa</a>
          <div className="footer-social">{FOOTER_LINKS.social.map(item => <Destination item={item} key={item.label}><img src={item.image} alt={item.label} width="44" height="44" /></Destination>)}</div>
        </div>
      </div>
      <address>22 Glover Road, Ikoyi, Lagos, Nigeria</address>
      <div className="footer-artwork" style={{ backgroundImage: `url("${artwork}")` }}>
        <small>All rights reserved. 2026, Spenda</small>
      </div>
    </footer>
  </div>
}

