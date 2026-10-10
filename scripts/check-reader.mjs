import { chromium } from '/var/www/mokultur-elysia/node_modules/playwright-core/index.mjs';
import mysql from '/var/www/mokultur-elysia/node_modules/mysql2/promise.js';
import dotenv from '/var/www/mokultur-elysia/node_modules/dotenv/lib/main.js';
import { SignJWT } from '/var/www/mokultur-elysia/node_modules/jose/dist/webapi/index.js';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import sharp from '/var/www/mokultur-elysia/node_modules/sharp/lib/index.js';

dotenv.config({ path: '/var/www/mokultur-elysia/.env', quiet: true });
const pool = mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE, timezone: 'Z' });
const origin = 'https://mokultur.com';
const review = '/var/www/mokultur-web/.impeccable/review';
let browser, userId, debugPage;
const checks = [], errors = [];
async function check(name, task) { await task(); checks.push(name); console.log(`PASS ${name}`); }
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const api = (page, path, method = 'GET', body) => page.evaluate(async ({ path, method, body }) => {
  const response = await fetch(`/api/reader/${path}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
}, { path, method, body });
async function capture(page, name) {
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((img) => img.loading = 'eager');
    await Promise.race([Promise.all(Array.from(document.images).map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); }))), new Promise((resolve) => setTimeout(resolve, 12000))]);
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).filter((img) => img.complete && img.naturalWidth > 0).map((img) => img.decode().catch(() => {})));
    scrollTo(0, 0);
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: `${review}/${name}.png`, fullPage: true });
}
async function captureHomeSection(page, name) {
  const bounds = await page.locator('.home-reader').evaluate((el) => { const r = el.getBoundingClientRect(); return { top: Math.floor(r.top + scrollY), height: Math.ceil(r.height) }; });
  const source = `${review}/home-${name}.png`;
  const metadata = await sharp(source).metadata();
  await sharp(source).extract({ left: 0, top: bounds.top, width: metadata.width, height: Math.min(bounds.height, metadata.height - bounds.top) }).toFile(`${review}/home-section-${name}.png`);
}

try {
  browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage(); debugPage = page;
  page.on('pageerror', (error) => errors.push(error.message));
  await check('guests are sent to the login modal; article save opens it in place', async () => {
    await page.goto(`${origin}/dashboard`);
    await page.waitForURL((u) => u.pathname === '/');
    assert.ok(await page.evaluate(() => document.querySelector('dialog.auth-modal')?.matches(':modal')));
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Hanya esensial', exact: true }).click();
    await page.locator('a[href^="/article/"]').first().click();
    await page.locator('.share-social-card .reader-save').click();
    assert.ok(await page.evaluate(() => document.querySelector('dialog.auth-modal')?.matches(':modal')));
    assert.ok(page.url().includes('/article/'));
  });
  const [user] = await pool.query("INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, 'user', 1)", ['Pembaca Uji', `reader-ui-${crypto.randomUUID()}@example.invalid`, crypto.randomUUID()]);
  userId = Number(user.insertId);
  const token = await new SignJWT({ name: 'Pembaca Uji', email: 'reader-ui@example.invalid', role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject(String(userId)).setIssuedAt().setExpirationTime('20m').sign(new TextEncoder().encode(process.env.JWT_SECRET));
  await context.addCookies([{ name: 'mokultur_token', value: token, domain: '.mokultur.com', path: '/', secure: true, httpOnly: true, sameSite: 'Lax' }]);
  await page.goto(`${origin}/dashboard`);
  await check('interests can be selected and changed', async () => {
    await page.getByRole('button', { name: 'Pilih minat', exact: true }).click();
    await page.getByLabel('Anime', { exact: true }).check(); await page.getByLabel('Game', { exact: true }).check();
    await page.getByRole('button', { name: 'Simpan minat', exact: true }).click();
    await page.getByText('Minat tersimpan. Bacaanmu sudah diperbarui.', { exact: true }).waitFor();
    assert.deepEqual((await api(page, 'interests')).body.data, ['anime', 'game']);
    await page.getByRole('button', { name: 'Ubah minat' }).click(); await page.getByLabel('Anime', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Simpan minat', exact: true }).click();
    await page.getByText('Minat tersimpan. Bacaanmu sudah diperbarui.', { exact: true }).waitFor();
    assert.deepEqual((await api(page, 'interests')).body.data, ['game']);
  });
  let article;
  await check('personal feed paginates without duplicate articles or save buttons', async () => {
    article = (await api(page, 'feed')).body.data.find((item) => item.format === 'article');
    await page.getByRole('button', { name: 'Bacaan berikutnya' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.reader-item').length === 40);
    assert.equal(new Set(await page.locator('.reader-item h2 a').evaluateAll((els) => els.map((el) => el.href))).size, 40);
    assert.equal(await page.locator('.reader-save, .reader-status-select, .reader-finish').count(), 0);
  });
  await check('general bookmark saves and removes while history remains independent', async () => {
    await page.goto(`${origin}/article/${article.id}/${article.slug}`);
    await page.locator('.share-social-card .reader-save').click();
    await page.locator('.share-social-card .reader-save[aria-pressed="true"]').waitFor();
    assert.equal(await page.locator('.reader-finish').count(), 0);
    await page.locator(`#reader-content-${article.id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(11000);
    const state = (await api(page, `articles/${article.id}`)).body.data;
    assert.ok(state.lastReadAt); assert.equal(state.status, undefined); assert.equal(state.progress, undefined);
    await page.goto(`${origin}/dashboard/tersimpan`); await page.locator('.reader-item').first().waitFor();
    assert.equal(await page.locator('.reader-item').count(), 1);
    assert.equal(await page.locator('.reader-filters, .reader-status-select').count(), 0);
    assert.equal(await page.getByText('Lanjutkan membaca', { exact: true }).count(), 0);
    await capture(page, 'saved-desktop');
    await page.locator('.reader-save').click();
    await page.getByRole('heading', { name: 'Simpan artikel favoritmu' }).waitFor();
    assert.equal((await api(page, 'saved')).body.meta.total, 0);
    assert.ok((await api(page, `articles/${article.id}`)).body.data.lastReadAt);
    await api(page, `articles/${article.id}/bookmark`, 'PUT');
  });
  await check('mobile feed, collection and interest editor match the site theme', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${origin}/dashboard/tersimpan`); await page.locator('.reader-item').first().waitFor();
    assert.ok(await overflow(page)); await capture(page, 'saved-mobile');
    await page.goto(`${origin}/dashboard`); await page.locator('.reader-item').first().waitFor();
    assert.ok(await overflow(page)); await capture(page, 'mobile');
    await page.getByRole('button', { name: 'Ubah minat' }).click();
    assert.ok(await overflow(page)); await capture(page, 'interests-mobile');
    const second = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await second.addCookies(await context.cookies()); const mobile = await second.newPage();
    await mobile.goto(`${origin}/dashboard/tersimpan`); assert.equal((await api(mobile, 'saved')).body.meta.total, 1);
    await second.close();
  });
  await check('homepage placement, no save buttons and all dashboard card variants', async () => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const variant of ['vertical', 'horizontal', 'magazine', 'minimal', 'compact-news', 'feature-tile', 'borderless-feed']) {
        await page.goto(`${origin}/?preview_card_style=${variant}&preview_latest_section_style=card-grid`);
        await page.locator('.home-pick__card').first().waitFor();
        assert.ok(await overflow(page), `${variant} overflow at ${width}`);
        assert.equal(await page.locator('.home-pick__card').count(), 4);
        assert.equal(await page.locator('.home-reader .reader-save').count(), 0);
      }
    }
    await page.goto(`${origin}/`);
    assert.equal(await page.locator('header a[href="/untuk-kamu"], .navbar a[href="/untuk-kamu"]').count(), 0);
    assert.ok(await page.evaluate(() => { const anime = document.querySelector('.home-anime-row'); return !anime || !!(document.querySelector('.home-reader').compareDocumentPosition(anime) & Node.DOCUMENT_POSITION_FOLLOWING); }));
    await capture(page, 'home-mobile'); await captureHomeSection(page, 'mobile');
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(`${origin}/`); assert.match(response.headers()['cache-control'], /private, no-store/);
    await capture(page, 'home-desktop'); await captureHomeSection(page, 'desktop');
    await page.goto(`${origin}/dashboard`); await capture(page, 'desktop');
    await page.setViewportSize({ width: 320, height: 740 });
    for (const path of ['/dashboard', '/dashboard/tersimpan', '/dashboard/riwayat']) { await page.goto(origin + path); assert.ok(await overflow(page)); }
  });
  await check('article layouts keep bookmark only, keyboard and session protection', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const variant of ['classic', 'immersive', 'editorial', 'clean']) {
      await page.goto(`${origin}/article/${article.id}/${article.slug}?preview_article_detail_style=${variant}`);
      assert.ok(await page.locator('.share-social-card .reader-save').isVisible());
      assert.equal(await page.locator('.reader-finish').count(), 0); assert.ok(await overflow(page));
    }
    await capture(page, 'article-mobile');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${origin}/article/${article.id}/${article.slug}`); await capture(page, 'article-desktop');
    await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => document.activeElement?.tagName !== 'BODY'));
    assert.equal((await api(page, 'saved')).cache, 'private, no-store');
    await context.clearCookies(); assert.equal((await api(page, 'saved')).status, 401);
    await page.goto(`${origin}/dashboard/tersimpan`); await page.waitForURL((u) => u.pathname === '/');
    assert.ok(await page.evaluate(() => document.querySelector('dialog.auth-modal')?.matches(':modal')));
  });
  assert.deepEqual(errors, []);
  writeFileSync('/tmp/mokultur-reader-ui-results.json', JSON.stringify({ checks, errors, screenshotDirectory: review }, null, 2));
  console.log(`PASS ${checks.length} browser scenarios; no page errors`);
} catch (error) {
  console.log('Browser errors:', JSON.stringify(errors));
  if (debugPage) await debugPage.screenshot({ path: `${review}/debug.png`, fullPage: true });
  throw error;
} finally {
  if (browser) await browser.close();
  if (userId) await pool.query('DELETE FROM users WHERE id = ?', [userId]);
  await pool.end();
}
