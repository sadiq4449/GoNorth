import {
  Sparkles,
  Map,
  Car,
  Ticket,
  MessageCircle,
  Shield,
  WifiOff,
  Star,
  Clock,
  Users,
  Mountain,
  Wifi,
  ShowerHead,
  Coffee,
  Eye,
  UtensilsCrossed,
  Landmark,
  Trees,
  Ship,
  Check,
  AlertTriangle,
  ImageOff,
} from 'lucide-react'

const ICONS = {
  sparkles: Sparkles,
  map: Map,
  car: Car,
  ticket: Ticket,
  message: MessageCircle,
  shield: Shield,
  wifiOff: WifiOff,
  star: Star,
  clock: Clock,
  users: Users,
  mountain: Mountain,
  wifi: Wifi,
  shower: ShowerHead,
  coffee: Coffee,
  eye: Eye,
  utensils: UtensilsCrossed,
  landmark: Landmark,
  trees: Trees,
  ship: Ship,
  check: Check,
  alert: AlertTriangle,
  image: ImageOff,
}

/** Consistent stroke icons for GoNorth UI */
export default function AppIcon({ name, size = 20, className = '', strokeWidth = 2 }) {
  const Icon = ICONS[name]
  if (!Icon) return null
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={`app-icon ${className}`.trim()}
      aria-hidden
    />
  )
}

export { ICONS }
