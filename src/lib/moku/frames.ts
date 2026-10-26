import type { MokuFrame } from './renderer';

/**
 * Where Moku-san is framed, in px of the model's 1800×1338 illustration, and
 * the still of each framing in static/moku/ (rendered from the model at that
 * frame; render it again if the frame or the model changes).
 */

/** Head and shoulders, square (frame [540, 200, 1310, 970]): the small stills on /moku. */
export const AVATAR_POSTER = '/moku/moku-avatar.png?v=1';

/**
 * Head and shoulders, 3:4, for Moku-san rising over the rim of a circle: live
 * in the chat panel's header, and as the floating button's still (moku-fab.png).
 */
export const POPOUT_FRAME: MokuFrame = [470, 60, 1370, 1260];
export const POPOUT_POSTER = '/moku/moku-panel.webp?v=1';

/** The whole bust with room on the left for the waving hand: the /moku stage. */
export const STAGE_FRAME: MokuFrame = [180, 90, 1640, 1338];
export const STAGE_POSTER = '/moku/moku-stage.webp?v=1';
