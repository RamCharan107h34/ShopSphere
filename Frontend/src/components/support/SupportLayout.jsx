import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Banknote, ClipboardList, Headset, Inbox, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { SessionLoading } from '../auth/SessionLoading.jsx'
import { IdentityBlock, RoleDenied, RoleShell } from '../layout/RoleShell.jsx'
import { BandChip } from '../layout/WorkspaceHeader.jsx'
import { Badge } from '../ui/Badge.jsx'
import { layout } from '../../design/context.js'

const NAV_ITEMS = [
  { to: '/support', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/support/tickets', label: 'Tickets', icon: Inbox, end: false },
  { to: '/support/disputes', label: 'Disputes', icon: ClipboardList, end: false },
  { to: '/support/refunds', label: 'Refund requests', icon: Banknote, end: false },
]

export default function SupportLayout() {
  const { user, authReady, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!authReady) {
    return <SessionLoading label="Loading the support desk…" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'support') {
    return (
      <RoleDenied
        icon={Headset}
        title="Support desk"
        actions={
          <button onClick={() => navigate('/')} className={layout.outlineButton}>
            Back to storefront
          </button>
        }
      >
        Your account is a <span className="font-semibold text-slate-900 capitalize">{user.role}</span>
        . Only support agents and admins can access the support desk.
      </RoleDenied>
    )
  }

  return (
    <RoleShell
      role="support"
      icon={Headset}
      navLabel="Support sections"
      navItems={NAV_ITEMS}
      identity={
        <IdentityBlock
          icon={Headset}
          name={user.name}
          badge={
            <Badge variant="default" className="mt-1 px-1.5 py-0 text-[10px]">
              Support agent
            </Badge>
          }
        />
      }
      workspace="Support desk"
      title={user.name}
      hint="Tickets, disputes and refund requests in one place"
      chips={<BandChip icon={Headset}>On duty</BandChip>}
      onSignOut={() => {
        logout()
        navigate('/')
      }}
    >
      <Outlet />
    </RoleShell>
  )
}
