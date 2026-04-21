// ─── TanStack Query hooks for notes ─────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as noteService from "@/services/notes";
import type { CreateNoteRequest, UpdateNoteRequest } from "@/types";

export function useNotes(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["notes", campaignId],
    queryFn: () => noteService.getNotes(campaignId!),
    enabled: !!campaignId,
  });
}

export function useCreateNote(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNoteRequest) =>
      noteService.createNote(campaignId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notes", campaignId] }),
  });
}

export function useUpdateNote(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteRequest }) =>
      noteService.updateNote(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notes", campaignId] }),
  });
}

export function useDeleteNote(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noteService.deleteNote(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notes", campaignId] }),
  });
}
