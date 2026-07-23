import AppIcon from './AppIcon'

export default function TerrainWarning({ show }) {
  if (!show) return null
  return (
    <div className="terrain-warning">
      <AppIcon name="alert" size={18} />
      <div>
        <strong>Off-road route — 4x4 or pickup recommended</strong>
        <p>Deosai and Basho require high-clearance vehicles. Sedans, vans, and coasters are hidden for this leg; choose a 4x4 SUV or pickup instead.</p>
      </div>
    </div>
  )
}
