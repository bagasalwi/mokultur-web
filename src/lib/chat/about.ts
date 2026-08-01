import { PUBLIC_API_URL } from '$env/static/public';

/**
 * Everything published on about.mokultur.com, flattened into prompt text.
 *
 * The about site is driven entirely by /api/about/* in mokultur-elysia, so the
 * chat reads the same source rather than duplicating any copy. All editorial
 * fields are bilingual objects ({ id, en }); only the Indonesian side is used.
 */

/** Bilingual field as served by the about API. */
type Localized = { id?: string; en?: string } | string | null | undefined;

function text(v: Localized): string {
  if (!v) return '';
  return (typeof v === 'string' ? v : (v.id ?? v.en ?? '')).trim();
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${PUBLIC_API_URL}/api/about/${path}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: T };
    return (body.data ?? null) as T | null;
  } catch {
    return null;
  }
}

interface Config {
  founded?: number;
  slogan?: string;
  seo?: { description?: string };
}

interface Hero {
  slogan?: Localized;
  subtext?: Localized;
}

interface AboutSection {
  headline?: Localized;
  body1?: Localized;
  body2?: Localized;
  focusItems?: { label?: Localized }[];
}

interface VisionMission {
  visionText?: Localized;
  missionText?: Localized;
}

interface ValueItem {
  title?: Localized;
  description?: Localized;
}

interface StatItem {
  value?: number;
  unit?: string;
  suffix?: string;
  label?: Localized;
  description?: Localized;
}

interface SubBrand {
  name?: string;
  category?: string;
  tagline?: Localized;
  description?: Localized;
  url?: string;
  platforms?: { name?: string; url?: string; followers?: string }[];
}

interface TeamMember {
  name?: string;
  role?: Localized;
  socials?: { platform?: string; url?: string }[];
}

interface Client {
  name?: string;
  industry?: string;
}

interface SocialLink {
  platform?: string;
  url?: string;
  handle?: string;
  followers?: string;
}

interface Pillar {
  title?: Localized;
  description?: Localized;
  platforms?: string[];
}

function statLine(s: StatItem): string {
  const value = `${s.value ?? ''}${s.unit ?? ''}${s.suffix ?? ''}`;
  const label = text(s.label);
  const desc = text(s.description);
  return `- ${label}: ${value}${desc ? ` (${desc})` : ''}`;
}

/** Compact prompt block covering the whole about site. */
export async function getAboutFacts(): Promise<string> {
  const [
    config,
    hero,
    about,
    vm,
    values,
    achievements,
    metrics,
    subBrands,
    team,
    clients,
    socials,
    pillars,
  ] = await Promise.all([
    get<Config>('config'),
    get<Hero>('hero'),
    get<AboutSection>('about-section'),
    get<VisionMission>('vision-mission'),
    get<ValueItem[]>('company-values'),
    get<StatItem[]>('achievements'),
    get<StatItem[]>('metrics'),
    get<SubBrand[]>('sub-brands'),
    get<TeamMember[]>('team'),
    get<Client[]>('clients'),
    get<SocialLink[]>('social-links'),
    get<Pillar[]>('content-pillars'),
  ]);

  const blocks: string[] = [];

  const profile = [
    config?.founded ? `Berdiri sejak: ${config.founded}` : '',
    config?.slogan ? `Slogan: ${config.slogan}` : '',
    text(hero?.slogan) ? `Positioning: ${text(hero?.slogan)}` : '',
    text(hero?.subtext),
    text(about?.headline),
    text(about?.body1),
    text(about?.body2),
    about?.focusItems?.length
      ? `Fokus konten: ${about.focusItems.map((f) => text(f.label)).filter(Boolean).join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  if (profile) blocks.push(`## Profil Mokultur (about.mokultur.com)\n${profile}`);

  if (text(vm?.visionText) || text(vm?.missionText)) {
    blocks.push(
      [
        '## Visi & Misi',
        text(vm?.visionText) ? `Visi: ${text(vm?.visionText)}` : '',
        text(vm?.missionText) ? `Misi: ${text(vm?.missionText)}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  if (values?.length) {
    blocks.push(
      '## Nilai perusahaan\n' +
        values.map((v) => `- ${text(v.title)}: ${text(v.description)}`).join('\n')
    );
  }

  if (achievements?.length || metrics?.length) {
    blocks.push(
      '## Pencapaian & metrik\n' +
        [...(achievements ?? []), ...(metrics ?? [])].map(statLine).join('\n')
    );
  }

  if (team?.length) {
    blocks.push(
      '## Tim / orang di balik layar\n' +
        team
          .map((m) => {
            const links = (m.socials ?? []).map((s) => s.url).filter(Boolean).join(', ');
            return `- ${m.name} — ${text(m.role)}${links ? ` (${links})` : ''}`;
          })
          .join('\n')
    );
  }

  if (subBrands?.length) {
    blocks.push(
      '## Sub-brand Mokultur\n' +
        subBrands
          .map((b) => {
            const platforms = (b.platforms ?? [])
              .map((p) => `${p.name}${p.followers ? ` ${p.followers}` : ''}`)
              .filter(Boolean)
              .join(', ');
            return [
              `- ${b.name}${b.url ? ` (${b.url})` : ''} — ${text(b.tagline)}`,
              text(b.description) ? `  ${text(b.description)}` : '',
              platforms ? `  Platform: ${platforms}` : '',
            ]
              .filter(Boolean)
              .join('\n');
          })
          .join('\n')
    );
  }

  if (pillars?.length) {
    blocks.push(
      '## Pilar konten\n' +
        pillars.map((p) => `- ${text(p.title)}: ${text(p.description)}`).join('\n')
    );
  }

  if (socials?.length) {
    blocks.push(
      '## Akun sosial media resmi\n' +
        socials
          .map(
            (s) =>
              `- ${s.platform}: ${s.handle ?? ''} ${s.url ?? ''}${s.followers ? ` — ${s.followers} pengikut` : ''}`
          )
          .join('\n')
    );
  }

  if (clients?.length) {
    const names = clients.map((c) => c.name).filter(Boolean);
    blocks.push(
      `## Klien & brand yang pernah bekerja sama (${names.length})\n${names.join(', ')}`
    );
  }

  return blocks.join('\n\n');
}
