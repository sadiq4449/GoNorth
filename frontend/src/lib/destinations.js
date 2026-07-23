export const DESTINATIONS = [
  {
    id: 'skardu',
    name: 'Skardu',
    tagline: 'Gateway to K2, lakes, and Deosai',
    description: 'The main hub for Gilgit-Baltistan tourism — bazaars, Kachura lakes, and access to high-altitude adventures.',
    highlights: ['Kachura Lakes', 'Shangrila', 'Deosai access', 'Skardu Bazaar'],
    colors: ['#1e4976', '#3d8fd1'],
    bestSeason: 'Apr – Oct',
    terrain: 'Highway + 4x4 for Deosai',
  },
  {
    id: 'hunza',
    name: 'Hunza',
    tagline: 'Cherry blossoms, forts, and Passu cones',
    description: 'Pakistan\'s most iconic valley — Baltit Fort, Eagle\'s Nest, Attabad Lake, and the Karakoram Highway.',
    highlights: ['Baltit Fort', 'Passu cones', 'Attabad Lake', 'Eagle\'s Nest'],
    colors: ['#0d5c4a', '#3cb89a'],
    bestSeason: 'Mar – May, Sep – Oct',
    terrain: 'Karakoram Highway',
  },
  {
    id: 'deosai',
    name: 'Deosai',
    tagline: 'Roof of the world — wildflowers & bears',
    description: 'Second-highest plateau on Earth. Seasonal 4x4 access only; camping and wildlife photography.',
    highlights: ['Sheosar Lake', 'Brown bears', 'Wildflowers', 'Stargazing'],
    colors: ['#4a3728', '#c4a035'],
    bestSeason: 'Jul – Sep',
    terrain: '4x4 required',
  },
  {
    id: 'khaplu',
    name: 'Khaplu',
    tagline: 'Heritage, palace, and Ghanche valley',
    description: 'Cultural heart of Baltistan with Khaplu Palace, Chaqchan Mosque, and Mashabrum views.',
    highlights: ['Khaplu Palace', 'Heritage walks', 'Ghanche valley', 'Apricot orchards'],
    colors: ['#5c3d2e', '#d4a574'],
    bestSeason: 'May – Oct',
    terrain: 'Highway from Skardu',
  },
  {
    id: 'shigar',
    name: 'Shigar',
    tagline: 'Fort, orchards, and quiet valleys',
    description: 'Restored Shigar Fort and peaceful valley walks — perfect add-on from Skardu.',
    highlights: ['Shigar Fort', 'Apricot orchards', 'Heritage guest houses'],
    colors: ['#7c4a2d', '#c9956c'],
    bestSeason: 'Apr – Oct',
    terrain: 'Short drive from Skardu',
  },
  {
    id: 'basho',
    name: 'Basho',
    tagline: 'Meadows trek with K2 panoramas',
    description: 'Pine forests, wildflower meadows, and dramatic mountain views — a trekker\'s favorite near Skardu.',
    highlights: ['Basho Meadows', 'Trekking', 'K2 range views'],
    colors: ['#2d5016', '#a4c639'],
    bestSeason: 'Jun – Sep',
    terrain: '4x4 + trekking',
  },
]

export const MARKETPLACE_SERVICES = [
  { id: 'packages', label: 'Tour Packages', desc: 'Curated & operator packages', to: '/packages', icon: 'ticket' },
  { id: 'custom', label: 'Custom Trip', desc: 'Build your own itinerary', to: '/plan', icon: 'sparkles' },
  { id: 'stays', label: 'Stays', desc: 'Hotels & hostels', to: '/explore?tab=stays', icon: 'map' },
  { id: 'transport', label: 'Transport', desc: '4x4, vans & sedans', to: '/explore?tab=transport', icon: 'car' },
  { id: 'guides', label: 'Guides', desc: 'Local experts', to: '/explore?tab=guides', icon: 'users' },
  { id: 'destinations', label: 'Destinations', desc: 'Explore valleys', to: '/destinations', icon: 'mountain' },
]

export const FAQ_ITEMS = [
  {
    q: 'How is GoNorth different from a travel agency?',
    a: 'GoNorth is a marketplace — hotels, drivers, and guides list their own services. You can book curated packages instantly or build a fully custom trip with live pricing, escrow protection, and verified vendors.',
  },
  {
    q: 'Can I customize a tour package?',
    a: 'Yes. Every package can be booked as-is or used as a starting point. Use Custom Trip Builder to swap stays, vehicles, guides, and add stops across Gilgit-Baltistan.',
  },
  {
    q: 'How do payments and vendor payouts work?',
    a: 'You pay securely at checkout. Funds are held in escrow until your trip is completed and verified — protecting both travelers and local businesses.',
  },
  {
    q: 'Do I need a 4x4 for Deosai or Basho?',
    a: 'Yes. Deosai and Basho require 4x4 vehicles during the open season. Our trip builder automatically flags terrain requirements and filters compatible transport.',
  },
  {
    q: 'Can vendors list their own packages?',
    a: 'Hotels, tour operators, transport companies, and guides can register, complete verification (KYC), and manage listings through the Vendor Portal.',
  },
  {
    q: 'What if I need help planning?',
    a: 'Send an inquiry on any package page, use the traveler forum, or contact support. For urgent safety issues, use the SOS button in the header.',
  },
]
