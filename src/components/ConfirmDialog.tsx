import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[2px]">
      <button type="button" aria-label="关闭确认对话框" className="absolute inset-0 cursor-default" onClick={onCancel} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          <div className={`mt-0.5 rounded-xl p-2 ${danger ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"}`}>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-slate-900">{title}</h3>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{message}</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 bg-slate-50 px-5 py-4">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-50">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-extrabold text-white shadow-xs ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
