import type { MokuFrame } from './renderer';

/**
 * Where Moku-san is framed, in px of the model's 1800×1338 illustration, and
 * the still of each framing in static/moku/ (rendered from the model at that
 * frame; render it again if the frame or the model changes).
 */

/** Head and shoulders, square: the chat panel's avatar. */
export const AVATAR_FRAME: MokuFrame = [540, 200, 1310, 970];
export const AVATAR_POSTER = '/moku/moku-avatar.png?v=1';

/** The whole bust with room on the left for the waving hand: the /moku stage. */
export const STAGE_FRAME: MokuFrame = [180, 90, 1640, 1338];
export const STAGE_POSTER = '/moku/moku-stage.webp?v=1';
