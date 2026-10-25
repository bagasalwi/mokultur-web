import { get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { isMokuExpression, stripExpressionTags, type MokuExpression } from './expressions';

/**
 * One conversation with Moku-san, shared by the chat widget and the /moku
 * page: both read these stores and send through sendChat(), so a chat started
 * in the corner carries on full screen. Kept in sessionStorage, as before, so
 * it ends with the tab.
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'mokultur_chat';

export const messages = writable<ChatMessage[]>([]);
export const busy = writable(false);
export const chatError = writable('');

let restored = false;

/** Loads the visit's conversation once; safe to call from every component that shows it. */
export function restoreChat() {
  if (restored || !browser) return;
  restored = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) messages.set(JSON.parse(raw));
  } catch {
    messages.set([]);
  }
}

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(get(messages).slice(-20)));
  } catch {
    // storage penuh atau diblokir — abaikan, chat tetap jalan
  }
}

export function resetChat() {
  messages.set([]);
  chatError.set('');
  persist();
}

/** What the caller's Moku does while a reply comes in. */
export type ChatHooks = {
  /** The question is out, nothing back yet. */
  onWaiting?: () => void;
  /** The reply's face, before its first words. */
  onExpression?: (name: MokuExpression) => void;
  /** Each time more of the reply arrives; `reply` is all of it so far. */
  onText?: (reply: string, first: boolean) => void;
  onDone?: (expression: MokuExpression, reply: string) => void;
  onError?: (message: string) => void;
};

export async function sendChat(text: string, hooks: ChatHooks = {}) {
  const content = text.trim();
  if (!content || get(busy)) return;

  chatError.set('');
  messages.update((list) => [...list, { role: 'user', content }, { role: 'assistant', content: '' }]);
  busy.set(true);
  persist();
  hooks.onWaiting?.();

  let expression: MokuExpression = 'netral';
  let first = true;
  const setReply = (reply: string) =>
    messages.update((list) => {
      list[list.length - 1] = { role: 'assistant', content: reply };
      return list;
    });

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: get(messages).slice(0, -1) }),
    });

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? 'Kebanyakan pesan, coba lagi nanti ya.');
    }
    if (!res.ok || !res.body) {
      throw new Error('Lagi ada gangguan. Coba lagi sebentar lagi ya.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let reply = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) throw new Error(parsed.error);
          if (isMokuExpression(parsed.expr)) {
            expression = parsed.expr;
            hooks.onExpression?.(expression);
          }
          if (parsed.delta) {
            reply += parsed.delta;
            setReply(reply);
            hooks.onText?.(stripExpressionTags(reply), first);
            first = false;
          }
        } catch (e) {
          if (e instanceof Error && e.message && !e.message.startsWith('Unexpected')) throw e;
        }
      }
    }

    reply = stripExpressionTags(reply).trim();
    if (!reply) {
      reply = 'Maaf, aku belum bisa menjawab yang itu. Coba tanya lagi dengan kalimat lain ya.';
      expression = 'berpikir';
    }
    setReply(reply);
    hooks.onDone?.(expression, reply);
  } catch (e) {
    messages.update((list) => list.slice(0, -1));
    const message = e instanceof Error ? e.message : 'Ada yang salah. Coba lagi ya.';
    chatError.set(message);
    hooks.onError?.(message);
  } finally {
    busy.set(false);
    persist();
  }
}
