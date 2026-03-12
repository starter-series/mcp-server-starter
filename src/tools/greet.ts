import { z } from 'zod';

export const name = 'greet';
export const description = 'Greet someone by name';

export const schema = {
  name: z.string().describe('Name to greet'),
};

export async function handler({ name }: { name: string }) {
  return {
    content: [{ type: 'text' as const, text: `Hello, ${name}!` }],
  };
}
