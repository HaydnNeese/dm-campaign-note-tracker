// ─── Campaign API service ───────────────────────────────────

import { api } from "./api";
import type {
  Campaign,
  CampaignTimelineItem,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from "@/types";

export async function getCampaigns(): Promise<Campaign[]> {
  const res = await api.get<{ campaigns: Campaign[] }>("/campaigns");
  return res.campaigns;
}

export async function createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
  const res = await api.post<{ campaign: Campaign }>("/campaigns", data);
  return res.campaign;
}

export async function updateCampaign(
  id: string,
  data: UpdateCampaignRequest
): Promise<Campaign> {
  const res = await api.patch<{ campaign: Campaign }>(`/campaigns/${id}`, data);
  return res.campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  await api.delete(`/campaigns/${id}`);
}

// ─── Timeline ───────────────────────────────────────────────

export async function getCampaignTimeline(
  campaignId: string
): Promise<CampaignTimelineItem[]> {
  const res = await api.get<{ timeline: CampaignTimelineItem[] }>(
    `/campaigns/${campaignId}/timeline`
  );
  return res.timeline;
}

