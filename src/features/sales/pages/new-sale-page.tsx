import { useNavigate } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { NewSaleForm } from "@/features/sales/components/new-sale-form";
import { useSales } from "@/features/sales/hooks/use-sales";

export const NewSalePage = () => {
  const navigate = useNavigate();
  const { products, customers, warehouses, isSubmitting, handleCreateSale, handleCreateCustomer } =
    useSales();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-7 lg:px-10">
      <header className="mx-auto mb-6 max-w-[1180px] px-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva venta</h1>
        <p className="mt-1 text-sm text-slate-600">
          Registra, cobra y descuenta el stock de la venta en un solo flujo.
        </p>
      </header>
      <div className="mx-auto max-w-[1180px]">
        <NewSaleForm
          onCancel={() => navigate(PATHS.APP.SALES)}
          onSubmit={handleCreateSale}
          onComplete={() => navigate(PATHS.APP.SALES)}
          onCreateCustomer={handleCreateCustomer}
          isSubmitting={isSubmitting}
          products={products}
          customers={customers}
          warehouses={warehouses}
        />
      </div>
    </div>
  );
};
