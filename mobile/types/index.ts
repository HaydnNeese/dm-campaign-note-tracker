// ─── Shared types matching backend models ───────────────────

export interface User {
  id: string;
  email: string;
  isPremium: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type EntityType = "NPC" | "LOCATION" | "ITEM" | "QUEST" | "FACTION" | "KEY_EVENT";

export interface EntityMention {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  startIndex: number;
  endIndex: number;
  displayText: string;
  createdAt: string;
}

export interface Entity {
  id: string;
  campaignId: string;
  name: string;
  type: EntityType;
  summary: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  entityMentions: EntityMention[];
}

// Extended entity with "mentioned in" data from GET /entities/:id
export interface EntityDetail extends Entity {
  mentionedInNotes: {
    noteId: string;
    noteTitle: string;
    noteUpdatedAt: string;
  }[];
  mentionedInEntities: {
    entityId: string;
    entityName: string;
    entityType: EntityType;
  }[];
}

export interface NoteEntityMention {
  id: string;
  noteId: string;
  entityId: string;
  startIndex: number;
  endIndex: number;
  displayText: string;
  createdAt: string;
  entity?: {
    id: string;
    name: string;
    type: EntityType;
  };
}

export interface Note {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  mentions: NoteEntityMention[];
}

// ─── API request types ──────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
}

export interface EntityMentionInput {
  targetEntityId: string;
  startIndex: number;
  endIndex: number;
  displayText: string;
}

export interface CreateEntityRequest {
  name: string;
  type: EntityType;
  summary?: string;
  content?: string;
  imageUrl?: string | null;
  mentions?: EntityMentionInput[];
}

export interface UpdateEntityRequest {
  name?: string;
  type?: EntityType;
  summary?: string;
  content?: string;
  imageUrl?: string | null;
  mentions?: EntityMentionInput[];
}

export interface MentionInput {
  entityId: string;
  startIndex: number;
  endIndex: number;
  displayText: string;
}

export interface CreateNoteRequest {
  title: string;
  content?: string;
  mentions?: MentionInput[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  mentions?: MentionInput[];
}

// ─── Campaign Timeline types ────────────────────────────────

export interface TimelineNpcAppearance {
  entityId: string;
  name: string;
}

export interface CampaignTimelineItem {
  noteId: string;
  noteTitle: string;
  createdAt: string;
  summary: string | null;
  majorEvents: string[];
  npcAppearances: TimelineNpcAppearance[];
}

// ─── AI Feature types ───────────────────────────────────────

export interface ExtractedEntity {
  name: string;
  mentionText: string;
  matchedEntityId: string | null;
  entityType: EntityType;
  isNewSuggestion: boolean;
}

export interface QuestUpdate {
  title: string;
  status: "new_hook" | "progressed" | "completed" | "changed";
  details: string;
}

export interface ProcessSessionResult {
  id: string;
  noteId: string;
  summary: string;
  extractedEntities: ExtractedEntity[];
  questUpdates: QuestUpdate[];
  createdAt: string;
}

export interface RecapResult {
  id: string;
  noteId: string;
  content: string;
  createdAt: string;
}
