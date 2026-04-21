// ─── Session AI API service ─────────────────────────────────

import { api } from "./api";
import type { ProcessSessionResult, RecapResult } from "@/types";

export async function processSession(
  noteId: string
): Promise<ProcessSessionResult> {
  const res = await api.post<{ result: ProcessSessionResult }>(
    `/notes/${noteId}/process-session`,
    {}
  );
  return res.result;
}

export async function getProcessResult(
  noteId: string
): Promise<ProcessSessionResult | null> {
  const res = await api.get<{ result: ProcessSessionResult | null }>(
    `/notes/${noteId}/process-session`
  );
  return res.result;
}

export async function generateRecap(noteId: string): Promise<RecapResult> {
  const res = await api.post<{ recap: RecapResult }>(
    `/notes/${noteId}/generate-recap`,
    {}
  );
  return res.recap;
}

export async function getRecap(noteId: string): Promise<RecapResult | null> {
  const res = await api.get<{ recap: RecapResult | null }>(
    `/notes/${noteId}/recap`
  );
  return res.recap;
}
