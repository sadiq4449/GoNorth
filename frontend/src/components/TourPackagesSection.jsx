import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchFeaturedPackages } from '../api/client'
import TourPackageCard from './TourPackageCard'
import { PACKAGES_MISSING_IMAGES } from '../lib/packageImages'

export default function TourPackagesSection() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedPackages()
      .then(setPackages)
      .catch(() => setPackages([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="tour-packages-section container" aria-label="Tour packages">
        <header className="tour-packages-header">
          <h2>Curated Journeys Across Gilgit-Baltistan</h2>
          <p>Hand-picked routes from Hunza to Deosai — priced live, ready to book.</p>
        </header>
        <div className="tour-packages-grid tour-packages-grid--loading">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="tour-package-card tour-package-card--skeleton" aria-hidden />
          ))}
        </div>
      </section>
    )
  }

  if (!packages.length) return null

  return (
    <section className="tour-packages-section container" aria-label="Tour packages">
      <header className="tour-packages-header">
        <div>
          <h2>Curated Journeys Across Gilgit-Baltistan</h2>
          <p>Hand-picked routes from Hunza to Deosai — priced live, ready to book.</p>
        </div>
        <Link to="/packages" className="btn-secondary-link">See all packages →</Link>
      </header>
      <div className="tour-packages-grid">
        {packages.map((pkg, index) => (
          <TourPackageCard key={pkg.id} pkg={pkg} imagePriority={index < 2} />
        ))}
      </div>
      {PACKAGES_MISSING_IMAGES.length > 0 && (
        <p className="tour-packages-asset-note meta">
          Missing destination photos: {PACKAGES_MISSING_IMAGES.join(', ')} — add matching files to <code>public/assets/</code>.
        </p>
      )}
    </section>
  )
}
