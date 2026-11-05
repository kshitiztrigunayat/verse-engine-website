// Builds sitemap.xml: the public pages, each with lastmod = the date its text last changed in git.
// Moving a page to a new file format (HTML -> JSON -> React) does not count as a change.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

// Not listed: app pages, and pages that repeat another page's content.
export const notInSitemap = new Set([
  '/signin',
  '/studio',
  '/docs', // copy of /docs/what-is-verse-engine
  '/docs/upload-your-first-scene', // copy of /docs/getting-started
  '/docs/supported-file-types', // copy of /docs/guides/what-you-can-upload
  '/docs/concepts', // copy of /docs/how-streaming-works
  '/docs/materials-and-lighting', // copy of /docs/guides/fidelity-mode
  '/docs/floor-plan-to-3d-home', // copy of /docs/guides/floor-plan-to-3d
  '/docs/fixing-doors-and-windows', // copy of /docs/guides/instant-home
  '/docs/start-a-live-tour', // copy of /docs/guides/tour-together
  '/docs/authentication', // copy of /docs/api-quickstart
  '/docs/api', // copy of /docs/scenes-api
  '/docs/webhooks', // copy of /docs/developers
  '/docs/blender', // copy of /docs/guides/publish-from-blender
  '/docs/unity', // copy of /docs/guides/publish-from-unity
  '/docs/unreal', // copy of /docs/guides/publish-from-unreal
]);

const visibleText = (html) => html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const jsxText = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ').replace(/\s+/g, ' ').trim();

export function sitemapXml({project, origin, routes}) {
  const today = new Date().toISOString().slice(0, 10);
  const pagesIndex = fs.readFileSync(path.join(project, 'src/pages/index.ts'), 'utf8');
  const imports = new Map([...pagesIndex.matchAll(/^import (\w+) from "\.\/([^"]+)";/gm)].map((m) => [m[1], m[2]]));
  const jsxFor = new Map([...pagesIndex.matchAll(/^\s+"(\/[^"]*)": (\w+),/gm)].map((m) => [m[1], 'src/pages/' + imports.get(m[2])]));

  let root = null;
  try { root = execFileSync('git', ['rev-parse', '--show-toplevel'], {cwd: project, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim(); } catch {}
  const prefix = root ? path.relative(root, project).replaceAll('\\', '/') + '/' : '';
  const git = (...args) => execFileSync('git', args, {cwd: project, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore']});
  const shown = new Map();
  // A file's content at a commit (null = the working tree).
  const fileAt = (commit, file) => {
    const key = commit + ':' + file;
    if (!shown.has(key)) {
      let text = null;
      try { text = commit ? git('show', `${commit}:${prefix}${file}`) : fs.readFileSync(path.join(project, file), 'utf8'); }
      catch {
        const previousExtension = file.endsWith('.tsx') ? '.jsx' : file.endsWith('.ts') ? '.js' : null;
        if (commit && previousExtension) {
          const previousFile = file.replace(/\.(?:tsx|ts)$/, previousExtension);
          try { text = git('show', `${commit}:${prefix}${previousFile}`); } catch {}
        }
      }
      shown.set(key, text);
    }
    return shown.get(key);
  };
  const metaAt = (commit, route) => {
    const src = fileAt(commit, 'src/pages/meta.ts');
    const m = src && src.match(new RegExp(`\\n  ${JSON.stringify(route).replace(/[/]/g, '\\/')}: \\{\\n    kind: [^\\n]*\\n    chrome: [^\\n]*\\n    title: (.*),\\n    description: (.*),\\n`));
    return m ? JSON.parse(m[1]) + ' ' + JSON.parse(m[2]) : null;
  };
  // The page's format and text at a commit, or null if it didn't exist.
  const pageAt = (commit, route) => {
    const file = route === '/' ? 'index' : route.slice(1).replaceAll('/', '__');
    const jsx = jsxFor.has(route) && fileAt(commit, jsxFor.get(route));
    const payload = fileAt(commit, `public/content/${file}.json`) ?? fileAt(commit, `dist/content/${file}.json`);
    const data = payload ? JSON.parse(payload) : null;
    if (jsx) return ['react', jsxText(jsx) + ' ' + (metaAt(commit, route) ?? (data ? data.title + ' ' + data.description : ''))];
    if (data?.docs) return ['docs', [data.title, data.description, visibleText(data.docs.article), ...data.docs.toc.map((t) => t.text)].join(' ')];
    if (data?.html !== undefined) return ['payload', [data.title, data.description, visibleText(data.html)].join(' ')];
    const html = fileAt(commit, `dist/${route === '/' ? '' : route.slice(1) + '/'}index.html`);
    if (!html) return null;
    // Only the page's own text, not the shared header and footer.
    const title = (html.match(/<title>([^<]*)<\/title>/) || [, ''])[1], description = (html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1];
    const main = (html.match(/<main[^>]*>([\s\S]*)<\/main>/) || [, html])[1];
    return ['html', [title, description, visibleText(main)].join(' ')];
  };
  const sources = (route) => {
    const file = route === '/' ? 'index' : route.slice(1).replaceAll('/', '__');
    const pageSource = jsxFor.get(route);
    return [`public/content/${file}.json`, `dist/content/${file}.json`, `dist/${route === '/' ? '' : route.slice(1) + '/'}index.html`,
      ...(pageSource ? [pageSource, pageSource.replace(/\.tsx$/, '.jsx'), 'src/pages/meta.ts', 'src/pages/meta.js'] : [])].map((f) => prefix + f);
  };
  const lastModified = (route) => {
    const commits = git('log', '--reverse', '--format=%H %as', '--', ...sources(route).map((f) => ':(top)' + f)).trim().split('\n').filter(Boolean).map((l) => l.split(' '));
    let last = null, previous = null;
    for (const [hash, date] of commits) {
      const page = pageAt(hash, route);
      if (!page) { previous = null; continue; }
      if (!previous || (page[0] === previous[0] && page[1] !== previous[1])) last = date;
      previous = page;
    }
    const now = pageAt(null, route);
    if (now && previous && now[0] === previous[0] && now[1] !== previous[1]) last = today;
    return last ?? today;
  };
  const kept = new Map();
  if (!root) {
    const old = fs.existsSync(path.join(project, 'public/sitemap.xml')) ? fs.readFileSync(path.join(project, 'public/sitemap.xml'), 'utf8') : '';
    for (const m of old.matchAll(/<loc>[^<]*?(\/[^<]*|)<\/loc><lastmod>([^<]+)<\/lastmod>/g)) kept.set(m[1] || '/', m[2]);
  }
  const urls = routes.filter((r) => !r.noindex && !notInSitemap.has(r.path)).map((r) => {
    const lastmod = root ? lastModified(r.path) : kept.get(r.path);
    return `<url><loc>${origin}${r.path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
}
