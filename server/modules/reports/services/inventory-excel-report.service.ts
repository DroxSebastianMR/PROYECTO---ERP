import ExcelJS from "exceljs";
import { TaxTreatment } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";

const reportColumns = [
  "Cód.", "Proveedor", "Factura", "Fecha", "Categoría", "Producto",
  "Presentación compra", "Cant. comprada", "Precio compra x empaque (c/IGV)", "Total compra",
  "Unid. x empaque", "Fuente unid.", "Stock (unid.)", "Costo unit. c/IGV",
  "Afecto IGV", "Costo unit. s/IGV", "Margen sugerido", "Margen manual",
  "Margen aplicado", "Precio venta sugerido", "Precio venta final", "Precio venta aplicado",
  "Ganancia x unid.", "Valor venta stock",
];

const money = (value: number) => Math.round(value * 100) / 100;
const date = (value: Date) => new Intl.DateTimeFormat("es-PE").format(value);

export const inventoryExcelReportService = {
  async create(companyId: string) {
    const [company, stocks] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, select: { name: true } }),
      prisma.inventoryStock.findMany({
        where: { warehouse: { companyId }, product: { isActive: true } },
        orderBy: { product: { name: "asc" } },
        select: {
          quantity: true,
          product: {
            select: {
              sku: true,
              name: true,
              unit: true,
              presentation: true,
              purchasePrice: true,
              salePrice: true,
              taxTreatment: true,
              category: { select: { name: true } },
              purchaseItems: {
                take: 1,
                orderBy: { purchase: { createdAt: "desc" } },
                select: {
                  quantity: true,
                  unitCost: true,
                  presentationName: true,
                  purchase: { select: { supplierName: true, number: true, purchasedAt: true, createdAt: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Clienty - Sistema de Ventas";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Inventario", { views: [{ state: "frozen", ySplit: 4 }] });
    sheet.properties.defaultRowHeight = 19;
    sheet.mergeCells("A1:X1");
    sheet.mergeCells("A2:X2");
    sheet.getCell("A1").value = `Inventario actual y lista de precios — ${company?.name ?? "Clienty"}`;
    sheet.getCell("A2").value = "Reporte generado desde Clienty. Los precios finales consideran el IGV según la configuración de cada producto.";
    sheet.getCell("A1").font = { name: "Arial", size: 15, bold: true, color: { argb: "FF173F7A" } };
    sheet.getCell("A2").font = { name: "Arial", size: 10, italic: true, color: { argb: "FF64748B" } };
    sheet.getCell("A1").alignment = { vertical: "middle" };
    sheet.getCell("A2").alignment = { vertical: "middle" };
    sheet.getRow(1).height = 26;
    sheet.getRow(2).height = 22;
    sheet.addRow([]);
    const header = sheet.addRow(reportColumns);
    header.height = 30;
    header.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = { bottom: { style: "thin", color: { argb: "FFBFDBFE" } } };
    });

    stocks.forEach((stock, index) => {
      const purchase = stock.product.purchaseItems[0];
      const quantity = Number(stock.quantity);
      const unitCost = Number(purchase?.unitCost ?? stock.product.purchasePrice ?? 0);
      const isTaxed = stock.product.taxTreatment === TaxTreatment.TAXED;
      const netCost = isTaxed ? unitCost / 1.18 : unitCost;
      const baseSalePrice = Number(stock.product.salePrice);
      const finalSalePrice = isTaxed ? baseSalePrice * 1.18 : baseSalePrice;
      const margin = netCost > 0 ? (baseSalePrice - netCost) / netCost : 0;
      const purchaseQuantity = Number(purchase?.quantity ?? quantity);
      const row = sheet.addRow([
        stock.product.sku,
        purchase?.purchase.supplierName ?? "Sin proveedor",
        purchase?.purchase.number ?? "Sin documento",
        date(purchase?.purchase.purchasedAt ?? purchase?.purchase.createdAt ?? new Date()),
        stock.product.category?.name ?? "Sin categoría",
        stock.product.name,
        purchase?.presentationName ?? stock.product.presentation ?? stock.product.unit,
        purchaseQuantity,
        unitCost,
        money(purchaseQuantity * unitCost),
        1,
        purchase ? "Compra registrada" : "Sistema",
        quantity,
        unitCost,
        isTaxed ? "Sí" : "No",
        money(netCost),
        margin,
        null,
        margin,
        money(finalSalePrice),
        money(finalSalePrice),
        money(finalSalePrice),
        money(finalSalePrice - unitCost),
        money(quantity * finalSalePrice),
      ]);
      row.height = 20;
      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 9, color: { argb: "FF0F172A" } };
        cell.alignment = { vertical: "middle", wrapText: false };
        cell.border = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
        if (index % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      });
      row.getCell(15).font = { name: "Arial", size: 9, bold: true, color: { argb: isTaxed ? "FF047857" : "FFB45309" } };
    });

    const currencyColumns = [9, 10, 14, 16, 20, 21, 22, 23, 24];
    currencyColumns.forEach((column) => {
      sheet.getColumn(column).numFmt = '"S/" #,##0.00';
    });
    [17, 18, 19].forEach((column) => { sheet.getColumn(column).numFmt = "0.0%"; });
    [8, 11, 13].forEach((column) => { sheet.getColumn(column).numFmt = "#,##0.###"; });
    [8, 9, 10, 11, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24].forEach((column) => {
      sheet.getColumn(column).alignment = { horizontal: "right", vertical: "middle" };
    });
    [1, 2, 3, 4, 5, 6, 7, 12, 15].forEach((column) => {
      sheet.getColumn(column).alignment = { horizontal: "left", vertical: "middle" };
    });
    const widths = [14, 22, 17, 13, 18, 32, 22, 14, 19, 16, 15, 17, 14, 17, 12, 17, 15, 14, 15, 19, 17, 19, 17, 19];
    widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
    sheet.autoFilter = { from: "A4", to: `X${Math.max(4, stocks.length + 4)}` };
    sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  },
};
