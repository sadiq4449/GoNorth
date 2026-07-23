import { useState } from 'react'
import { FAQ_ITEMS } from '../lib/destinations'

export default function FaqSection() {
  const [open, setOpen] = useState(0)

  return (
    <section className="faq-section container" aria-label="Frequently asked questions">
      <header className="faq-header">
        <span className="section-eyebrow">Support</span>
        <h2>Frequently asked questions</h2>
        <p>Everything you need to know about booking Gilgit-Baltistan through GoNorth.</p>
      </header>
      <div className="faq-list">
        {FAQ_ITEMS.map((item, i) => (
          <article key={item.q} className={`faq-item ${open === i ? 'open' : ''}`}>
            <button type="button" className="faq-question" onClick={() => setOpen(open === i ? -1 : i)}>
              {item.q}
              <span className="faq-toggle">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <p className="faq-answer">{item.a}</p>}
          </article>
        ))}
      </div>
    </section>
  )
}
