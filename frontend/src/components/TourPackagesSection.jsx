import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchFeaturedPackages } from '../api/client'
import TourPackageCard from './TourPackageCard'

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
          <h2>Explore Our Gilgit-Baltistan Tour Packages</h2>
          <p>Discover amazing destinations</p>
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
          <h2>Explore Our Gilgit-Baltistan Tour Packages</h2>
          <p>Discover amazing destinations</p>
        </div>
        <Link to="/packages" className="btn-secondary-link">View all packages →</Link>
      </header>
      <div className="tour-packages-grid">
        {packages.map((pkg) => (
          <TourPackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>
    </section>
  )
}
