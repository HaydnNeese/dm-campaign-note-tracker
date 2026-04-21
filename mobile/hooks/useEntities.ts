// ─── TanStack Query hooks for entities ───────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as entityService from "@/services/entities";
import type { CreateEntityRequest, UpdateEntityRequest } from "@/types";

export function useEntities(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["entities", campaignId],
    queryFn: () => entityService.getEntities(campaignId!),
    enabled: !!campaignId,
  });
}

export function useEntityDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["entity", id],
    queryFn: () => entityService.getEntity(id!),
    enabled: !!id,
  });
}

export function useCreateEntity(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEntityRequest) =>
      entityService.createEntity(campaignId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["entities", campaignId] }),
  });
}

export function useUpdateEntity(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntityRequest }) =>
      entityService.updateEntity(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["entities", campaignId] }),
  });
}

export function useDeleteEntity(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entityService.deleteEntity(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["entities", campaignId] }),
  });
}
