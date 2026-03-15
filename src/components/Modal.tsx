import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative glass-panel border border-zinc-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-xl font-bold font-['Rajdhani'] text-zinc-100 flex items-center gap-2">
            <i className="ph ph-gear-six text-orange-500"></i>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
