import { useMemo, useState } from 'react'
import { Ban, CircleCheck, Search, Trash2, Users } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchUsers, updateUser, deleteUser } from '../../services/admin.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { cn } from '../../lib/utils.js'

const ROLE_META = {
  customer: { label: 'Customer', variant: 'neutral' },
  seller: { label: 'Seller', variant: 'default' },
  admin: { label: 'Admin', variant: 'warning' },
  support: { label: 'Support', variant: 'secondary' },
  delivery: { label: 'Delivery', variant: 'secondary' },
}

export default function AdminUsers() {
  const { toast } = useToast()
  const { data: users, loading, refetch } = useFetch(fetchUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (users || []).filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false
      if (!query) return true
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
      )
    })
  }, [users, search, roleFilter])

  const toggleActive = async (user) => {
    setBusyId(user._id)
    try {
      await updateUser(user._id, { isActive: !user.isActive })
      toast({
        title: user.isActive ? 'User suspended' : 'User activated',
        description: `${user.name} is now ${user.isActive ? 'suspended' : 'active'}.`,
        variant: user.isActive ? 'error' : 'success',
      })
      refetch()
    } catch (error) {
      toast({ title: 'Could not update user', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteUser(deleteTarget._id)
      toast({ title: 'User deleted', description: `${deleteTarget.name} was removed.`, variant: 'success' })
      setDeleteTarget(null)
      refetch()
    } catch (error) {
      toast({ title: 'Could not delete user', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageIntro title="User management" subtitle={`${users?.length ?? 0} registered users across all roles.`} />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone…" className="pl-9" />
        </div>
        <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="w-40">
          <option value="">All roles</option>
          {Object.entries(ROLE_META).map(([role, meta]) => (
            <option key={role} value={role}>{meta.label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      ) : filtered.length ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Phone</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Joined</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((user) => {
                const role = ROLE_META[user.role] || { label: user.role, variant: 'neutral' }
                return (
                  <tr key={user._id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-3"><Badge variant={role.variant}>{role.label}</Badge></td>
                    <td className="hidden px-5 py-3 text-slate-500 md:table-cell">{user.phone || '—'}</td>
                    <td className="hidden px-5 py-3 text-slate-500 lg:table-cell">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', user.isActive ? 'text-emerald-600' : 'text-red-600')}>
                        <span className={cn('size-2 rounded-full', user.isActive ? 'bg-emerald-500' : 'bg-red-500')} />
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          loading={busyId === user._id}
                          disabled={user.role === 'admin'}
                          onClick={() => toggleActive(user)}
                          title={user.role === 'admin' ? "Can't suspend another admin" : undefined}
                        >
                          {user.isActive ? <><Ban /> Suspend</> : <><CircleCheck /> Activate</>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-red-600"
                          disabled={user.role === 'admin' || user._id === JSON.parse(localStorage.getItem('shopsphere_user') || '{}')._id}
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Users className="size-6" /></span>
          <h2 className="text-base font-semibold">No users match</h2>
          <p className="max-w-sm text-sm text-slate-500">Try a different search term or role filter.</p>
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete user?"
        description={`${deleteTarget?.name} (${deleteTarget?.email}) will be permanently removed. Their orders and history remain in the database.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}><Trash2 /> Delete</Button>
          </>
        }
      />
    </div>
  )
}