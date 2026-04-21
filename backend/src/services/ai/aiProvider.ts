// ─── AI Provider abstraction ────────────────────────────────
// Generic interface so the AI layer is completely swappable.
// Implementations: OpenAI, Anthropic, local, etc.

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  /** If true, expect the model to return valid JSON */
  jsonMode?: boolean;
}

export interface AiProvider {
  /** Send messages and get a text completion back */
  complete(options: AiCompletionOptions): Promise<string>;
}

// ─── OpenAI-compatible provider ─────────────────────────────
// Works with OpenAI, Azure OpenAI, and any compatible API.

export class OpenAiProvider implements AiProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  }) {
    this.apiKey = config?.apiKey || process.env.OPENAI_API_KEY || "";
    this.baseUrl = config?.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    this.model = config?.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!this.apiKey) {
      console.warn(
        "⚠️  No OPENAI_API_KEY set. AI features will fail at runtime."
      );
    }
  }

  async complete(options: AiCompletionOptions): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2048,
    };

    if (options.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI provider error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}

// ─── Factory ────────────────────────────────────────────────
// Single place to swap providers.

let _provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (!_provider) {
    _provider = new OpenAiProvider();
  }
  return _provider;
}

/** Override provider (useful for testing or switching vendors) */
export function setAiProvider(provider: AiProvider): void {
  _provider = provider;
}
