import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Edit3, Layers3, Plus, Power, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { httpClient } from "@/lib/api/http-client";

type MasterType = "categories" | "measurement-units";
type RecordItem = {
  id: string;
  name: string;
  code?: string | null;
  abbreviation?: string | null;
  isActive: boolean;
  createdAt: string;
};

const copy = {
  categories: {
    title: "Categorías",
    singular: "categoría",
    codeLabel: "Código de categoría",
    description: "Organiza el catálogo y mantén la clasificación disponible para nuevos productos.",
    icon: Layers3,
  },
  "measurement-units": {
    title: "Unidades de medida",
    singular: "unidad de medida",
    codeLabel: "Código interno",
    description: "Administra las unidades disponibles para registrar y operar los productos.",
    icon: Ruler,
  },
} as const;

export const CatalogMasterTab = ({ type }: { type: MasterType }) => {
  const queryClient = useQueryClient();
  const base = `/products/${type}`;
  const queryKey = ["catalog-master", type];
  const meta = copy[type];
  const Icon = meta.icon;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecordItem | null>(null);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");

  const query = useQuery({
    queryKey,
    queryFn: () => httpClient<RecordItem[]>(base),
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setName("");
    setAbbreviation("");
  };

  const save = useMutation({
    mutationFn: (input: { id?: string; name: string; abbreviation?: string; isActive?: boolean }) => {
      if (input.id) {
        return httpClient(`${base}/${input.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: input.name,
            ...(type === "measurement-units" ? { code: input.abbreviation } : {}),
            ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
          }),
        });
      }
      return httpClient(base, {
        method: "POST",
        body: JSON.stringify(
          type === "categories"
            ? { name: input.name }
            : { name: input.name, code: input.abbreviation },
        ),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      closeForm();
    },
  });

  const openCreate = () => {
    setEditingItem(null);
    setName("");
    setAbbreviation("");
    setIsFormOpen(true);
  };

  const openEdit = (item: RecordItem) => {
    setEditingItem(item);
    setName(item.name);
    setAbbreviation(item.abbreviation ?? "");
    setIsFormOpen(true);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedAbbreviation = abbreviation.trim();
    if (!trimmedName || (type === "measurement-units" && !trimmedAbbreviation)) return;
    save.mutate({
      id: editingItem?.id,
      name: trimmedName,
      abbreviation: type === "measurement-units" ? trimmedAbbreviation : undefined,
    });
  };

  const toggleStatus = (item: RecordItem) => {
    save.mutate({
      id: item.id,
      name: item.name,
      abbreviation: item.abbreviation ?? undefined,
      isActive: !item.isActive,
    });
  };

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span>
            <div>
              <h2 className="font-bold text-slate-900">{meta.title}</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">{meta.description}</p>
            </div>
          </div>
          <Button onClick={openCreate} className="gap-2 self-start sm:self-auto"><Plus className="h-4 w-4" /> Nueva {meta.singular}</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{meta.codeLabel}</th>
                <th className="px-5 py-3.5">Nombre</th>
                {type === "measurement-units" && <th className="px-5 py-3.5">Abreviatura</th>}
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5">Fecha de creación</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(query.data ?? []).map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4"><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">{item.code ?? "—"}</span></td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{item.name}</td>
                  {type === "measurement-units" && <td className="px-5 py-4 font-medium text-slate-600">{item.abbreviation ?? "—"}</td>}
                  <td className="px-5 py-4"><span className={item.isActive ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"}>{item.isActive ? "Activo" : "Inactivo"}</span></td>
                  <td className="px-5 py-4 text-slate-500">{new Date(item.createdAt).toLocaleDateString("es-PE")}</td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => openEdit(item)} aria-label={`Editar ${item.name}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => toggleStatus(item)} aria-label={`${item.isActive ? "Desactivar" : "Activar"} ${item.name}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"><Power className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
              {!query.isLoading && !query.data?.length && <tr><td colSpan={type === "measurement-units" ? 6 : 5} className="px-5 py-12 text-center text-slate-500">Aún no hay registros. Crea el primero para empezar.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingItem ? `Editar ${meta.singular}` : `Nueva ${meta.singular}`}
        description={editingItem ? "Actualiza la información manteniendo la trazabilidad del catálogo." : "Registra la información. El código interno se asignará automáticamente."}
        maxWidth="md"
        headerClassName="bg-gradient-to-r from-blue-700 to-indigo-700"
        titleClassName="text-white"
        descriptionClassName="text-blue-100"
        headerIcon={<span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white"><Icon className="h-5 w-5" /></span>}
      >
        <form onSubmit={submit} className="space-y-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><p className="text-sm leading-6 text-slate-600">{editingItem ? "Los productos ya relacionados conservarán su vínculo al actualizar este dato maestro." : `El sistema generará automáticamente el ${meta.codeLabel.toLowerCase()} al guardar.`}</p></div>
          </div>
          <label className="block space-y-2"><span className="text-sm font-semibold text-slate-700">Nombre <span className="text-red-500">*</span></span><Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={type === "categories" ? "Ej. Bebidas" : "Ej. Unidad"} disabled={save.isPending} /></label>
          {type === "measurement-units" && <label className="block space-y-2"><span className="text-sm font-semibold text-slate-700">Abreviatura <span className="text-red-500">*</span></span><Input value={abbreviation} onChange={(event) => setAbbreviation(event.target.value.toUpperCase())} placeholder="Ej. UND, KG, CAJ" maxLength={12} disabled={save.isPending} /></label>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="ghost" onClick={closeForm} disabled={save.isPending}>Cancelar</Button><Button type="submit" disabled={save.isPending || !name.trim() || (type === "measurement-units" && !abbreviation.trim())}>{save.isPending ? "Guardando..." : editingItem ? "Guardar cambios" : `Crear ${meta.singular}`}</Button></div>
        </form>
      </Dialog>
    </>
  );
};
