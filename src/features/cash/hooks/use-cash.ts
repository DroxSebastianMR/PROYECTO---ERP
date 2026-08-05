import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cashService } from "@/features/cash/services/cash.service";

const KEY = ["cash"] as const;
export const useCash = () => {
  const client = useQueryClient();
  const current = useQuery({ queryKey: [...KEY, "current"], queryFn: cashService.getCurrent, refetchInterval: 30_000 });
  const registers = useQuery({ queryKey: [...KEY, "registers"], queryFn: cashService.getRegisters });
  const history = useQuery({ queryKey: [...KEY, "history"], queryFn: cashService.getHistory });
  const movements = useQuery({ queryKey: [...KEY, "movements"], queryFn: cashService.getMovements, refetchInterval: 30_000 });
  const refresh = () => {
    // La mutación responde de inmediato; React Query sincroniza los datos en segundo plano.
    void client.invalidateQueries({ queryKey: KEY });
    void client.invalidateQueries({ queryKey: ["sales"] });
  };
  const open = useMutation({ mutationFn: cashService.open, onSuccess: refresh });
  const count = useMutation({ mutationFn: cashService.count, onSuccess: refresh });
  const close = useMutation({ mutationFn: cashService.close, onSuccess: refresh });
  const createMovement = useMutation({ mutationFn: cashService.createMovement, onSuccess: refresh });
  return { current: current.data, registers: registers.data ?? [], history: history.data ?? [], movements: movements.data?.movements ?? [], isLoading: current.isLoading || registers.isLoading || movements.isLoading, isSaving: open.isPending || count.isPending || close.isPending || createMovement.isPending, open: open.mutateAsync, count: count.mutateAsync, close: close.mutateAsync, createMovement: createMovement.mutateAsync };
};
