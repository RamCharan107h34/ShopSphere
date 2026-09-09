import { Badge } from '../ui/Badge.jsx'
import { statusMetaOf } from '../../lib/status.js'

// Renders the right label + color for a status using the shared metadata maps:
//   <StatusBadge meta={SUBORDER_META} status={subOrder.status} />
export function StatusBadge({ status, meta, className }) {
  const info = statusMetaOf(status, meta)
  return (
    <Badge variant={info.variant} className={className}>
      {info.label}
    </Badge>
  )
}
