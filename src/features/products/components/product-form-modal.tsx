import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  MeasurementUnit,
} from "@/features/products/types/product.types";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => Promise<void>;
  product?: Product | null;
  categories: string[];
  measurementUnits: MeasurementUnit[];
  onCreateMeasurementUnit: (input: { code: string; name: string }) => Promise<MeasurementUnit>;
  isSubmitting: boolean;
}

export const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
  measurementUnits,
  onCreateMeasurementUnit,
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
    wholesaleMinQuantity: "10",
    imageUrl: "",
    taxTreatment: "TAXED" as "TAXED" | "EXONERATED" | "UNAFFECTED",
    initialStock: "",
    minStock: "5",
    description: "",
  });

  const [customCategory, setCustomCategory] = useState("");
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [newUnit, setNewUnit] = useState({ code: "", name: "" });
  const [showNewUnit, setShowNewUnit] = useState(false);

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
        wholesaleMinQuantity: String(product.wholesaleMinQuantity || 10),
        imageUrl: product.imageUrl || "",
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
        wholesaleMinQuantity: "10",
        imageUrl: "",
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

    if (!formData.name.trim() || !finalCategory) {
      alert("Por favor completa los campos obligatorios: Nombre y Categoría.");
      return;
    }

    const salePriceNum = parseFloat(formData.salePrice);
    if (isNaN(salePriceNum) || salePriceNum < 0) {
      alert("El precio de venta debe ser un número positivo.");
      return;
    }

    const payload: CreateProductInput | UpdateProductInput = {
      ...(product ? { id: product.id } : {}),
      ...(product ? { sku: formData.sku } : {}),
      barcode: formData.barcode.trim() || undefined,
      name: formData.name.trim(),
      category: finalCategory,
      brand: formData.brand.trim() || undefined,
      unit: formData.unit,
      presentation: formData.presentation.trim() || undefined,
      salePrice: salePriceNum,
      costPrice: parseFloat(formData.costPrice) || 0,
      wholesalePrice: parseFloat(formData.wholesalePrice) || undefined,
      wholesaleMinQuantity: parseFloat(formData.wholesaleMinQuantity) || undefined,
      imageUrl: formData.imageUrl.trim() || undefined,
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              SKU / Código <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Se genera al guardar"
              value={formData.sku}
              disabled
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">Precio mayorista (S/)</label>
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={formData.wholesalePrice} onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">Desde cuántas unidades aplica</label>
            <Input type="number" min="1" step="1" value={formData.wholesaleMinQuantity} onChange={(e) => setFormData({ ...formData, wholesaleMinQuantity: e.target.value })} />
            <p className="mt-1 text-xs text-slate-500">Ejemplo: desde 10 unidades se aplicará el precio mayorista.</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">Imagen del producto</label>
          <Input type="url" placeholder="https://.../producto.jpg" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
          {formData.imageUrl && <img src={formData.imageUrl} alt="Vista previa del producto" className="mt-2 h-20 w-20 rounded-lg border border-slate-200 object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Código de barras
            </label>
            <Input
              placeholder="EAN / UPC (opcional)"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Marca
            </label>
            <Input
              placeholder="Ej. Coca-Cola"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Categoría */}
          <div>
            <div className="mb-1 flex items-center justify-between">
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
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Unidad de medida</label>
              <button type="button" onClick={() => setShowNewUnit(!showNewUnit)} className="text-xs text-blue-600 hover:underline">
                {showNewUnit ? "Cancelar" : "+ Nueva unidad"}
              </button>
            </div>
            {showNewUnit ? (
              <div className="flex gap-2">
                <Input placeholder="Código" value={newUnit.code} onChange={(e) => setNewUnit({ ...newUnit, code: e.target.value.toUpperCase() })} />
                <Input placeholder="Nombre" value={newUnit.name} onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })} />
                <Button type="button" variant="ghost" onClick={async () => {
                  if (!newUnit.code.trim() || !newUnit.name.trim()) return;
                  const unit = await onCreateMeasurementUnit(newUnit);
                  setFormData({ ...formData, unit: unit.code });
                  setNewUnit({ code: "", name: "" });
                  setShowNewUnit(false);
                }}>Crear</Button>
              </div>
            ) : (
              <Select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                <option value="UND">UND - Unidad</option>
                {measurementUnits.map((unit) => <option key={unit.id} value={unit.code}>{unit.code} - {unit.name}</option>)}
              </Select>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Precio de Venta */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
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
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
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
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
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
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
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
