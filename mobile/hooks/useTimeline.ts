// ─── TanStack Query hook for campaign timeline ─────────────

import { useQuery } from "@tanstack/react-query";
import { getCampaignTimeline } from "@/services/campaigns";

export function useTimeline(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["timeline", campaignId],
    queryFn: () => getCampaignTimeline(campaignId!),
    enabled: !!campaignId,
  });
}
