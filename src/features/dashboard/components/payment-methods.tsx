import type { PaymentMethod } from "@/features/dashboard/types/dashboard.types";
type PaymentMethodsProps = { methods: PaymentMethod[] };
export const PaymentMethods = ({ methods }: PaymentMethodsProps) => {
  const gradient = methods.reduce((value, method, index) => {
    const from = methods.slice(0, index).reduce((sum, current) => sum + current.percentage, 0);
    return `${value}${method.color} ${from}% ${from + method.percentage}%${index === methods.length - 1 ? "" : ", "}`;
  }, "conic-gradient(");
  return (
    <article className="h-full min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(37,99,235,.035)] sm:p-6">
      <h2 className="text-lg font-semibold">Métodos de Pago</h2>
      <div
        className="mx-auto mt-5 grid h-36 w-36 place-items-center rounded-full sm:mt-7 sm:h-44 sm:w-44"
        style={{ background: `${gradient})` }}
      >
        <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-white text-center sm:h-[126px] sm:w-[126px]">
          <div>
            <p className="text-xl">1.2k</p>
            <p className="text-[11px] text-slate-600">Txns</p>
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3 sm:mt-7">
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
