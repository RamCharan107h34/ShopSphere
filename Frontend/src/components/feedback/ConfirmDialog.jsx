import { AlertTriangle } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'

// Confirmation dialog built on the shared Modal. Red styling communicates
// a destructive action by default.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  busy = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {destructive && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="size-5 text-red-600" />
          </span>
        )}
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </Modal>
  )
}
