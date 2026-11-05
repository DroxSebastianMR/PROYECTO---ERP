import { axiosInstance } from "@/infrastructure/api/client/axios.instance";

const download = (fileName: string, data: Blob) => {
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

class InventoryReportExportService {
  async downloadWorkbook() {
    const { data } = await axiosInstance.get<Blob>("/reports/inventory.xlsx", {
      responseType: "blob",
    });
    download("reporte-inventario.xlsx", data);
  }
}

export const inventoryReportExportService = new InventoryReportExportService();
