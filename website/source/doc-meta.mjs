// Docs page metadata from frontmatter: the block between --- lines at the top of source/production-markdown/<key>.md
// (description, and for blog posts datePublished and author). The docs overview has no Markdown file; its
// description is in approved-pages.json.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url));

export function frontmatter(key){
  const file=path.join(source,'production-markdown',key+'.md');
  if(!fs.existsSync(file))return {};
  const block=(fs.readFileSync(file,'utf8').match(/^---\n([\s\S]*?)\n---/)||[])[1]||'';
  return Object.fromEntries([...block.matchAll(/^(\w+):[ \t]*(.*)$/gm)].map(m=>[m[1],m[2].trim()]));
}

export function docDescription(key){
  if(key==='what-is-verse-engine')return JSON.parse(fs.readFileSync(path.join(source,'approved-pages.json'),'utf8'))['/docs/what-is-verse-engine'].description||'';
  return frontmatter(key).description||'';
}
