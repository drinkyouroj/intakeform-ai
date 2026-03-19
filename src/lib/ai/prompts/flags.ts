export interface FlagPromptInput {
  sessionTranscript: string
}

export function buildFlagPrompt(input: FlagPromptInput): string {
  return `Analyze this intake session for risk factors, complexity indicators, and urgency signals.

<session_transcript>
${input.sessionTranscript}
</session_transcript>

Identify flags that the provider should be aware of before their first call.

Return ONLY valid JSON:
{
  "flags": [
    {"label": "flag name", "severity": "risk|complexity|info", "evidence": "specific evidence from the transcript"}
  ]
}

Severity levels:
- "risk": safety concerns, legal liability, crisis indicators
- "complexity": multi-faceted issues, conflicting needs, unusual circumstances
- "info": relevant background that doesn't fit other categories

Only include flags with clear evidence. Do not speculate.`
}
