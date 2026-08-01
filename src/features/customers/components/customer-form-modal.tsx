import { Building2, Check, Loader2, Save, Search, User, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  CommercialCategory,
  CreateCustomerInput,
  Customer,
  CustomerType,
  DocumentType,
} from "@/features/customers/types/customer.types";

interface CustomerFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData: Customer | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCustomerInput) => Promise<void>;
  onLookupDocument: (
    type: DocumentType,
    docNumber: string,
  ) => Promise<{
    found: boolean;
    data?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
      tradeName?: string;
      legalRepresentative?: string;
      address?: string;
      ubigeo?: string;
    };
    message?: string;
  }>;
}

export const CustomerFormModal = ({
  isOpen,
  mode,
  initialData,
  isSubmitting,
  onClose,
  onSubmit,
  onLookupDocument,
}: CustomerFormModalProps) => {
  const [customerType, setCustomerType] = useState<CustomerType>("PERSONA_NATURAL");
  const [documentType, setDocumentType] = useState<DocumentType>("DNI");
  const [documentNumber, setDocumentNumber] = useState("");

  // Persona Natural fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "OTRO">("M");
  const [civilStatus, setCivilStatus] = useState<"SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO">("SOLTERO");
  const [phone, setPhone] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [email, setEmail] = useState("");

  // Empresa fields
  const [companyName, setCompanyName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [legalRepresentative, setLegalRepresentative] = useState("");
  const [representativeRole, setRepresentativeRole] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  // Común
  const [address, setAddress] = useState("");
  const [ubigeo, setUbigeo] = useState("");
  const [category, setCategory] = useState<CommercialCategory>("REGULAR");
  const [notes, setNotes] = useState("");

  // Lookup state
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setCustomerType(initialData.customerType);
      setDocumentType(initialData.documentType);
      setDocumentNumber(initialData.documentNumber);

      setFirstName(initialData.firstName || "");
      setLastName(initialData.lastName || "");
      setBirthDate(initialData.birthDate || "");
      setGender(initialData.gender || "M");
      setCivilStatus(initialData.civilStatus || "SOLTERO");
      setPhone(initialData.phone || "");
      setMobilePhone(initialData.mobilePhone || "");
      setEmail(initialData.email || "");

      setCompanyName(initialData.companyName || "");
      setTradeName(initialData.tradeName || "");
      setLegalRepresentative(initialData.legalRepresentative || "");
      setRepresentativeRole(initialData.representativeRole || "");
      setCompanyPhone(initialData.companyPhone || "");
      setCompanyEmail(initialData.companyEmail || "");

      setAddress(initialData.address || "");
      setUbigeo(initialData.ubigeo || "");
      setCategory(initialData.category || "REGULAR");
      setNotes(initialData.notes || "");
    } else {
      resetForm();
    }
    setFormError(null);
    setLookupMessage(null);
  }, [initialData, mode, isOpen]);

  const resetForm = () => {
    setCustomerType("PERSONA_NATURAL");
    setDocumentType("DNI");
    setDocumentNumber("");
    setFirstName("");
    setLastName("");
    setBirthDate("");
    setGender("M");
    setCivilStatus("SOLTERO");
    setPhone("");
    setMobilePhone("");
    setEmail("");
    setCompanyName("");
    setTradeName("");
    setLegalRepresentative("");
    setRepresentativeRole("");
    setCompanyPhone("");
    setCompanyEmail("");
    setAddress("");
    setUbigeo("");
    setCategory("REGULAR");
    setNotes("");
  };

  const handleCustomerTypeChange = (type: CustomerType) => {
    setCustomerType(type);
    setDocumentType(type === "EMPRESA" ? "RUC" : "DNI");
    setLookupMessage(null);
  };

  const handleLookup = async () => {
    if (!documentNumber.trim()) {
      setLookupMessage({ type: "error", text: "Ingrese un número de documento." });
      return;
    }

    setIsSearchingDoc(true);
    setLookupMessage(null);
    try {
      const res = await onLookupDocument(documentType, documentNumber);
      if (res.found && res.data) {
        if (res.data.firstName) setFirstName(res.data.firstName);
        if (res.data.lastName) setLastName(res.data.lastName);
        if (res.data.companyName) setCompanyName(res.data.companyName);
        if (res.data.tradeName) setTradeName(res.data.tradeName);
        if (res.data.legalRepresentative) setLegalRepresentative(res.data.legalRepresentative);
        if (res.data.address) setAddress(res.data.address);
        if (res.data.ubigeo) setUbigeo(res.data.ubigeo);

        setLookupMessage({ type: "success", text: res.message || "Datos autocompletados correctamente." });
      } else {
        setLookupMessage({ type: "error", text: res.message || "No se encontraron datos automáticos." });
      }
    } catch {
      setLookupMessage({ type: "error", text: "Error de consulta externa." });
    } finally {
      setIsSearchingDoc(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validaciones preliminares
    if (!documentNumber.trim()) {
      setFormError("El número de documento es obligatorio.");
      return;
    }

    if (customerType === "PERSONA_NATURAL" && (!firstName.trim() || !lastName.trim())) {
      setFormError("Nombres y Apellidos son obligatorios para Persona Natural.");
      return;
    }

    if (customerType === "EMPRESA" && !companyName.trim()) {
      setFormError("La Razón Social es obligatoria para Empresa.");
      return;
    }

    const payload: CreateCustomerInput = {
      customerType,
      documentType,
      documentNumber: documentNumber.trim(),
      address: address.trim(),
      ubigeo: ubigeo.trim(),
      category,
      notes: notes.trim(),

      ...(customerType === "PERSONA_NATURAL"
        ? {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            birthDate: birthDate || undefined,
            gender,
            civilStatus,
            phone: phone.trim(),
            mobilePhone: mobilePhone.trim(),
            email: email.trim(),
          }
        : {
            companyName: companyName.trim(),
            tradeName: tradeName.trim(),
            legalRepresentative: legalRepresentative.trim(),
            representativeRole: representativeRole.trim(),
            companyPhone: companyPhone.trim(),
            companyEmail: companyEmail.trim(),
          }),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar cliente.");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Registro de Nuevo Cliente" : `Editar Cliente: ${initialData?.code}`}
      description="Ingrese los datos del cliente con validación previa de número de documento."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium flex items-center gap-2">
            <span>⚠️</span> {formError}
          </div>
        )}

        {/* Selector Tipo de Cliente (Persona / Empresa) */}
        <div className="flex rounded-xl bg-slate-100 p-1.5 border border-slate-200">
          <button
            type="button"
            disabled={mode === "edit"}
            onClick={() => handleCustomerTypeChange("PERSONA_NATURAL")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
              customerType === "PERSONA_NATURAL"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="h-4 w-4" />
            Persona Natural
          </button>
          <button
            type="button"
            disabled={mode === "edit"}
            onClick={() => handleCustomerTypeChange("EMPRESA")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
              customerType === "EMPRESA"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Empresa / Persona Jurídica
          </button>
        </div>

        {/* Sección: Identificación Tributaria / Personal */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Documento de Identidad & Clasificación
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo Documento <span className="text-rose-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600"
              >
                {customerType === "EMPRESA" ? (
                  <>
                    <option value="RUC">RUC</option>
                    <option value="OTRO">OTRO</option>
                  </>
                ) : (
                  <>
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC (10...)</option>
                    <option value="CE">Carnet de Extranjería (CE)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="OTRO">OTRO</option>
                  </>
                )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Documento <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  required
                  placeholder={documentType === "DNI" ? "Ej. 45892134 (8 dígitos)" : "Ej. 20608912341 (11 dígitos)"}
                  value={documentNumber}
                  onChange={(e) => {
                    setDocumentNumber(e.target.value);
                    setLookupMessage(null);
                  }}
                  className="font-mono"
                />
                <Button
                  type="button"
                  onClick={handleLookup}
                  disabled={isSearchingDoc || !documentNumber.trim()}
                  className="shrink-0 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs h-10 px-3"
                >
                  {isSearchingDoc ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <>
                      <Search className="mr-1 h-3.5 w-3.5" /> Buscar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {lookupMessage && (
            <p
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                lookupMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {lookupMessage.text}
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Categoría Comercial (Clasificación para Ventas)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CommercialCategory)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600"
            >
              <option value="REGULAR">Regular</option>
              <option value="VIP">VIP (Cliente Preferencial)</option>
              <option value="MAYORISTA">Mayorista</option>
              <option value="MINORISTA">Minorista</option>
              <option value="CORPORATIVO">Corporativo / Gran Cuenta</option>
            </select>
          </div>
        </div>

        {/* Sección 2: Datos Específicos según Persona Natural o Empresa */}
        {customerType === "PERSONA_NATURAL" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Datos Personales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombres <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Ej. Carlos Alberto"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apellidos <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Ej. Mendoza Ríos"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Nacimiento (Opcional)
                </label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sexo</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "M" | "F" | "OTRO")}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E. Civil</label>
                  <select
                    value={civilStatus}
                    onChange={(e) =>
                      setCivilStatus(
                        e.target.value as "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO",
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600"
                  >
                    <option value="SOLTERO">Soltero(a)</option>
                    <option value="CASADO">Casado(a)</option>
                    <option value="DIVORCIADO">Divorciado(a)</option>
                    <option value="VIUDO">Viudo(a)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Celular Principal
                </label>
                <Input
                  placeholder="Ej. 987654321"
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono Fijo
                </label>
                <Input
                  placeholder="Ej. 01-2248900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Datos de la Empresa
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razón Social <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Ej. Constructora & Inversiones Del Sur S.A.C."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Comercial
                </label>
                <Input
                  placeholder="Ej. Consur Perú"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono Empresa
                </label>
                <Input
                  placeholder="Ej. 01-4528900"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Representante Legal
                </label>
                <Input
                  placeholder="Ej. Roberto Carlos Mendoza"
                  value={legalRepresentative}
                  onChange={(e) => setLegalRepresentative(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo del Representante
                </label>
                <Input
                  placeholder="Ej. Gerente General"
                  value={representativeRole}
                  onChange={(e) => setRepresentativeRole(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico Empresa
                </label>
                <Input
                  type="email"
                  placeholder="contacto@empresa.com.pe"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Sección 3: Dirección & Observaciones */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3. Ubicación & Observaciones
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dirección Fiscal / Domicilio
              </label>
              <Input
                placeholder="Av. Principal 123, Dist, Provincia"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ubigeo</label>
              <Input
                placeholder="Ej. 150130"
                value={ubigeo}
                onChange={(e) => setUbigeo(e.target.value)}
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notas / Observaciones Comerciales
              </label>
              <Input
                placeholder="Comentarios adicionales sobre el cliente o su línea de crédito..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : mode === "create" ? (
              <UserPlus className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mode === "create" ? "Registrar Cliente" : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
