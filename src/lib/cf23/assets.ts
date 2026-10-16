import CF23Render from './render.js';

/**
 * Fonts for the CF23 card, loaded only where the card is
 * used. The faces are self-hosted (static/fonts) and registered through the
 * FontFace API, so no other page pays for them and no request goes to Google.
 */
let ready: Promise<void> | null = null;

export function loadCf23Assets(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  ready ??= (async () => {
    const faces = [
      new FontFace('Lilita One', 'url(/fonts/LilitaOne.woff2?v=1) format("woff2")', { weight: '400', display: 'swap' }),
      new FontFace('Baloo 2', 'url(/fonts/Baloo2.woff2?v=1) format("woff2")', { weight: '400 800', display: 'swap' }),
    ];
    await Promise.all([
      ...faces.map((face) => face.load().then((loaded) => { document.fonts.add(loaded); }).catch(() => undefined)),
    ]);
    await CF23Render.loadFonts();
  })();
  return ready;
}

/** Event window: the homepage card stays up until a week after Day 2. */
export const CF23_PROMO_UNTIL = Date.parse('2026-11-08T00:00:00+07:00');
