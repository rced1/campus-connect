const { cached, invalidate } = require('./cache');

describe('cc/cache', () => {
  test('cached runs loader once for concurrent callers (memory fallback)', async () => {
    let runs = 0;
    const loader = async () => {
      runs += 1;
      await new Promise(r => setTimeout(r, 20));
      return { n: runs };
    };
    const key = `cc:test:${Date.now()}`;
    const [a, b] = await Promise.all([cached(key, 30, loader), cached(key, 30, loader)]);
    expect(a).toEqual(b);
    expect(runs).toBe(1);
    await invalidate(key);
  });

  test('cached returns stored value on second call', async () => {
    const key = `cc:test:second:${Date.now()}`;
    let runs = 0;
    const value = await cached(key, 30, async () => {
      runs += 1;
      return { ok: true };
    });
    const again = await cached(key, 30, async () => {
      runs += 1;
      return { ok: false };
    });
    expect(value).toEqual({ ok: true });
    expect(again).toEqual({ ok: true });
    expect(runs).toBe(1);
    await invalidate(key);
  });
});
