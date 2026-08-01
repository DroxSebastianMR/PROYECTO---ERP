import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Package,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  Warehouse,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProductFormStepper } from "@/features/products/components/product-form-stepper";
import { productImageStorage } from "@/features/products/services/product-image-storage.service";
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
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const [formData, setFormData] = useState({
    sku: "",
    barcode: "",
    name: "",
    category: "Construcción",
    unit: "UND",
    brand: "",
    presentation: "",
    salePrice: "",
    costPrice: "0",
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

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageFileSize, setImageFileSize] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const clearPendingImage = () => {
    setPendingImage((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  };
  const imagePreviewUrl = pendingImage?.previewUrl || formData.imageUrl;
  const isSaving = isSubmitting || isUploadingImage;

  useEffect(() => {
    clearPendingImage();
    if (product) {
      setFormData({
        sku: product.sku,
        barcode: product.barcode || "",
        name: product.name,
        category: product.category,
        unit: product.unit,
        brand: product.brand || "",
        presentation: product.presentation || "",
        salePrice: String(product.salePrice),
        costPrice: String(product.costPrice || "0"),
        wholesalePrice: String(product.wholesalePrice || ""),
        wholesaleMinQuantity: String(product.wholesaleMinQuantity || 10),
        imageUrl: product.imageUrl || "",
        taxTreatment: product.taxTreatment || "TAXED",
        initialStock: String(product.totalStock),
        minStock: String(product.minStock),
        description: product.description || "",
      });
      setUseCustomCategory(false);
      setImageFileName(product.imageUrl ? "Imagen guardada del producto" : null);
      setImageFileSize(null);
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
        costPrice: "0",
        wholesalePrice: "",
        wholesaleMinQuantity: "10",
        imageUrl: "",
        taxTreatment: "TAXED",
        initialStock: "0",
        minStock: "5",
        description: "",
      });
      setUseCustomCategory(false);
      setImageFileName(null);
      setImageFileSize(null);
    }
    setActiveStep(1);
    setShowUrlInput(false);
  }, [product, categories, isOpen]);

  // Image Drag & Drop Handlers
  const handleFile = (file: File) => {
    try {
      productImageStorage.validate(file);
    } catch (error) {
      alert(error instanceof Error ? error.message : "La imagen seleccionada no es válida.");
      return;
    }
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setImageFileName(file.name);
    setImageFileSize(`${sizeMb} MB`);
    clearPendingImage();
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
    setShowUrlInput(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    clearPendingImage();
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    setImageFileName(null);
    setImageFileSize(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const finalCategory = useCustomCategory ? customCategory.trim() : formData.category;

    if (!formData.name.trim() || !finalCategory) {
      alert("Por favor completa los campos obligatorios: Nombre y Categoría.");
      setActiveStep(1);
      return;
    }

    const salePriceNum = parseFloat(formData.salePrice);
    if (isNaN(salePriceNum) || salePriceNum < 0) {
      alert("El precio de venta debe ser un número positivo.");
      setActiveStep(2);
      return;
    }

    let uploadedImage: { path: string; publicUrl: string } | null = null;
    setIsUploadingImage(Boolean(pendingImage));
    try {
      if (pendingImage) uploadedImage = await productImageStorage.upload(pendingImage.file);
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
      imageUrl: uploadedImage?.publicUrl ?? (formData.imageUrl.trim() || undefined),
      taxTreatment: formData.taxTreatment,
      initialStock: parseFloat(formData.initialStock) || 0,
      minStock: parseFloat(formData.minStock) || 0,
      description: formData.description.trim(),
      };
      await onSubmit(payload);
      if (pendingImage) clearPendingImage();
    } catch (error) {
      if (uploadedImage) await productImageStorage.remove(uploadedImage.path).catch(() => undefined);
      alert(error instanceof Error ? error.message : "No se pudo registrar el producto.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Producto" : "Nuevo Producto"}
      description={
        isEditing
          ? "Modifica las especificaciones del producto seleccionado en el catálogo."
          : "Flujo paso a paso para el registro profesional de productos ERP."
      }
      maxWidth="2xl"
      headerClassName="relative overflow-hidden border-b-0 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-5"
      titleClassName="text-white"
      descriptionClassName="text-blue-100"
      headerIcon={
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-blue-100">
          <Package className="h-5 w-5" />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ProductFormStepper activeStep={activeStep} onStepChange={setActiveStep} />

        {/* PASO 1: INFORMACIÓN GENERAL & MULTIMEDIA */}
        {activeStep === 1 && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/40 p-3.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Paso 1: Identificación y Multimedia
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Ingresa el nombre, código de barras, categoría y fotografía del producto.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-800 border border-blue-200">
                {formData.sku || "SKU Auto"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Nombre del Producto */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Producto <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Ej. Cemento Sol Tipo I (Bolsa 42.5kg)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Categoría */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Categoría <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomCategory(!useCustomCategory)}
                    className="text-xs font-medium text-blue-600 hover:underline"
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

              {/* Marca */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marca (Opcional)
                </label>
                <Input
                  placeholder="Ej. UNACEM, Sol, Bosch..."
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>

              {/* Código de barras */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Barras / EAN
                </label>
                <Input
                  placeholder="Ej. 7750123456789"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>

              {/* SKU (Solo lectura) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código SKU Interno
                </label>
                <Input
                  placeholder="Se generará automáticamente"
                  value={formData.sku}
                  disabled
                  className="bg-slate-100 font-mono text-xs text-slate-500"
                />
              </div>
            </div>

            {/* DRAG & DROP AREA PARA IMAGEN CON STORAGE PERSONALIZADO */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Fotografía del Producto (Storage Personalizado)
                </label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs text-slate-500 hover:text-blue-600 underline"
                >
                  {showUrlInput ? "Usar arrastrar archivo" : "Ingresar por URL"}
                </button>
              </div>

              {showUrlInput ? (
                <div className="space-y-2">
                  <Input
                    type="url"
                    placeholder="https://servidor-storage.com/imagenes/producto.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                  {formData.imageUrl && (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 bg-slate-50">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="h-14 w-14 rounded-lg object-cover border border-slate-200"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-slate-800">Vista previa URL</p>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="mt-1 text-rose-600 hover:underline"
                        >
                          Remover imagen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : imagePreviewUrl ? (
                /* Vista previa cuando ya hay imagen seleccionada / cargada */
                <div className="relative flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreviewUrl}
                      alt="Producto"
                      className="h-16 w-16 rounded-lg border border-slate-200 object-cover shadow-sm bg-white"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[280px]">
                        {imageFileName || "Imagen guardada del producto"}
                      </p>
                      {imageFileSize && (
                        <p className="text-[11px] text-slate-500">{imageFileSize}</p>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                        <Sparkles className="h-3 w-3 text-emerald-600" />
                        {pendingImage ? "Se guardará al registrar" : "Imagen guardada"}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemoveImage}
                    className="text-rose-600 hover:bg-rose-50 h-9 w-9 p-0 rounded-lg"
                    title="Remover imagen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                /* ZONA DE ARRASTRAR ARCHIVO (DRAG & DROP) */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                    isDragging
                      ? "border-blue-600 bg-blue-50/80 scale-[0.99]"
                      : "border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100/70 text-blue-700 mb-2">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    <span className="text-blue-700">Haz clic para seleccionar</span> o arrastra la imagen aquí
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    JPG, PNG o WEBP · máximo 5 MB · se sube solo al registrar el producto
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 2: PRECIOS & TRATAMIENTO TRIBUTARIO */}
        {activeStep === 2 && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/40 p-3.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Paso 2: Precios de Venta & Impuestos
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Configura las tarifas al público, precios por volumen y afectación del IGV.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Precio de Venta (Público) */}
              <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Precio de Venta al Público (S/) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    S/
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    required
                    className="pl-9 text-lg font-bold text-slate-900 bg-white"
                  />
                </div>
                <p className="mt-1 text-[11px] text-emerald-700">
                  Precio base de venta final en el Punto de Venta (POS) y catálogo.
                </p>
              </div>

              {/* Precio Mayorista */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Precio Mayorista (S/)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                />
              </div>

              {/* Mínimo unidades mayorista */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mínimo Unidades para Mayorista
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="10"
                  value={formData.wholesaleMinQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, wholesaleMinQuantity: e.target.value })
                  }
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Aplica tarifa especial al superar este volumen de compra.
                </p>
              </div>

              {/* Afectación al IGV / Tratamiento Tributario */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tratamiento Tributario / IGV SUNAT
                </label>
                <select
                  value={formData.taxTreatment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxTreatment: e.target.value as "TAXED" | "EXONERATED" | "UNAFFECTED",
                    })
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value="TAXED">Gravado / Afecto al IGV (18%)</option>
                  <option value="EXONERATED">Exonerado del IGV (Selva / Bienes exonerados)</option>
                  <option value="UNAFFECTED">Inafecto al IGV</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: INVENTARIO, UNIDADES & NOTAS */}
        {activeStep === 3 && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/40 p-3.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
                  <Warehouse className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Paso 3: Unidades de Medida & Almacén
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Establece el stock inicial, límites de alerta y especificaciones adicionales.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Unidad de Medida */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Unidad de Medida <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewUnit(!showNewUnit)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    {showNewUnit ? "Cancelar" : "+ Crear Unidad"}
                  </button>
                </div>
                {showNewUnit ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cód (Ej. CAJ)"
                      value={newUnit.code}
                      onChange={(e) =>
                        setNewUnit({ ...newUnit, code: e.target.value.toUpperCase() })
                      }
                      className="font-mono text-xs"
                    />
                    <Input
                      placeholder="Nombre (Caja x 12)"
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                    />
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!newUnit.code.trim() || !newUnit.name.trim()) return;
                        const unit = await onCreateMeasurementUnit(newUnit);
                        setFormData({ ...formData, unit: unit.code });
                        setNewUnit({ code: "", name: "" });
                        setShowNewUnit(false);
                      }}
                      className="shrink-0 bg-blue-600 text-white hover:bg-blue-700 h-10 px-3 text-xs"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="UND">UND - Unidad</option>
                    <option value="KG">KG - Kilogramo</option>
                    <option value="MTR">MTR - Metro</option>
                    <option value="LTR">LTR - Litro</option>
                    <option value="BOL">BOL - Bolsa</option>
                    <option value="CAJ">CAJ - Caja</option>
                    <option value="SET">SET - Juego / Kit</option>
                    {measurementUnits.map((unit) => (
                      <option key={unit.id} value={unit.code}>
                        {unit.code} - {unit.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {/* Presentación / Empaque */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Presentación de Empaque
                </label>
                <Input
                  placeholder="Ej. Bolsa 42.5 kg, Caja x 24 und..."
                  value={formData.presentation}
                  onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
                />
              </div>

              {/* Stock Inicial / Actual */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEditing ? "Stock Total Actual" : "Stock Inicial en Almacén Principal"}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stock Mínimo (Alerta Reabastecimiento)
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

              {/* Descripción / Notas */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción / Ficha Técnica (Opcional)
                </label>
                <textarea
                  rows={3}
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
                  placeholder="Detalles de composición, especificaciones de fábrica o notas de uso..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <Button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as 1 | 2 | 3)}
                disabled={isSaving}
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs h-9 px-3 font-medium"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
              </Button>
            )}

            {activeStep < 3 ? (
              <Button
                type="button"
                onClick={() => setActiveStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className="bg-blue-600 text-white hover:bg-blue-700 text-xs h-9 px-4 font-medium"
              >
                Siguiente <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs h-9 px-4 font-medium shadow-sm"
              >
                <Save className="mr-1.5 h-4 w-4" />
                {isSaving
                  ? isUploadingImage ? "Guardando imagen..." : "Guardando..."
                  : isEditing
                  ? "Guardar Cambios"
                  : "Registrar Producto"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Dialog>
  );
};
