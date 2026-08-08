import { useNavigate } from "react-router-dom";
import { PATHS } from "@/app/router/constants/paths";
import { NewSaleForm } from "@/features/sales/components/new-sale-form";
import { useSales } from "@/features/sales/hooks/use-sales";
import { useAuth } from "@/features/auth/hooks/use-auth";

export const NewSalePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    products,
    customers,
    warehouses,
    isSubmitting,
    isCreatingCustomer,
    handleCreateSale,
    handleCreateCustomer,
    handleLookupCustomerDocument,
  } = useSales();
  // The seller always sells from the principal warehouse; there is no warehouse choice in POS.
  const primaryWarehouse = warehouses.find((warehouse) => warehouse.isPrimary) ?? warehouses[0];
  const saleWarehouses = user?.role === "SALES_PURCHASING" && primaryWarehouse
    ? [primaryWarehouse]
    : warehouses;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-7 lg:px-10">
      <header className="mx-auto mb-6 max-w-[1440px] px-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva venta</h1>
        <p className="mt-1 text-sm text-slate-600">
          Registra, cobra y descuenta el stock de la venta en un solo flujo.
        </p>
      </header>
      <div className="mx-auto max-w-[1440px]">
        <NewSaleForm
          onCancel={() => navigate(PATHS.APP.SALES)}
          onSubmit={handleCreateSale}
          onComplete={() => navigate(PATHS.APP.SALES)}
          onCreateCustomer={handleCreateCustomer}
          onLookupCustomerDocument={handleLookupCustomerDocument}
          isSubmitting={isSubmitting}
          isCreatingCustomer={isCreatingCustomer}
          products={products}
          customers={customers}
          warehouses={saleWarehouses}
        />
      </div>
    </div>
  );
};
