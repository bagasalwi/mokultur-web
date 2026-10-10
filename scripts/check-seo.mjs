import { chromium } from '/var/www/mokultur-elysia/node_modules/playwright-core/index.mjs';
import mysql from '/var/www/mokultur-elysia/node_modules/mysql2/promise.js';
import dotenv from '/var/www/mokultur-elysia/node_modules/dotenv/lib/main.js';
import assert from 'node:assert/strict';

dotenv.config({ path: '/var/www/mokultur-elysia/.env', quiet: true });
const origin = 'https://mokultur.com';
const pool = mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE, timezone: 'Z' });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const parse = async (xml) => page.evaluate((source) => {
    const doc = new DOMParser().parseFromString(source, 'application/xml');
    return { root: doc.documentElement.localName, error: !!doc.querySelector('parsererror'), locs: Array.from(doc.querySelectorAll('loc')).map((el) => el.textContent), lastmods: Array.from(doc.querySelectorAll('lastmod')).map((el) => el.textContent) };
  }, xml);
  const getXml = async (url) => {
    const response = await context.request.get(url);
    assert.equal(response.status(), 200, url);
    assert.match(response.headers()['content-type'], /application\/xml/);
    const doc = await parse(await response.text());
    assert.equal(doc.error, false, url); return doc;
  };
  const index = await getXml(`${origin}/sitemap.xml`);
  assert.equal(index.root, 'sitemapindex');
  assert.ok(index.locs.includes(`${origin}/sitemaps/pages.xml`));
  assert.ok(index.locs.includes(`${origin}/news-sitemap.xml`));
  const urls = [];
  for (const url of index.locs) {
    assert.equal(new URL(url).origin, origin);
    const doc = await getXml(url);
    assert.equal(doc.root, 'urlset');
    if (!url.endsWith('/news-sitemap.xml')) urls.push(...doc.locs);
    for (const lastmod of doc.lastmods) assert.ok(new Date(lastmod).getTime() <= Date.now() + 60000, `Future lastmod ${lastmod}`);
  }
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every((url) => !/^\/(?:anime|untuk-kamu|artikel-tersimpan|auth|api|dashboard|admin)(?:\/|$)/.test(new URL(url).pathname)));
  assert.ok(urls.every((url) => !new URL(url).search && !new URL(url).hash));
  const ids = urls.filter((url) => new URL(url).pathname.startsWith('/article/')).map((url) => Number(new URL(url).pathname.split('/')[2])).sort((a, b) => a - b);
  const [rows] = await pool.query("SELECT id FROM mm_post WHERE post_status = 'P' AND post_publish_date IS NOT NULL AND post_publish_date <= UTC_TIMESTAMP() ORDER BY id");
  assert.deepEqual(ids, rows.map((row) => Number(row.id)));
  console.log(`PASS sitemap index, valid XML, all ${ids.length} published articles, unique public URLs`);
  const robots = await context.request.get(process.env.CHECK_SEO_ORIGIN === '1' ? 'http://127.0.0.1:3002/robots.txt' : `${origin}/robots.txt`);
  const text = await robots.text();
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  assert.ok(lines.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.ok(lines.includes('Disallow: /artikel-tersimpan'), JSON.stringify(text));
  assert.equal((await context.request.get(`${origin}/sitemap-index.xml`, { maxRedirects: 0 })).status(), 308);
  assert.equal((await context.request.get(`${origin}/sitemaps/not-a-sitemap.xml`)).status(), 404);
  assert.equal((await context.request.get(`${origin}/sitemaps/articles-9999999.xml`)).status(), 404);
  console.log(`PASS robots directives${process.env.CHECK_SEO_ORIGIN === '1' ? ' at origin' : ''}, sitemap alias and missing sitemap status`);
  for (const [path, canonical, robotsValue] of [
    ['/index-article', `${origin}/index-article`, 'index, follow'],
    ['/index-article?page=2&utm_source=test', `${origin}/index-article?page=2`, 'index, follow'],
    ['/index-article?page=NaN', `${origin}/index-article`, 'index, follow'],
    ['/index-article?reviewOnly=true', `${origin}/index-article?reviewOnly=true`, 'noindex, follow'],
    ['/index-article?page=9999', `${origin}/index-article?page=9999`, 'noindex, follow'],
  ]) {
    await page.goto(origin + path);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical);
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), robotsValue);
    if (path.includes('page=2&')) assert.match(await page.title(), /Halaman 2/);
  }
  await page.goto(`${origin}/index-article?search=anime`);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
  const response = await page.goto(`${origin}/untuk-kamu`);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
  assert.match(response.headers()['cache-control'], /private, no-store/);
  await page.goto(origin);
  const favicon = await page.locator('link[rel="icon"]').getAttribute('href');
  assert.ok(favicon.includes('gallery_1776748617_android-chrome-512x512.webp'));
  const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
  const list = schema.map((item) => JSON.parse(item)).find((item) => item['@type'] === 'ItemList');
  assert.ok(list.itemListElement.every((item) => item.url.startsWith(`${origin}/article/`)));
  console.log('PASS canonical pagination, filtered noindex, private feed, dashboard favicon and absolute schema URLs');
} finally { await browser.close(); await pool.end(); }
