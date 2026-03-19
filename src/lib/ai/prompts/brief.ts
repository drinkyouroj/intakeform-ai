export interface BriefPromptInput {
  providerType: string
  sessionTranscript: string
}

export function buildBriefPrompt(input: BriefPromptInput): string {
  return `You are preparing a pre-read brief for a ${input.providerType} before their first call with a new client.

Here is the complete intake session transcript:
<session_transcript>
${input.sessionTranscript}
</session_transcript>

Write a structured brief. Be concise and actionable. Do not reproduce the client's full name or contact details verbatim — refer to them as "the client."

Return ONLY valid JSON matching this structure:
{
  "situationSummary": "2-3 sentence synthesis of the client's core situation",
  "keyFlags": [
    {"label": "flag name", "severity": "risk|complexity|info", "evidence": "evidence from intake"}
  ],
  "firstCallQuestions": ["specific question 1", "specific question 2"],
  "backgroundContext": "relevant background the provider should know"
}

Include 2-5 flags (omit if none found). Include 3-5 first-call questions.`
}
