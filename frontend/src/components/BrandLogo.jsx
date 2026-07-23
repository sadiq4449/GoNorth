import { BRAND_LOGO_ALT, BRAND_LOGO_URL } from '../lib/brand'

export default function BrandLogo({ className = 'brand-logo', alt = BRAND_LOGO_ALT }) {
  return (
    <img
      src={BRAND_LOGO_URL}
      alt={alt}
      className={className}
      decoding="async"
      fetchPriority="high"
    />
  )
}
