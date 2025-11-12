// src/components/Modal.tsx
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="card w-full max-w-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button className="btn-secondary" onClick={onClose}>
              Fechar
            </button>
          </div>
          <div className="max-h-[70vh] overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
