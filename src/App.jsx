import Hero from './sections/Hero/Hero.jsx'
import PhoneDashboard from './sections/PhoneDashboard/PhoneDashboard.jsx'
import BankTransfer from './sections/BankTransfer/BankTransfer.jsx'
import Essentials from './sections/Essentials/Essentials.jsx'
import Experience from './sections/Experience/Experience.jsx'
import Testimonials from './sections/Testimonials/Testimonials.jsx'
import Footer from './sections/Footer/Footer.jsx'
import { useSectionRebound } from './useSectionRebound.js'

export default function App() {
  useSectionRebound()
  return <main id="main"><Hero /><PhoneDashboard /><div className="section-transition" data-transition="bank-transfer"><BankTransfer /></div><Essentials /><Experience /><div className="section-transition" data-transition="testimonials"><Testimonials /></div><Footer /></main>
}



