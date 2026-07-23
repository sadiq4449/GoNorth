/**
 * Tour package cover images — maps package slugs to files in /public/assets.
 * Set value to null when no asset exists (UI shows an explicit missing state).
 */
export const PACKAGE_IMAGE_ASSETS = {
  'skardu-valley-explorer': '/assets/skardu.jfif',
  'hunza-cherry-blossom': '/assets/huza.jfif',
  'deosai-plateau-adventure': '/assets/desai.jfif',
  'khaplu-heritage-trail': '/assets/khapulu.jfif',
  'shigar-fort-retreat': '/assets/shigargb.jpg',
  'basho-meadows-trek': '/assets/basho.jfif',
}

/** Slugs that need a destination photo added to public/assets. */
export const PACKAGES_MISSING_IMAGES = Object.entries(PACKAGE_IMAGE_ASSETS)
  .filter(([, url]) => !url)
  .map(([slug]) => slug)

export function resolvePackageImageUrl(pkg) {
  if (pkg?.image_url) return pkg.image_url
  if (pkg?.slug && PACKAGE_IMAGE_ASSETS[pkg.slug]) {
    return PACKAGE_IMAGE_ASSETS[pkg.slug]
  }
  return null
}

export function packageImageStatus(pkg) {
  const url = resolvePackageImageUrl(pkg)
  if (url) return { url, missing: false }
  return {
    url: null,
    missing: true,
    label: pkg?.destination || pkg?.title || 'Package',
    slug: pkg?.slug,
  }
}
