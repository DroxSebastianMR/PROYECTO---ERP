import type { PaymentMethod } from "@/features/dashboard/types/dashboard.types";
type PaymentMethodsProps = { methods: PaymentMethod[] };
export const PaymentMethods = ({ methods }: PaymentMethodsProps) => {
  const gradient = methods.reduce((value, method, index) => {
    const from = methods.slice(0, index).reduce((sum, current) => sum + current.percentage, 0);
    return `${value}${method.color} ${from}% ${from + method.percentage}%${index === methods.length - 1 ? "" : ", "}`;
  }, "conic-gradient(");
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_10px_24px_rgba(37,99,235,.035)]">
      <h2 className="text-lg font-semibold">Métodos de Pago</h2>
      <div
        className="mx-auto mt-7 grid h-44 w-44 place-items-center rounded-full"
        style={{ background: `${gradient})` }}
      >
        <div className="grid h-[126px] w-[126px] place-items-center rounded-full bg-white text-center">
          <div>
            <p className="text-xl">1.2k</p>
            <p className="text-[11px] text-slate-600">Txns</p>
          </div>
        </div>
      </div>
      <div className="mt-7 space-y-3">
        {methods.map((method) => (
          <div key={method.name} className="flex items-center text-sm">
            <i className="mr-3 h-3 w-3 rounded-full" style={{ backgroundColor: method.color }} />
            <span className="text-slate-700">{method.name}</span>
            <span className="ml-auto font-medium">{method.percentage}%</span>
          </div>
        ))}
      </div>
    </article>
  );
};
