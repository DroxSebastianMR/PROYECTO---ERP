import { Check, Package, Tag, Warehouse } from "lucide-react";

type ProductFormStep = 1 | 2 | 3;

interface ProductFormStepperProps {
  activeStep: ProductFormStep;
  onStepChange: (step: ProductFormStep) => void;
}

const steps = [
  { id: 1 as const, name: "General e imagen", icon: Package },
  { id: 2 as const, name: "Precios", icon: Tag },
  { id: 3 as const, name: "Inventario y medidas", icon: Warehouse },
];

export const ProductFormStepper = ({ activeStep, onStepChange }: ProductFormStepperProps) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-1.5">
    <div className="grid grid-cols-3 gap-1.5">
      {steps.map((step) => {
        const Icon = step.icon;
        const isActive = activeStep === step.id;
        const isCompleted = activeStep > step.id;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepChange(step.id)}
            className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all ${
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : isCompleted
                  ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${isActive ? "bg-white text-blue-700" : isCompleted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
            </span>
            <Icon className="hidden h-3.5 w-3.5 sm:block" />
            <span className="hidden lg:inline">{step.name}</span>
          </button>
        );
      })}
    </div>
  </div>
);
