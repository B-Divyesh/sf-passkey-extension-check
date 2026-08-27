import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pages = ['site/index.html', 'site/privacy/index.html', 'site/terms/index.html'];

describe('static page accessibility contracts', () => {
  for (const page of pages) {
    it(`${page} has one h1 and required landmarks`, () => {
      const html = readFileSync(page, 'utf8');
      expect((html.match(/<h1[ >]/g) ?? []).length).toBe(1);
      expect(html).toMatch(/<html lang="en">/);
      expect(html).toMatch(/<title>.+<\/title>/);
      expect(html).toMatch(/<main[ >]/);
      expect(html).toMatch(/<header[ >]/);
      expect(html).toMatch(/<footer[ >]/);
      for (const image of html.matchAll(/<img\s[^>]*>/g)) expect(image[0]).toMatch(/alt="[^"]*"/);
    });
  }
});
