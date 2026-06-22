import { z } from 'zod';

const LANGS = ['en', 'ko', 'ja'] as const;
type Lang = (typeof LANGS)[number];

export const name = 'hello';
export const title = 'Hello';
export const description = 'Generate a friendly greeting message';

export const argsSchema = {
  language: z.enum(LANGS).optional().describe('Greeting language. Defaults to English.'),
};

export const schema = argsSchema;

// `satisfies` (not `Record<string, string>`) keeps key narrowing under noUncheckedIndexedAccess.
const greetings = {
  en: 'Write a friendly greeting.',
  ko: '친근한 인사말을 작성해주세요.',
  ja: 'フレンドリーな挨拶を書いてください。',
} as const satisfies Record<Lang, string>;

export function handler({ language }: { language?: Lang }) {
  const lang: Lang = language ?? 'en';
  return {
    description,
    messages: [
      {
        role: 'user' as const,
        content: { type: 'text' as const, text: greetings[lang] },
      },
    ],
  };
}
