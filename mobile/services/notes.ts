// ─── Note API service ───────────────────────────────────────

import { api } from "./api";
import type { Note, CreateNoteRequest, UpdateNoteRequest } from "@/types";

export async function getNotes(campaignId: string): Promise<Note[]> {
  const res = await api.get<{ notes: Note[] }>(
    `/campaigns/${campaignId}/notes`
  );
  return res.notes;
}

export async function createNote(
  campaignId: string,
  data: CreateNoteRequest
): Promise<Note> {
  const res = await api.post<{ note: Note }>(
    `/campaigns/${campaignId}/notes`,
    data
  );
  return res.note;
}

export async function updateNote(
  id: string,
  data: UpdateNoteRequest
): Promise<Note> {
  const res = await api.patch<{ note: Note }>(`/notes/${id}`, data);
  return res.note;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`);
}
