import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "@/features/products/types/product.types";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => Promise<void>;
  product?: Product | null;
  categories: string[];
  isSubmitting: boolean;
}

export const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
  isSubmitting,
}: ProductFormModalProps) => {
  const isEditing = Boolean(product);

  const [formData, setFormData] = useState({
    sku: "",
    barcode: "",
    name: "",
    category: "Construcción",
    unit: "UND",
    brand: "",
    presentation: "",
    salePrice: "",
    costPrice: "",
    wholesalePrice: "",
    taxTreatment: "TAXED" as "TAXED" | "EXONERATED" | "UNAFFECTED",
    initialStock: "",
    minStock: "5",
    description: "",
  });

  const [customCategory, setCustomCategory] = useState("");
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        barcode: product.barcode || "",
        name: product.name,
        category: product.category,
        unit: product.unit,
        brand: product.brand,
        presentation: product.presentation || "",
        salePrice: String(product.salePrice),
        costPrice: String(product.costPrice || ""),
        wholesalePrice: String(product.wholesalePrice || ""),
        taxTreatment: product.taxTreatment || "TAXED",
        initialStock: String(product.totalStock),
        minStock: String(product.minStock),
        description: product.description || "",
      });
      setUseCustomCategory(false);
    } else {
      setFormData({
        sku: "",
        barcode: "",
        name: "",
        category: categories[0] || "Construcción",
        unit: "UND",
        brand: "",
        presentation: "",
        salePrice: "",
        costPrice: "",
        wholesalePrice: "",
        taxTreatment: "TAXED",
        initialStock: "0",
        minStock: "5",
        description: "",
      });
      setUseCustomCategory(false);
    }
  }, [product, categories, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const finalCategory = useCustomCategory ? customCategory.trim() : formData.category;

    if (!formData.sku.trim() || !formData.name.trim() || !finalCategory) {
      alert("Por favor completa los campos obligatorios: SKU, Nombre y Categoría.");
      return;
    }

    const salePriceNum = parseFloat(formData.salePrice);
    if (isNaN(salePriceNum) || salePriceNum < 0) {
      alert("El precio de venta debe ser un número positivo.");
      return;
    }

    const payload: CreateProductInput | UpdateProductInput = {
      ...(product ? { id: product.id } : {}),
      sku: formData.sku.trim(),
      barcode: formData.barcode.trim() || undefined,
      name: formData.name.trim(),
      category: finalCategory,
      brand: formData.brand.trim() || undefined,
      unit: formData.unit,
      presentation: formData.presentation.trim() || undefined,
      salePrice: salePriceNum,
      costPrice: parseFloat(formData.costPrice) || 0,
      wholesalePrice: parseFloat(formData.wholesalePrice) || undefined,
      taxTreatment: formData.taxTreatment,
      initialStock: parseFloat(formData.initialStock) || 0,
      minStock: parseFloat(formData.minStock) || 0,
      description: formData.description.trim(),
    };

    await onSubmit(payload);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Producto" : "Nuevo Producto"}
      description={
        isEditing
          ? "Modifica las especificaciones del producto seleccionado."
          : "Completa los datos para registrar un nuevo producto en el catálogo ERP."
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* SKU */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              SKU / Código <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Ej. CEM-SOL-01"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Nombre del Producto <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Ej. Cemento Sol Tipo I (Bolsa 42.5kg)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">Código de barras</label>
            <Input placeholder="EAN / UPC (opcional)" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">Marca</label>
            <Input placeholder="Ej. Coca-Cola" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Categoría */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Categoría <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setUseCustomCategory(!useCustomCategory)}
                className="text-xs text-blue-600 hover:underline"
              >
                {useCustomCategory ? "Elegir existente" : "+ Nueva categoría"}
              </button>
            </div>
            {useCustomCategory ? (
              <Input
                placeholder="Nombre de nueva categoría"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
              />
            ) : (
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                ) : (
                  <option value="Construcción">Construcción</option>
                )}
              </Select>
            )}
          </div>

          {/* Unidad de Medida */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Unidad de Medida
            </label>
            <Select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="UND">UND - Unidad</option>
              <option value="BOL">BOL - Bolsa</option>
              <option value="KG">KG - Kilogramo</option>
              <option value="MTR">MTR - Metro</option>
              <option value="LTR">LTR - Litro</option>
              <option value="BAL">BAL - Balde / Galón</option>
              <option value="ROL">ROL - Rollo</option>
              <option value="MIL">MIL - Millar</option>
              <option value="CAJ">CAJ - Caja</option>
              <option value="SET">SET - Juego / Kit</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Precio de Venta */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Precio Venta (S/) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
              required
            />
          </div>

          {/* Precio de Costo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Costo Referencial (S/)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Stock Inicial / Actual */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              {isEditing ? "Stock Total Actual" : "Stock Inicial"}
            </label>
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={formData.initialStock}
              onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
            />
          </div>

          {/* Stock Mínimo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Stock Mínimo (Alerta)
            </label>
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="5"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Descripción / Notas
          </label>
          <textarea
            rows={3}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
            placeholder="Especificaciones técnicas o detalles adicionales..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear Producto"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
