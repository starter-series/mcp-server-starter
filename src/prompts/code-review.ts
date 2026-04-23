/**
 * Example MCP Prompt — templated code review prompt with Zod-validated arguments.
 * Prompts are reusable, parameterized message templates the client can surface to
 * the user or feed to the model. Use `registerPrompt` (v1.29+) for the config-object
 * API with title/description/argsSchema.
 */
import { z } from 'zod';

export const name = 'code-review';
export const title = 'Code Review';
export const description = 'Ask the model to review a snippet of code in the given language.';

export const argsSchema = {
  language: z
    .enum(['js', 'ts', 'python', 'go'])
    .describe('Programming language of the snippet.'),
  code: z.string().min(1).describe('Source code to review (non-empty).'),
};

const languageLabel: Record<'js' | 'ts' | 'python' | 'go', string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  python: 'Python',
  go: 'Go',
};

export function handler({
  language,
  code,
}: {
  language: 'js' | 'ts' | 'python' | 'go';
  code: string;
}) {
  const label = languageLabel[language];
  return {
    description,
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Review this ${label} code for bugs, readability, and idiomatic style. Be specific and actionable.\n\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      },
    ],
  };
}
