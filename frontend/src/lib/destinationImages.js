/**
 * Destination cover images — maps destination ids to files in /public/assets.
 */
export const DESTINATION_IMAGE_ASSETS = {
  skardu: '/assets/skardu.jfif',
  hunza: '/assets/huza.jfif',
  gilgit: '/assets/mountains_hero_banner.png',
  deosai: '/assets/desai.jfif',
  khaplu: '/assets/khapulu.jfif',
  shigar: '/assets/shigargb.jpg',
  astore: '/assets/shigar12.jfif',
  'fairy-meadows': '/assets/basho.jfif',
  nagar: '/assets/huza.jfif',
  ghizer: '/assets/mountains_hero_banner.png',
  basho: '/assets/basho.jfif',
}

export function resolveDestinationImageUrl(destination) {
  if (destination?.imageUrl) return destination.imageUrl
  if (destination?.id && DESTINATION_IMAGE_ASSETS[destination.id]) {
    return DESTINATION_IMAGE_ASSETS[destination.id]
  }
  return null
}
