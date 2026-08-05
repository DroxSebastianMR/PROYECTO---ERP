export type ExcelColumn<T> = { header: string; value: (row: T) => string | number | null | undefined };

class ExcelExportService {
  exportCsv<T>(fileName: string, columns: ExcelColumn<T>[], rows: T[]) {
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [columns.map((column) => escape(column.header)).join(","), ...rows.map((row) => columns.map((column) => escape(column.value(row))).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${fileName}.csv`; link.click(); URL.revokeObjectURL(url);
  }
}
export const excelExportService = new ExcelExportService();
