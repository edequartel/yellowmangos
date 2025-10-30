// api/lib/openai.ts
export const OPENAI_BASE = "https://api.openai.com/v1";

export const headers = (key: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${key}`,
  "OpenAI-Beta": "assistants=v2",
});

export const okOrThrow = async (res: Response) => {
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${err}`);
  }
};
