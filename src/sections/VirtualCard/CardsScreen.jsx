import SpendaCard from './SpendaCard.jsx'

export default function CardsScreen() {
  return (
    <div className="cards-app-screen" aria-hidden="true">
      <div className="cards-app-header">Cards</div>
      <SpendaCard className="cards-screen-card" decorative appearance="black" />
    </div>
  )
}
