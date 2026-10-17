import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const root = new URL('../public/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('every content/instagram.json entry points to a page that exists', async () => {
  const posts = await read('../content/instagram.json');
  const watches = await read('../content/watches.json');
  assert.ok(posts.length > 0);
  for (const post of posts) {
    assert.match(post.date, /^\d{4}-\d{2}(-\d{2})?$/);
    assert.ok(post.title.trim());
    assert.ok(Array.isArray(post.slugs) && post.slugs.length > 0, post.title);
    for (const slug of post.slugs) {
      const dir = watches.some(w => w.slug === slug) ? 'watches' : 'compare';
      await access(new URL(`${dir}/${slug}/index.html`, root));
    }
  }
});

test('landing page links each entry to its guide, is noindex and has tagged Amazon buttons', async () => {
  const posts = await read('../content/instagram.json');
  const html = await readFile(new URL('from-instagram/index.html', root), 'utf8');
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /<h1>From our <em>Instagram<\/em><\/h1>/);
  assert.ok(html.includes('As an Amazon Associate I earn from qualifying purchases'));
  assert.equal((html.match(/<article class="card">/g) || []).length, posts.length);
  const order = posts.map(p => html.indexOf(`>${p.title}</a>`));
  assert.ok(order.every(i => i > 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'posts keep file order');
  const buttons = [...html.matchAll(/<a\b[^>]*data-placement="instagram_landing"[^>]*>/g)].map(m => m[0]);
  assert.ok(buttons.length >= posts.length);
  for (const tag of buttons) {
    assert.match(tag, /rel="sponsored nofollow noopener"/);
    assert.match(tag, /tag=straubmediagr-20/);
  }
  assert.doesNotMatch(html, /\$\d|% OFF|deal/i);
  const sitemap = await readFile(new URL('sitemap.xml', root), 'utf8');
  assert.ok(!sitemap.includes('from-instagram'));
});
