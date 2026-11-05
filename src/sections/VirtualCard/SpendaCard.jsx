import artwork from '../../../other_images/Visa_white_Card.png'
import platinum from '../../../other_images/Visa_Platinum_Card.jpeg'

// The supplied PNG is portrait, with transparent margins. Present its actual
// card face in landscape, without altering or regenerating the original asset.
export default function SpendaCard({ className = '', decorative = false, appearance = 'white' }) {
  return <div className={`spenda-card-face ${className}`} role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : 'Spenda Visa Platinum virtual card'}>
    {appearance !== 'white' && <img className="card-art-black" src={platinum} alt="" width="365" height="231" />}
    {appearance !== 'black' && <img className="card-art-white" src={artwork} alt="" width="1086" height="1448" />}
  </div>
}
