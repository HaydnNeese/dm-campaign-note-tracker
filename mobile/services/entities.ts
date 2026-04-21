// ─── Entity API service ─────────────────────────────────────

import { api } from "./api";
import type {
  Entity,
  EntityDetail,
  CreateEntityRequest,
  UpdateEntityRequest,
} from "@/types";

export async function getEntities(campaignId: string): Promise<Entity[]> {
  const res = await api.get<{ entities: Entity[] }>(
    `/campaigns/${campaignId}/entities`
  );
  return res.entities;
}

export async function getEntity(id: string): Promise<EntityDetail> {
  const res = await api.get<{ entity: EntityDetail }>(
    `/campaigns/entities/${id}`
  );
  return res.entity;
}

export async function createEntity(
  campaignId: string,
  data: CreateEntityRequest
): Promise<Entity> {
  const res = await api.post<{ entity: Entity }>(
    `/campaigns/${campaignId}/entities`,
    data
  );
  return res.entity;
}

export async function updateEntity(
  id: string,
  data: UpdateEntityRequest
): Promise<Entity> {
  const res = await api.patch<{ entity: Entity }>(`/campaigns/entities/${id}`, data);
  return res.entity;
}

export async function deleteEntity(id: string): Promise<void> {
  await api.delete(`/campaigns/entities/${id}`);
}
