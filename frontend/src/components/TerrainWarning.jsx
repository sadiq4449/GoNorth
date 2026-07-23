import AppIcon from './AppIcon'

export default function TerrainWarning({ show }) {
  if (!show) return null
  return (
    <div className="terrain-warning">
      <AppIcon name="alert" size={18} />
      <div>
        <strong>4x4 recommended for this route</strong>
        <p>Deosai, Basho, and high passes need high-clearance vehicles. Sedans and vans are hidden for this leg — choose a 4x4 SUV or pickup instead.</p>
      </div>
    </div>
  )
}
