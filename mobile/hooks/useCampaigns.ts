// ─── TanStack Query hooks for campaigns ─────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as campaignService from "@/services/campaigns";
import type { CreateCampaignRequest, UpdateCampaignRequest } from "@/types";

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: campaignService.getCampaigns,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignRequest) =>
      campaignService.createCampaign(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignRequest }) =>
      campaignService.updateCampaign(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campaignService.deleteCampaign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}
