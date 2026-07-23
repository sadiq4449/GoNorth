import { Link } from 'react-router-dom'

export default function PageHeader({ title, lead, backTo = '/', backLabel = 'Home' }) {
  return (
    <header className="page-header">
      <Link to={backTo} className="back-link">← {backLabel}</Link>
      <h1>{title}</h1>
      {lead && <p className="plan-lead">{lead}</p>}
    </header>
  )
}
