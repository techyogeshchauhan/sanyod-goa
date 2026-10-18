// @vitest-environment node
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import pageScope from '../../scripts/postcss-page-scope.js';

async function run(css: string, file = 'C:/x/login.page.css') {
  const result = await postcss([pageScope()]).process(css, { from: file });
  return result.css.replace(/\s+/g, ' ').trim();
}

describe('postcss page scope', () => {
  it('scopes selectors, :root, body and html to the page body class', async () => {
    const out = await run(`
      :root { --primary: #6C63FF; }
      body { background: red; }
      html, body.x { margin: 0 }
      .login-card .btn, h1 > span { color: red; }
    `);
    expect(out).toContain('body.page-login { --primary: #6C63FF; }');
    expect(out).toContain('body.page-login { background: red; }');
    expect(out).toContain(':root:has(> body.page-login), body.page-login.x { margin: 0 }');
    expect(out).toContain('body.page-login .login-card .btn, body.page-login h1 > span { color: red; }');
  });

  it('keeps a universal reset at zero specificity, as on live', async () => {
    const out = await run('* { margin: 0; padding: 0; } *::before { content: none }', 'C:/x/health.page.css');
    expect(out).toContain(':where(body.page-health) * { margin: 0; padding: 0; }');
    expect(out).toContain(':where(body.page-health) *::before { content: none }');
  });

  it('keeps media queries and renames keyframes with their references', async () => {
    const out = await run(`
      @media (max-width: 768px) { .card { padding: 1rem } }
      @keyframes pulse { 0% { opacity: 0 } 100% { opacity: 1 } }
      .icon { animation: pulse 2s infinite, fadeIn 1s; }
      .dot { animation-name: pulse; }
    `);
    expect(out).toContain('@media (max-width: 768px) { body.page-login .card { padding: 1rem } }');
    expect(out).toContain('@keyframes pulse--page-login { 0% { opacity: 0 } 100% { opacity: 1 } }');
    expect(out).toContain('animation: pulse--page-login 2s infinite, fadeIn 1s;');
    expect(out).toContain('animation-name: pulse--page-login;');
  });

  it('drops page variables that the global footer CSS overrides (as on live)', async () => {
    const out = await run(':root { --text-dark: #495057; --primary: #6C63FF; --secondary-color: red; }');
    expect(out).toBe('body.page-login { --primary: #6C63FF; }');
  });

  it('leaves non-page stylesheets untouched', async () => {
    expect(await run('.footer h4 { color: red }', 'C:/x/footer.css')).toBe('.footer h4 { color: red }');
  });
});
