import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bike, ClipboardList, LayoutDashboard, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { SessionLoading } from '../auth/SessionLoading.jsx'
import { IdentityBlock, RoleDenied, RoleShell } from '../layout/RoleShell.jsx'
import { BandChip } from '../layout/WorkspaceHeader.jsx'
import { Badge } from '../ui/Badge.jsx'
import { layout } from '../../design/context.js'

const NAV_ITEMS = [
  { to: '/delivery', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/delivery/deliveries', label: 'My deliveries', icon: ClipboardList, end: false },
  { to: '/delivery/profile', label: 'Profile', icon: UserRound, end: false },
]

export default function DeliveryLayout() {
  const { user, authReady, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!authReady) {
    return <SessionLoading label="Loading your delivery dashboard…" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'delivery') {
    return (
      <RoleDenied
        icon={Bike}
        title="Delivery dashboard"
        actions={
          <button onClick={() => navigate('/')} className={layout.outlineButton}>
            Back to storefront
          </button>
        }
      >
        Your account is a <span className="font-semibold text-slate-900 capitalize">{user.role}</span>
        . Only delivery partners can access this dashboard.
      </RoleDenied>
    )
  }

  return (
    <RoleShell
      role="delivery"
      icon={Bike}
      navLabel="Delivery sections"
      navItems={NAV_ITEMS}
      identity={
        <IdentityBlock
          icon={Bike}
          name={user.name}
          badge={
            <Badge variant="success" className="mt-1 px-1.5 py-0 text-[10px]">
              Delivery partner
            </Badge>
          }
        />
      }
      workspace="Delivery run"
      title={user.name}
      hint="Pick up from sellers, deliver to customers"
      chips={<BandChip icon={Bike}>On the road</BandChip>}
      onSignOut={() => {
        logout()
        navigate('/')
      }}
    >
      <Outlet />
    </RoleShell>
  )
}
