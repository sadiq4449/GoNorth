import { Link } from 'react-router-dom'
import AppIcon from './AppIcon'

const QUICK_ACTIONS = [
  {
    icon: 'map',
    title: 'Plan your trip',
    desc: 'Mix hostels, transport, and guides — see your total price instantly.',
    to: '/plan',
    cta: 'Open Trip Builder',
  },
  {
    icon: 'car',
    title: 'Ride pools',
    desc: 'Share a vehicle with other travelers and split the fare.',
    to: '/pools',
    cta: 'Browse pools',
  },
  {
    icon: 'ticket',
    title: 'My trip',
    desc: 'Your QR pass, driver contact, and day-by-day itinerary — even offline.',
    to: '/trip',
    cta: 'View my booking',
  },
  {
    icon: 'message',
    title: 'Traveler forum',
    desc: 'Ask locals, find trekking partners, and get route tips.',
    to: '/forum',
    cta: 'Join the forum',
  },
]

const BENEFITS = [
  {
    icon: 'sparkles',
    title: 'AI trip builder',
    desc: 'Enter your budget and vibe — get a full Gilgit-Baltistan package in one click.',
  },
  {
    icon: 'car',
    title: 'Full transport fleet',
    desc: 'Prado, Land Cruiser, Hilux, Hiace, Coaster, sedans, and more — pick what fits your group.',
  },
  {
    icon: 'shield',
    title: 'Built for the mountains',
    desc: 'SOS button, road alerts, and smart vehicle matching for Deosai and Basho routes.',
  },
  {
    icon: 'wifiOff',
    title: 'Works with weak signal',
    desc: 'Download your voucher before you leave Skardu — access it with no data.',
  },
  {
    icon: 'star',
    title: 'BaltiPoints rewards',
    desc: 'Earn points on every booking and redeem on your next adventure.',
  },
  {
    icon: 'users',
    title: 'Solo & women-friendly filters',
    desc: 'Find stays and drivers marked safe for solo travelers.',
  },
]

const STEPS = [
  { num: '1', title: 'Pick your route', desc: 'Skardu, Shigar, Khaplu, Deosai, Hunza — add multi-leg stops.' },
  { num: '2', title: 'Build your package', desc: 'Choose stay, transport type, and guides. Price updates as you tap.' },
  { num: '3', title: 'Book & go', desc: 'Pay with JazzCash, EasyPaisa, or card. Get your QR pass instantly.' },
]

export default function FeaturesSection() {
  return (
    <>
      <section className="container home-features" id="features">
        <div className="home-features-header">
          <h2>Everything you need for Gilgit-Baltistan</h2>
          <p>One place to plan, book, and travel — from your first search to your last mountain pass.</p>
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
        <h2>How it works</h2>
        <div className="home-steps-grid">
          {STEPS.map((s) => (
            <div key={s.num} className="home-step-card">
              <span className="home-step-num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
        <Link to="/plan" className="btn-secondary-link home-how-cta">Start planning →</Link>
      </section>

      <section className="container home-features home-explore">
        <h2>Explore GoNorth</h2>
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
