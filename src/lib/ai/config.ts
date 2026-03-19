export function getAIModels() {
  return {
    followUp: process.env.AI_MODEL_FOLLOWUP ?? 'groq/llama-3.3-70b-versatile',
    brief: process.env.AI_MODEL_BRIEF ?? 'groq/llama-3.3-70b-versatile',
    flags: process.env.AI_MODEL_FLAGS ?? 'groq/llama-3.3-70b-versatile',
  } as const
}
