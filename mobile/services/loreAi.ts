import { api } from "./api";

export async function generateName(type: string, summary?: string): Promise<string> {
  const res = await api.post<{ name: string }>("/ai/lore/name", { type, summary });
  return res.name;
}

export async function generateDetails(name: string, type: string, summary?: string, taggedEntityIds?: string[]): Promise<string> {
  const res = await api.post<{ details: string }>("/ai/lore/details", { name, type, summary, taggedEntityIds });
  return res.details;
}

export async function optimizeDetails(text: string): Promise<string> {
  const res = await api.post<{ optimizedText: string }>("/ai/lore/optimize", { text });
  return res.optimizedText;
}

export async function analyzeContent(campaignId: string, title: string, content: string): Promise<any> {
  const res = await api.post<{ result: any }>("/ai/lore/analyze", { campaignId, title, content });
  return res.result;
}
