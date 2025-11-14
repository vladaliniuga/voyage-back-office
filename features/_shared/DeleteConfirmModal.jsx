import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function DeleteConfirmModal({
  open,
  title = 'Delete?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
  confirming = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={confirming}>
            {cancelLabel}
          </Button>
          <Button color="danger" onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Deleting…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm">{message}</p>
    </Modal>
  );
}
