import * as fs from 'fs';
import * as path from 'path';
import { BRAND } from '@/core/design-system/brand/brand';
import { withAlpha } from '@/core/design-system/color';
import { PALETTE } from '@/core/design-system/palette';
import { TOKENS } from '@/core/design-system/tokens';
import { PREMIUM } from '@/core/design-system/premium';
import { GRADIENTS } from '@/core/design-system/gradients';
import { FONT_FAMILY } from '@/core/design-system/typography';
import { FONT_ASSETS } from '@/core/design-system/brand/fonts';

describe('design system brand layer', () => {
  it('withAlpha derives rgba from hex', () => {
    expect(withAlpha('#FF2D6F', 0.18)).toBe('rgba(255,45,111,0.18)');
    expect(withAlpha('#fff', 0.5)).toBe('rgba(255,255,255,0.5)');
  });

  it('palette resolves to brand primitives', () => {
    expect(PALETTE.dark.primary).toBe(BRAND.colors.primary);
    expect(PALETTE.dark.signal).toBe(BRAND.colors.signal);
    expect(PALETTE.light.mint).toBe(BRAND.colors.mint);
    expect(PALETTE.dark.bgGlow).toBe('rgba(255,45,111,0.18)');
    expect(PALETTE.dark.textSub).toBe('rgba(237,234,245,0.55)');
    expect(PALETTE.light.border).toBe('rgba(10,9,16,0.1)');
  });

  it('tokens resolve to brand primitives', () => {
    expect(TOKENS.color.primary).toBe(BRAND.colors.primary);
    expect(TOKENS.color.onPrimary).toBe(BRAND.colors.white);
    expect(TOKENS.status.accepted.fg).toBe(BRAND.colors.info);
    expect(TOKENS.status.pending.bg).toBe('rgba(255,176,32,0.14)');
    expect(TOKENS.onMedia.text).toBe(BRAND.colors.white);
    expect(TOKENS.scrim.strong).toBe('rgba(0,0,0,0.75)');
    expect(TOKENS.shadow.glow.shadowColor).toBe(BRAND.colors.signal);
  });

  it('premium resolves to brand primitives', () => {
    expect(PREMIUM.gold).toBe(BRAND.colors.premium.gold);
    expect(PREMIUM.goldLight).toBe('rgba(255,215,0,0.1)');
  });

  it('gradients use signal + primary and scrim tokens', () => {
    expect(GRADIENTS.brand).toEqual([BRAND.colors.signal, BRAND.colors.primary]);
    expect(GRADIENTS.overlayFadeDown[1]).toBe(TOKENS.scrim.strong);
    expect(GRADIENTS.overlayFadeUp[0]).toBe(TOKENS.scrim.light);
  });

  it('auth backdrop gradient wraps bg around the wine tint, glow fades out', () => {
    expect(PALETTE.dark.bgWine).toBe(BRAND.colors.dark.wine);
    expect(GRADIENTS.backdrop(PALETTE.dark)).toEqual([PALETTE.dark.bg, PALETTE.dark.bgWine, PALETTE.dark.bg]);
    expect(GRADIENTS.glow[0]).toBe('rgba(255,45,111,0.24)');
    expect(GRADIENTS.glow[2]).toBe('rgba(255,45,111,0)');
  });

  it('fonts derive from BRAND.fonts', () => {
    expect(FONT_FAMILY.heading).toBe(BRAND.fonts.heading);
    expect(Object.keys(FONT_ASSETS).sort()).toEqual(
      [BRAND.fonts.display, BRAND.fonts.heading, BRAND.fonts.headingMedium, BRAND.fonts.mono].sort(),
    );
  });

  it('has no raw color literals outside brand.ts', () => {
    const dir = path.resolve(__dirname, '../src/core/design-system');
    const files = ['palette.ts', 'tokens.ts', 'premium.ts', 'gradients.ts', 'typography.ts'];
    const raw = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      expect({ file: f, match: raw.exec(src)?.[0] ?? null }).toEqual({ file: f, match: null });
    }
  });
});
