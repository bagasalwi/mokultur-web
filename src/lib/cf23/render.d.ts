export type TemplateId = 'day1' | 'day2' | 'story';
export type Photo = { image: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number }; zoom: number; panX: number; panY: number };
export type DayData = { character: string; series: string; accent: string; photo: Photo | null };
/** `username: null` leaves the @handle line (and its hint) off the card. */
export type CardData = { name: string; username: string | null; days: Record<1 | 2, DayData> };
export type Slot = { day: 1 | 2; x: number; y: number; w: number; h: number; maxX: number; maxY: number };
export type Template = { id: TemplateId; label: string; width: number; height: number; days: (1 | 2)[] };

declare const CF23Render: {
  COLORS: Record<'plum' | 'violet' | 'lilac' | 'orange' | 'pink' | 'peach' | 'cream' | 'brown' | 'mauve', string>;
  EVENT: { name: string; venueShort: string; venue: string; venueFull: string; dateRange: string; hashtags: string; days: Record<1 | 2, { dow: string; date: string; month: string }> };
  TEMPLATES: Record<TemplateId, Template>;
  ACCENTS: { name: string; value: string }[];
  DEFAULT_ACCENT: Record<1 | 2, string>;
  BRAND: { logo: HTMLImageElement | null; url: string };
  render(ctx: CanvasRenderingContext2D, templateId: TemplateId, data: CardData, options?: { hints?: boolean }): { slots: Slot[] };
  loadFonts(): Promise<void>;
  loadBrand(src: string): Promise<void>;
  toBlob(templateId: TemplateId, data: CardData, type?: string): Promise<Blob>;
};
export default CF23Render;
