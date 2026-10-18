// Converts a captured live page (reference/live-html/<file>.html) into:
//   - src/styles/pages/<name>.page.css  (the page's inline <style> blocks, unchanged)
//   - <outDir>/<Component>Content.tsx   (the page markup as JSX, one function per top-level block)
// and prints a report (inline scripts, event handlers, assets) for the manual porting step.
//
// Usage: node scripts/html-to-jsx.mjs <reference.html> <css-name> <Component> <outDir>
//   e.g. node scripts/html-to-jsx.mjs ind_know.html ind-know IndianKnowledge src/pages/spirituality
//
// The markup is copied verbatim: same elements, classes, attributes and texts. Whitespace between
// inline elements is preserved ({' '}) because it affects layout; comments are dropped.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseFragment } from 'parse5';

const KNOWN_CSS = new Set(createRequire(import.meta.url)('known-css-properties').all);

const here = dirname(fileURLToPath(import.meta.url));
const [refFile, cssName, component, outDir] = process.argv.slice(2);
if (!refFile || !cssName || !component || !outDir) {
  console.error('Usage: node scripts/html-to-jsx.mjs <reference.html> <css-name> <Component> <outDir>');
  process.exit(1);
}

const html = readFileSync(resolve(here, '../../reference/live-html', refFile), 'utf8');
const start = html.indexOf('<!-- Navbar End -->');
const end = html.indexOf('<!-- Footer Start -->');
if (start < 0 || end < 0) throw new Error('Region markers not found');
const region = html.slice(start + '<!-- Navbar End -->'.length, end);

// Page scripts appended after the footer (the footer's own script handles #backToTop).
const afterFooter = html.slice(html.indexOf('<!-- Copyright End -->'));
const trailingScripts = [...afterFooter.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .filter((js) => !js.includes('#backToTop'));

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const BLOCK = new Set([
  'address', 'article', 'aside', 'blockquote', 'details', 'dialog', 'dd', 'div', 'dl', 'dt', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr',
  'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'tbody', 'thead', 'tfoot', 'tr', 'td', 'th',
  'ul', 'option', 'select', 'iframe', 'video', 'source', 'br',
]);
const ATTR_MAP = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
  minlength: 'minLength', colspan: 'colSpan', rowspan: 'rowSpan', frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen', autoplay: 'autoPlay', playsinline: 'playsInline', crossorigin: 'crossOrigin',
  srcset: 'srcSet', autocomplete: 'autoComplete', enctype: 'encType', novalidate: 'noValidate', datetime: 'dateTime',
  contenteditable: 'contentEditable', spellcheck: 'spellCheck', 'accept-charset': 'acceptCharset',
  referrerpolicy: 'referrerPolicy', allowtransparency: 'allowTransparency', viewbox: 'viewBox',
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace',
};
const BOOLEAN = new Set(['required', 'disabled', 'multiple', 'muted', 'loop', 'controls', 'autoplay', 'playsinline', 'allowfullscreen', 'readonly', 'novalidate', 'hidden', 'defer', 'async', 'open']);

// Legacy page → new route (docs/12 § 4).
const ROUTES = {
  'index.php': '/', 'programes.php': '/programs', 'Personality_Test.php': '/personality-test', 'books.php': '/books',
  'courses.php': '/courses', 'Courses.php': '/courses', 'Spirituality.php': '/spirituality/indian-knowledge',
  'ind_know.php': '/spirituality/indian-knowledge', 'lab.php': '/spirituality/library', 'counity.php': '/spirituality/community',
  'presonal.php': '/spirituality/personal-guidance', 'health.php': '/health', 'about.php': '/about', 'contact.php': '/contact',
  'Peace_Building.php': '/peace-building', 'login.php': '/login', 'register.php': '/register', 'blog.php': '/',
  'index.html': '/', 'my_books.php': '/my-books', 'my_courses.php': '/my-courses',
};

const report = { handlers: [], links: [], assets: new Set(), externalCss: [], dynamicLinks: [], droppedCss: [] };
const styles = [];
const inlineScripts = [];

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const str = (v) => JSON.stringify(v);
// JSX string attributes have no escapes: use an expression when the value contains a quote or backslash.
const attr = (v) => (/["\\]/.test(v) ? `{${JSON.stringify(v)}}` : `"${v}"`);

function styleObject(css) {
  const entries = [];
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop || !value) continue;
    if (!prop.startsWith('--') && !KNOWN_CSS.has(prop.toLowerCase())) {
      report.droppedCss.push(`${prop}: ${value}`); // invalid property: ignored by browsers too
      continue;
    }
    const key = prop.startsWith('--') ? str(prop) : /^-ms-/.test(prop) ? camel(prop.slice(1)) : camel(prop.toLowerCase());
    entries.push(`${key}: ${str(value)}`);
  }
  return `{{ ${entries.join(', ')} }}`;
}

function assetPath(src) {
  if (/^(https?:|data:|\/\/|#|mailto:|tel:|javascript:)/i.test(src)) return src;
  const clean = src.replace(/^\.?\//, '');
  report.assets.add(clean.split('/')[0]);
  return `/${clean.replace(/\s+/g, '-')}`;
}

function convertAttrs(node, extra = []) {
  const out = [];
  let tag = node.tagName;
  for (const { name, value } of node.attrs) {
    const lower = name.toLowerCase();
    if (/^on[a-z]+$/.test(lower)) {
      report.handlers.push(`<${tag} ${name}="${value}">`);
      continue;
    }
    if (lower === 'style') {
      out.push(`style=${styleObject(value)}`);
      continue;
    }
    if ((lower === 'src' || lower === 'poster') && value) {
      out.push(`${lower}=${attr(assetPath(value))}`);
      continue;
    }
    if (lower === 'checked') {
      out.push('defaultChecked');
      continue;
    }
    if (lower === 'selected') continue; // handled on <select>
    if (lower === 'value' && (tag === 'input' || tag === 'textarea')) {
      out.push(`defaultValue=${attr(value)}`);
      continue;
    }
    const key = lower.startsWith('data-') || lower.startsWith('aria-') ? lower : ATTR_MAP[lower] ?? lower;
    if (BOOLEAN.has(lower) && (value === '' || value === lower)) {
      out.push(key);
      continue;
    }
    out.push(`${key}=${attr(value)}`);
  }
  return [...out, ...extra].join(' ');
}

const childElements = (n) => (n.childNodes ?? []).filter((c) => c.nodeName !== '#comment');
const isInlineNode = (n) => n && (n.nodeName === '#text' ? n.value.trim() !== '' : !BLOCK.has(n.tagName ?? ''));

function textJsx(value) {
  const collapsed = value.replace(/\s+/g, ' ');
  if (!collapsed.trim()) return null;
  const lead = collapsed.startsWith(' ') ? "{' '}" : '';
  const trail = collapsed.endsWith(' ') ? "{' '}" : '';
  const core = collapsed.trim();
  const body = /[{}<>&]/.test(core) ? `{${str(core)}}` : core;
  return `${lead}${body}${trail}`;
}

function renderChildren(node, depth) {
  const kids = childElements(node);
  const lines = [];
  kids.forEach((child, i) => {
    if (child.nodeName === '#text') {
      const t = textJsx(child.value);
      if (t !== null) {
        lines.push(`${'  '.repeat(depth)}${t}`);
      } else if (child.value.length && isInlineNode(kids[i - 1]) && isInlineNode(kids[i + 1])) {
        lines.push(`${'  '.repeat(depth)}{' '}`);
      }
      return;
    }
    const rendered = renderNode(child, depth);
    if (rendered) lines.push(rendered);
  });
  return lines;
}

function renderNode(node, depth) {
  const pad = '  '.repeat(depth);
  if (node.nodeName === '#comment' || node.nodeName === '#documentType') return '';
  const tag = node.tagName;
  if (tag === 'style') {
    const css = node.childNodes.map((c) => c.value ?? '').join('');
    if (!css.includes('.footer::before')) styles.push(css);
    return '';
  }
  if (tag === 'script') {
    const src = node.attrs.find((a) => a.name === 'src');
    if (!src) inlineScripts.push(node.childNodes.map((c) => c.value ?? '').join(''));
    return '';
  }
  if (tag === 'link') {
    const href = node.attrs.find((a) => a.name === 'href')?.value;
    if (href) report.externalCss.push(href);
    return '';
  }
  if (tag === 'meta' || tag === 'title' || tag === 'head') return '';
  if (tag === 'html' || tag === 'body') return renderChildren(node, depth).join('\n');

  const extra = [];
  if (tag === 'select') {
    const selected = childElements(node).find((o) => o.tagName === 'option' && o.attrs.some((a) => a.name === 'selected'));
    if (selected) {
      const v = selected.attrs.find((a) => a.name === 'value')?.value ?? selected.childNodes.map((c) => c.value ?? '').join('').trim();
      extra.push(`defaultValue=${attr(v)}`);
    }
  }
  if (tag === 'textarea') {
    const text = node.childNodes.map((c) => c.value ?? '').join('');
    if (text) extra.push(`defaultValue=${attr(text)}`);
  }

  let jsxTag = tag;
  const attrsNode = { ...node, attrs: [...node.attrs] };
  if (tag === 'a') {
    const hrefAttr = node.attrs.find((a) => a.name === 'href');
    const href = hrefAttr?.value ?? '';
    const page = href.split(/[?#]/)[0];
    if (ROUTES[page] !== undefined && !/[?]/.test(href)) {
      jsxTag = 'Link';
      attrsNode.attrs = node.attrs.map((a) => (a.name === 'href' ? { name: 'to', value: ROUTES[page] } : a));
      report.links.push(`${href} → ${ROUTES[page]}`);
    } else if (/\.php/.test(href)) {
      report.dynamicLinks.push(href);
    }
  }
  const attrs = convertAttrs(attrsNode, extra);
  const open = `${pad}<${jsxTag}${attrs ? ` ${attrs}` : ''}`;
  if (VOID.has(tag)) return `${open} />`;
  if (tag === 'textarea') return `${open} />`;
  const children = renderChildren(node, depth + 1);
  if (!children.length) return `${open}></${jsxTag}>`;
  return `${open}>\n${children.join('\n')}\n${pad}</${jsxTag}>`;
}

const fragment = parseFragment(region);
// Flatten nested html/head/body wrappers into one list of top-level elements.
const top = [];
(function collect(nodes) {
  for (const n of nodes) {
    if (n.nodeName === '#comment' || n.nodeName === '#documentType') continue;
    if (n.nodeName === '#text') continue;
    if (['html', 'body', 'head'].includes(n.tagName)) collect(n.childNodes);
    else top.push(n);
  }
})(fragment.childNodes);

const used = new Map();
const blocks = [];
for (const node of top) {
  const jsx = renderNode(node, 2);
  if (!jsx.trim()) continue;
  const cls = node.attrs?.find((a) => a.name === 'class')?.value.split(/\s+/).find((c) => /[a-z]{4,}/.test(c) && !/^(container|row|col|py|px|my|mx|d-)/.test(c));
  const base = (cls ?? node.attrs?.find((a) => a.name === 'id')?.value ?? node.tagName)
    .replace(/(^|[-_\s]+)([a-z0-9])/gi, (_, __, c) => c.toUpperCase());
  const n = (used.get(base) ?? 0) + 1;
  used.set(base, n);
  blocks.push({ name: n > 1 ? `${base}${n}` : base, jsx });
}

const usesLink = blocks.some((b) => b.jsx.includes('<Link'));
const source = `// Generated from reference/live-html/${refFile} by scripts/html-to-jsx.mjs, then edited by hand.
// Markup, classes and texts match the live page; styles: src/styles/pages/${cssName}.page.css
${usesLink ? "import { Link } from 'react-router-dom';\n" : ''}
${blocks
  .map(
    (b) => `export function ${b.name}() {
  return (
${b.jsx}
  );
}`,
  )
  .join('\n\n')}

export default function ${component}Content() {
  return (
    <>
${blocks.map((b) => `      <${b.name} />`).join('\n')}
    </>
  );
}
`;

const outFile = resolve(here, '..', outDir, `${component}Content.tsx`);
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, source.replace(/\n{3,}/g, '\n\n'));

const cssFile = resolve(here, '../src/styles/pages', `${cssName}.page.css`);
if (styles.length) {
  writeFileSync(
    cssFile,
    `/* Source: live ${refFile.replace('.html', '.php')} page <style> blocks (${styles.length}), copied unchanged. Scoped to body.page-${cssName}. */\n${styles.join('\n')}\n`,
  );
}

const scriptsOut = resolve(here, '../.port', `${cssName}.scripts.js`);
mkdirSync(dirname(scriptsOut), { recursive: true });
writeFileSync(scriptsOut, [...inlineScripts, ...trailingScripts].join('\n/* ---- next block ---- */\n'));

console.log(JSON.stringify({
  component: outFile,
  css: styles.length ? cssFile : '(no page CSS)',
  blocks: blocks.map((b) => b.name),
  inlineScripts: inlineScripts.length + trailingScripts.length,
  handlers: report.handlers,
  dynamicLinks: report.dynamicLinks,
  assets: [...report.assets],
  externalCss: report.externalCss,
  droppedCss: report.droppedCss,
}, null, 2));
