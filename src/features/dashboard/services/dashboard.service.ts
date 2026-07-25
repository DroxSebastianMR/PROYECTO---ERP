import type { DashboardData, DashboardPeriod } from "@/features/dashboard/types/dashboard.types";

const wait = () => new Promise((resolve) => window.setTimeout(resolve, 180));

const sales2024 = [40, 62, 84, 55, 106, 127, 92, 120, 12, 12, 12, 12];
const sales2025 = [68, 86, 72, 112, 98, 134, 145, 104, 0, 0, 0, 0];
const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** Temporary local adapter. Replace its body with the dashboard HTTP endpoint when the API is ready. */
export const dashboardService = {
  async getOverview(period: DashboardPeriod): Promise<DashboardData> {
    await wait();
    const values = period === "2024" ? sales2024 : sales2025;
    return {
      sales: months.map((month, index) => ({ month, amount: values[index] })),
      paymentMethods: [
        { name: "Transferencia", percentage: 45, color: "#2563eb" },
        { name: "POS / Tarjeta", percentage: 30, color: "#1d4ed8" },
        { name: "Yape / Plin", percentage: 15, color: "#dbe5f6" },
        { name: "Efectivo", percentage: 10, color: "#e5e7eb" },
      ],
      recentSales: [
        {
          id: "#V-9824",
          customer: "Constructora Alfa S.A.",
          date: "Hoy, 10:45 AM",
          amount: "S/ 2,450.00",
          status: "Pagado",
        },
        {
          id: "#V-9823",
          customer: "Ferretería El Maestro",
          date: "Hoy, 09:12 AM",
          amount: "S/ 840.50",
          status: "Pendiente",
        },
        {
          id: "#V-9822",
          customer: "Juan Pérez Gómez",
          date: "Ayer, 16:30 PM",
          amount: "S/ 125.00",
          status: "Anulado",
        },
        {
          id: "#V-9821",
          customer: "Importadora Norte",
          date: "Ayer, 14:24 PM",
          amount: "S/ 1,920.00",
          status: "Pagado",
        },
      ],
      activities: [
        {
          id: "activity-1",
          kind: "client",
          title: "Nuevo Cliente: Constructora Alfa S.A.",
          detail: "registrado por admin.",
          timestamp: "Hace 2 horas",
        },
        {
          id: "activity-2",
          kind: "purchase",
          title: "Compra Recibida: OC-1045",
          detail: "ingresada a almacén principal.",
          timestamp: "Hace 5 horas",
        },
        {
          id: "activity-3",
          kind: "alert",
          title: "Alerta de Sistema: Fallo en",
          detail: "sincronización con SUNAT (Reintentando).",
          timestamp: "Ayer, 18:45 PM",
        },
        {
          id: "activity-4",
          kind: "report",
          title: "Reporte Generado: Cierre de",
          detail: "caja mensual (Octubre).",
          timestamp: "01 Nov, 08:00 AM",
        },
      ],
      stockAlerts: [
        {
          id: "stock-1",
          product: "Cemento Sol Tipo I (Bolsa 42.5kg)",
          sku: "CEM-001",
          warehouse: "Almacén Principal",
          quantity: "5 unid.",
          minimum: "Mín: 20",
        },
        {
          id: "stock-2",
          product: 'Fierro Corrugado 1/2" x 9m',
          sku: "ACE-045",
          warehouse: "Almacén Sur",
          quantity: "12 unid.",
          minimum: "Mín: 50",
        },
      ],
    };
  },
};
