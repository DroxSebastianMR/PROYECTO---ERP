interface SaleProcessingOverlayProps {
  isOpen: boolean;
}

export const SaleProcessingOverlay = ({ isOpen }: SaleProcessingOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/25 backdrop-blur-[1px]">
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-6 py-5 shadow-2xl">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        <div><p className="font-semibold text-slate-900">Confirmando venta</p><p className="text-xs text-slate-500">Guardando y descontando existencias…</p></div>
      </div>
    </div>
  );
};
