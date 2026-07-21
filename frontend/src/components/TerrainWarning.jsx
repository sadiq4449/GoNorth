export default function TerrainWarning({ show }) {
  if (!show) return null
  return (
    <div className="terrain-warning">
      <strong>4x4 required</strong> — Deosai and Basho need an all-terrain vehicle. Incompatible rides are disabled.
    </div>
  )
}
