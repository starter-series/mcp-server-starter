import packageJson from '../package.json' with { type: 'json' };

export const { name, version } = packageJson as { name: string; version: string };
