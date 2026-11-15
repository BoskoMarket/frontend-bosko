const load = (url?: string) => {
  const prev = process.env.EXPO_PUBLIC_API_URL;
  if (url === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = url;
  try {
    let mod: typeof import('@/core/config/env') | undefined;
    jest.isolateModules(() => {
      mod = require('@/core/config/env');
    });
    return mod!;
  } finally {
    process.env.EXPO_PUBLIC_API_URL = prev;
  }
};

describe('EXPO_PUBLIC_API_URL', () => {
  it('accepts a /api/v1 URL, with or without a trailing slash', () => {
    expect(load('https://api.example.test/api/v1').API_URL).toBe('https://api.example.test/api/v1');
    expect(load('https://api.example.test/api/v1/').API_URL).toBe('https://api.example.test/api/v1');
  });

  it.each(['https://api.example.test', 'https://api.example.test/api', 'https://api.example.test/api/v2'])(
    'rejects %s',
    (url) => expect(() => load(url)).toThrow('/api/v1'),
  );

  it('still rejects a missing or non-HTTP value', () => {
    expect(() => load(undefined)).toThrow('URL HTTP válida');
    expect(() => load('ftp://x/api/v1')).toThrow('URL HTTP válida');
  });
});
