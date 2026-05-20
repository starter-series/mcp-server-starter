import { z } from 'zod';
import { ok } from '../helpers.js';

export const name = 'greet';

export const config = {
  title: 'Greet',
  description: 'Greet someone by name',
  inputSchema: {
    name: z.string().min(1).max(200).describe('Name to greet'),
  },
  outputSchema: {
    greeting: z.string().describe('The rendered greeting'),
    language: z.literal('en').describe('Language code of the greeting'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export async function handler({ name }: { name: string }) {
  const greeting = `Hello, ${name}!`;
  return ok(greeting, { greeting, language: 'en' });
}
