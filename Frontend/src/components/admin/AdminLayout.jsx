import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Banknote,
  BarChart3,
  ClipboardList,
  History,
  LayoutDashboard,
  PackageSearch,
  ShieldCheck,
  Store,
  Tags,
  Ticket,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { SessionLoading } from '../auth/SessionLoading.jsx'
import { IdentityBlock, RoleDenied, RoleShell } from '../layout/RoleShell.jsx'
import { BandChip } from '../layout/WorkspaceHeader.jsx'
import { Badge } from '../ui/Badge.jsx'
import { layout } from '../../design/context.js'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/sellers', label: 'Sellers', icon: Store, end: false },
  { to: '/admin/categories', label: 'Categories', icon: Tags, end: false },
  { to: '/admin/products', label: 'Product moderation', icon: PackageSearch, end: false },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket, end: false },
  { to: '/admin/disputes', label: 'Disputes', icon: ClipboardList, end: false },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, end: false },
  { to: '/admin/settlements', label: 'Settlements', icon: Banknote, end: false },
  { to: '/admin/audit-logs', label: 'Audit log', icon: History, end: false },
]

export default function AdminLayout() {
  const { user, authReady, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!authReady) {
    return <SessionLoading label="Loading the admin dashboard…" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'admin') {
    return (
      <RoleDenied
        icon={ShieldCheck}
        title="Platform admin"
        actions={
          <button onClick={() => navigate('/')} className={layout.outlineButton}>
            Back to storefront
          </button>
        }
      >
        Your account is a <span className="font-semibold text-slate-900 capitalize">{user.role}</span>
        . Only platform admins can access the admin dashboard.
      </RoleDenied>
    )
  }

  return (
    <RoleShell
      role="admin"
      icon={ShieldCheck}
      navLabel="Admin sections"
      navItems={NAV_ITEMS}
      identity={
        <IdentityBlock
          icon={ShieldCheck}
          name={user.name}
          badge={
            <Badge variant="neutral" className="mt-1 px-1.5 py-0 text-[10px]">
              Platform admin
            </Badge>
          }
        />
      }
      workspace="Admin console"
      title={user.name}
      hint="Platform-wide control and moderation"
      chips={<BandChip icon={ShieldCheck}>Full access</BandChip>}
      onSignOut={() => {
        logout()
        navigate('/')
      }}
    >
      <Outlet context={{ user }} />
    </RoleShell>
  )
}
