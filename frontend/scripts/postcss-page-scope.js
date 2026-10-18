/**
 * PostCSS plugin: scopes `*.page.css` files to a body class so each page's original inline
 * <style> applies only while that page is shown (as on the PHP site, where it was the only page CSS).
 *
 *   login.page.css   →  every selector is prefixed with  body.page-login
 *   :root { … }      →  body.page-login { … }          (page-specific CSS variables)
 *   body …           →  body.page-login …
 *   html …           →  :root:has(> body.page-login) …
 *   @keyframes spin  →  @keyframes spin--page-login   (and matching animation references)
 *
 * The page component adds the class with useBodyClass('page-login').
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const PAGE_FILE = /\.page\.css$/;
const FOOTER_CSS = fileURLToPath(new URL('../src/styles/layout/footer.css', import.meta.url));

/**
 * On live, footer.php's `:root { --… }` block came after every page's own `:root` block, so
 * variables defined in both always took the footer's value. Page copies of them are dropped.
 */
function footerVariables() {
  const css = readFileSync(FOOTER_CSS, 'utf8');
  const rootBlock = css.match(/:root\s*\{([^}]*)\}/);
  return new Set(rootBlock ? [...rootBlock[1].matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]) : []);
}

function pageClassFor(file) {
  return `page-${basename(file).replace(PAGE_FILE, '')}`;
}

function scopeSelector(selector, scope) {
  const s = selector.trim();
  if (s === ':root') return scope;
  if (/^html\b/.test(s)) return s.replace(/^html/, `:root:has(> ${scope})`);
  if (/^body\b/.test(s)) return s.replace(/^body/, scope);
  if (/^(from|to|\d+(\.\d+)?%)$/.test(s)) return s; // keyframe steps (safety)
  // A universal reset (`* { margin: 0; padding: 0 }`) has zero specificity on live, so Bootstrap's
  // class rules (.row, .navbar …) still win. :where() keeps the scoped selector at zero too.
  if (s.startsWith('*')) return `:where(${scope}) ${s}`;
  return `${scope} ${s}`;
}

function insideKeyframes(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'atrule' && /keyframes$/i.test(p.name)) return true;
  }
  return false;
}

/** @type {import('postcss').PluginCreator<void>} */
const pageScope = () => ({
  postcssPlugin: 'sanyod-page-scope',
  Once(root) {
    const file = root.source?.input.file;
    if (!file || !PAGE_FILE.test(file)) return;
    const pageClass = pageClassFor(file);
    const scope = `body.${pageClass}`;

    const renamed = new Map();
    root.walkAtRules(/keyframes$/i, (rule) => {
      const name = rule.params.trim();
      const next = `${name}--${pageClass}`;
      renamed.set(name, next);
      rule.params = next;
    });

    const overridden = footerVariables();
    root.walkRules((rule) => {
      if (insideKeyframes(rule)) return;
      if (rule.selector.trim() === ':root') {
        rule.walkDecls(/^--/, (decl) => {
          if (overridden.has(decl.prop)) decl.remove();
        });
        if (!rule.nodes.length) {
          rule.remove();
          return;
        }
      }
      rule.selectors = rule.selectors.map((sel) => scopeSelector(sel, scope));
    });

    if (renamed.size) {
      const names = [...renamed.keys()].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const re = new RegExp(`(^|[\\s,])(${names.join('|')})(?=$|[\\s,;])`, 'g');
      root.walkDecls(/^(-webkit-)?animation(-name)?$/i, (decl) => {
        decl.value = decl.value.replace(re, (_m, pre, name) => `${pre}${renamed.get(name)}`);
      });
    }
  },
});
pageScope.postcss = true;

export default pageScope;
