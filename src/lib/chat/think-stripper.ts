/**
 * Removes <think>…</think> blocks from a token stream.
 *
 * In streaming mode this model does not expose reasoning via a separate
 * `reasoning_content` field — it inlines it in `content` wrapped in <think>
 * tags, and the tags straddle chunk boundaries:
 *
 *   chunk 1: {"delta":{"content":"<think>\nThe user"}}
 *   chunk 2: {"delta":{"content":" is asking…\n</think>\n\nBerikut…"}}
 *
 * So a naive per-chunk `replace()` leaks the model's English reasoning to the
 * visitor. This buffers just enough to recognise a tag split across chunks.
 */
export function createThinkStripper() {
  const OPEN = '<think>';
  const CLOSE = '</think>';

  let buf = '';
  let inThink = false;

  /** Longest suffix of `s` that is a proper prefix of `tag` (a possibly-truncated tag). */
  function partialTailLength(s: string, tag: string): number {
    const max = Math.min(s.length, tag.length - 1);
    for (let n = max; n > 0; n--) {
      if (s.endsWith(tag.slice(0, n))) return n;
    }
    return 0;
  }

  return {
    push(chunk: string): string {
      buf += chunk;
      let out = '';

      for (;;) {
        if (!inThink) {
          const i = buf.indexOf(OPEN);
          if (i === -1) {
            const keep = partialTailLength(buf, OPEN);
            out += buf.slice(0, buf.length - keep);
            buf = buf.slice(buf.length - keep);
            break;
          }
          out += buf.slice(0, i);
          buf = buf.slice(i + OPEN.length);
          inThink = true;
        } else {
          const i = buf.indexOf(CLOSE);
          if (i === -1) {
            buf = buf.slice(buf.length - partialTailLength(buf, CLOSE));
            break;
          }
          buf = buf.slice(i + CLOSE.length);
          inThink = false;
        }
      }

      return out;
    },

    /** Emit whatever is left once the upstream stream ends. */
    flush(): string {
      const rest = inThink ? '' : buf;
      buf = '';
      return rest;
    },
  };
}
