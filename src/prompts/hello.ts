import { z } from 'zod';

export const name = 'hello';
export const description = 'Generate a friendly greeting message';

export const schema = {
  language: z.enum(['en', 'ko', 'ja']).optional().describe('Greeting language. Defaults to English.'),
};

// Narrow `Record` (instead of `Record<string, string>`) so `noUncheckedIndexedAccess`
// recognises every key as defined — `greetings[lang]` is always a string.
const greetings = {
  en: 'Write a friendly greeting.',
  ko: '친근한 인사말을 작성해주세요.',
  ja: 'フレンドリーな挨拶を書いてください。',
} as const satisfies Record<'en' | 'ko' | 'ja', string>;

export function handler({ language }: { language?: 'en' | 'ko' | 'ja' }) {
  const lang: 'en' | 'ko' | 'ja' = language ?? 'en';
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
