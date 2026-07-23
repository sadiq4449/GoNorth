/** Vehicle categories — mirrors backend/app/services/vehicle_categories.py */

export const VEHICLE_CATEGORIES = [
  { id: 'all', label: 'All vehicles', description: 'Browse the full fleet' },
  { id: 'suv_4x4', label: '4x4 SUV', description: 'Prado, Land Cruiser, Surf' },
  { id: 'pickup', label: 'Pickup', description: 'Hilux & double-cab' },
  { id: 'suv', label: 'SUV', description: 'TZ, 5-Door & crossovers' },
  { id: 'van', label: 'Van / Hiace', description: 'Families & small groups' },
  { id: 'coaster', label: 'Coaster / Bus', description: 'Large groups & tours' },
  { id: 'sedan', label: 'Sedan', description: 'City & paved routes' },
]

export function categoryLabel(id) {
  return VEHICLE_CATEGORIES.find((c) => c.id === id)?.label || id
}

export function categoryMeta(id) {
  return VEHICLE_CATEGORIES.find((c) => c.id === id)
}
