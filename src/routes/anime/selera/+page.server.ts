import type { PageServerLoad } from './$types';
import { getAnimeTaste, type TasteAnswers } from '$lib/api';

const AXES = ['mood', 'pace', 'world', 'heart', 'stakes', 'humor', 'fame', 'length', 'era'] as const;

function readAnswer(value: string | null): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-1, Math.min(1, Math.round(n)));
}

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  // A result is a function of its query string and nothing else, so it is safe
  // to cache — and sharing a result link is the point of the feature.
  setHeaders({ 'cache-control': 'public, max-age=600, stale-while-revalidate=3600' });

  const answered = AXES.some((a) => url.searchParams.has(a));

  if (!answered) return { answered: false, result: null };

  const answers = Object.fromEntries(
    AXES.map((a) => [a, readAnswer(url.searchParams.get(a))])
  ) as TasteAnswers;

  const res = await getAnimeTaste(answers).catch(() => null);

  if (!res) return { answered: false, result: null };

  return {
    answered: true,
    result: { profile: res.profile, anime: res.data, answers: res.answers },
  };
};
