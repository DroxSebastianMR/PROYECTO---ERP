import { Archive, Boxes, ChartNoAxesCombined, PackageCheck, Truck } from "lucide-react";

export const AuthHero = () => (
  <aside className="relative hidden overflow-hidden bg-[#edf4ff] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-[52px]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(214,231,255,.95),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(225,239,255,.9),transparent_45%)]" />
    <div className="relative flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/80 bg-white/60 text-blue-600 shadow-sm backdrop-blur">
        <Archive className="h-5 w-5" strokeWidth={2.4} />
      </div>
      <span className="text-[23px] font-bold tracking-[-0.055em] text-slate-900">DistriCorp</span>
    </div>

    <div className="relative mx-auto flex w-full max-w-[445px] items-center justify-center">
      <div className="relative aspect-[1.8] w-full rounded-[24px] border border-white/80 bg-white/40 p-6 shadow-[0_20px_38px_rgba(76,124,184,.15)] backdrop-blur-sm">
        <div className="absolute left-8 top-7 h-28 w-28 rounded-full border border-blue-200 bg-blue-100/70" />
        <div className="absolute left-[23%] top-[21%] h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_0_7px_rgba(59,130,246,.13)]" />
        <div className="absolute right-8 top-7 w-32 rounded-xl border border-blue-100 bg-white/70 p-3 shadow-sm">
          <div className="mb-3 h-2 w-16 rounded bg-blue-100" />
          <div className="flex h-12 items-end gap-1">
            <i className="h-5 flex-1 rounded-t bg-blue-200" />
            <i className="h-9 flex-1 rounded-t bg-blue-400" />
            <i className="h-7 flex-1 rounded-t bg-blue-300" />
            <i className="h-11 flex-1 rounded-t bg-blue-500" />
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 grid h-32 w-52 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-blue-100 bg-white/80 shadow-xl">
          <div className="grid grid-cols-3 gap-3 text-blue-500">
            <Boxes />
            <PackageCheck />
            <ChartNoAxesCombined />
            <PackageCheck />
            <Boxes />
            <ChartNoAxesCombined />
          </div>
        </div>
        <div className="absolute bottom-6 left-7 flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-white shadow-lg">
          <Truck className="h-6 w-6" />
          <span className="text-xs font-medium">En ruta</span>
        </div>
        <div className="absolute bottom-6 right-7 flex h-12 w-20 items-center justify-center rounded-lg border border-blue-100 bg-white/80 text-blue-500">
          <Truck className="h-7 w-7" />
        </div>
      </div>
    </div>

    <div className="relative max-w-[430px]">
      <h1 className="text-[32px] font-bold tracking-[-0.05em] text-slate-950">DistriCorp ERP</h1>
      <p className="mt-3 max-w-[430px] text-[17px] font-light leading-[1.55] text-slate-600">
        Gestiona tu empresa desde un solo lugar. Control de inventario, logística y ventas en tiempo
        real.
      </p>
    </div>
  </aside>
);
