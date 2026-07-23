import { Link } from 'react-router-dom'
import AppIcon from './AppIcon'

const QUICK_ACTIONS = [
  {
    icon: 'map',
    title: 'Build Your Perfect Trip',
    desc: 'Choose your stay, driver, and guide — watch the price update as you go.',
    to: '/plan',
    cta: 'Start planning',
  },
  {
    icon: 'car',
    title: 'Share a Ride',
    desc: 'Split transport costs with other travelers heading the same way.',
    to: '/pools',
    cta: 'Browse ride pools',
  },
  {
    icon: 'ticket',
    title: 'Your Trip Pass',
    desc: 'QR voucher, driver contact, and day-by-day itinerary — works offline.',
    to: '/trip',
    cta: 'Open my trip',
  },
  {
    icon: 'message',
    title: 'Traveler Forum',
    desc: 'Ask locals, find trekking partners, and get honest route advice.',
    to: '/forum',
    cta: 'Join the conversation',
  },
]

const BENEFITS = [
  {
    icon: 'sparkles',
    title: 'Smart trip matching',
    desc: 'Tell us your budget and style — get a complete Gilgit-Baltistan itinerary in one go.',
  },
  {
    icon: 'car',
    title: 'Every vehicle you need',
    desc: 'Prado, Land Cruiser, Hilux, Hiace, Coaster, or sedan — matched to your group and terrain.',
  },
  {
    icon: 'shield',
    title: 'Built for mountain roads',
    desc: 'SOS alerts, live road advisories, and automatic 4x4 matching for Deosai and high passes.',
  },
  {
    icon: 'wifiOff',
    title: 'Works when signal doesn’t',
    desc: 'Save your trip pass before you leave town — access it with no data in the valleys.',
  },
  {
    icon: 'star',
    title: 'BaltiPoints rewards',
    desc: 'Earn on every booking. Redeem up to 20% on your next adventure.',
  },
  {
    icon: 'users',
    title: 'Travel your way',
    desc: 'Filter for solo-safe stays and women-friendly drivers — travel with confidence.',
  },
]

const STEPS = [
  { num: '1', title: 'Choose your valleys', desc: 'Skardu, Hunza, Gilgit, Deosai, Khaplu, Astore — link multiple stops on one route.' },
  { num: '2', title: 'Pick your team', desc: 'Select a stay, vehicle, and optional guide. Your total updates instantly.' },
  { num: '3', title: 'Book with confidence', desc: 'Pay via JazzCash, EasyPaisa, or card. Your trip pass arrives immediately.' },
]

export default function FeaturesSection() {
  return (
    <>
      <section className="container home-features" id="features">
        <div className="home-features-header">
          <h2>One platform for all of Gilgit-Baltistan</h2>
          <p>Plan, book, and travel across the region — from your first search to the last mountain pass.</p>
        </div>
        <div className="home-benefits-grid">
          {BENEFITS.map((b) => (
            <div key={b.title} className="home-benefit-card">
              <AppIcon name={b.icon} size={22} className="home-benefit-icon" />
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container home-how">
        <h2>Three steps to the Karakoram</h2>
        <div className="home-steps-grid">
          {STEPS.map((s) => (
            <div key={s.num} className="home-step-card">
              <span className="home-step-num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
        <Link to="/plan" className="btn-secondary-link home-how-cta">Start Your Adventure →</Link>
      </section>

      <section className="container home-features home-explore">
        <h2>Discover Hidden Gems</h2>
        <div className="home-feature-grid">
          {QUICK_ACTIONS.map((f) => (
            <Link key={f.to} to={f.to} className="home-feature-card">
              <AppIcon name={f.icon} size={22} className="home-feature-icon" />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="home-feature-cta">{f.cta} →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
