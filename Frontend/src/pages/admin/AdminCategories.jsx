import { useState } from 'react'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchAllCategories, createCategory, updateCategory, deleteCategory } from '../../services/admin.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Thumb } from '../../components/seller/Thumb.jsx'

const EMPTY_FORM = { name: '', description: '', image: '', isActive: true }

export default function AdminCategories() {
  const { toast } = useToast()
  const { data: categories, loading, refetch } = useFetch(fetchAllCategories)
  const [editing, setEditing] = useState(null) // null = closed, 'new' = create, object = edit
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setError('')
    setEditing('new')
  }

  const openEdit = (category) => {
    setForm({ name: category.name, description: category.description || '', image: category.image || '', isActive: category.isActive })
    setError('')
    setEditing(category)
  }

  const save = async () => {
    if (!form.name.trim()) {
      setError('Category name is required')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        ...(form.image.trim() ? { image: form.image.trim() } : {}),
        isActive: form.isActive,
      }
      if (editing === 'new') {
        await createCategory(body)
        toast({ title: 'Category created', description: `${form.name} is now available to sellers.`, variant: 'success' })
      } else {
        await updateCategory(editing._id, body)
        toast({ title: 'Category updated', description: `${form.name} saved.`, variant: 'success' })
      }
      setEditing(null)
      refetch()
    } catch (error) {
      toast({ title: 'Could not save category', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteCategory(deleteTarget._id)
      toast({ title: 'Category deleted', description: `${deleteTarget.name} removed.`, variant: 'success' })
      setDeleteTarget(null)
      refetch()
    } catch (error) {
      toast({ title: 'Could not delete category', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageIntro
        title="Category management"
        subtitle={`${categories?.length ?? 0} categories power the storefront browsing experience.`}
        actions={<Button onClick={openCreate}><Plus /> New category</Button>}
      />

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      ) : categories?.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-200">
            {categories.map((category) => (
              <li key={category._id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                <Thumb src={category.image} alt={category.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{category.name}</p>
                    {!category.isActive && <Badge variant="neutral">Hidden</Badge>}
                    {category.parentCategory && <Badge variant="secondary">Sub: {category.parentCategory.name}</Badge>}
                  </div>
                  <p className="truncate text-xs text-slate-500">/{category.slug}{category.description ? ` · ${category.description}` : ''}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => openEdit(category)}><Pencil /> Edit</Button>
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600" onClick={() => setDeleteTarget(category)} aria-label={`Delete ${category.name}`}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Tags className="size-6" /></span>
          <h2 className="text-base font-semibold">No categories yet</h2>
          <p className="max-w-sm text-sm text-slate-500">Create the first category so sellers can list products under it.</p>
          <Button className="mt-2" onClick={openCreate}><Plus /> New category</Button>
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New category' : `Edit "${editing?.name}"`}
        description="Categories appear in the storefront rail and product filters."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button loading={saving} onClick={save}>{editing === 'new' ? 'Create category' : 'Save changes'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name *</label>
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Electronics" aria-invalid={!!error} />
            {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
            <p className="mt-1 text-xs text-slate-500">Slug is generated automatically (e.g. "home-appliances").</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Description</label>
            <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Short blurb for the category page" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Image URL</label>
            <Input value={form.image} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} placeholder="https://…" />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="size-4 accent-primary"
            />
            Visible to customers
          </label>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete category?"
        description={`"${deleteTarget?.name}" will be removed. Products using it keep their data but lose their category link.`}
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