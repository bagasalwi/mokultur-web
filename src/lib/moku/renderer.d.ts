import type { MokuExpression } from '$lib/chat/expressions';

export type MokuClip = 'Wave' | 'Nod' | 'FingerHeart' | 'Blink' | 'Talk';
/** [x0, y0, x1, y1] in illustration px (the model's 1800×1338 canvas). */
export type MokuFrame = [number, number, number, number];

export declare const EXPRESSIONS: Record<MokuExpression, { eyes: string; brows: string; mouth: string; blush: string | null }>;

export declare class Moku {
  /** Where the head looks, -1..1 on each axis. */
  target: { set(x: number, y: number): void };
  setExpression(name: MokuExpression): void;
  play(name: MokuClip): void;
  /** Flaps the mouth for `seconds`. */
  talk(seconds: number): void;
  resize(): void;
  update(dt: number): void;
  dispose(): void;
}

export declare function loadMoku(canvas: HTMLCanvasElement, url: string, frame: MokuFrame): Promise<Moku>;
