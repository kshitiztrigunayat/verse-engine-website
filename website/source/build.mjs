// Build orchestrator.
//   1. Stage:   copy page templates into .build/stage (a throwaway multipage tree the legacy generators write into).
//   2. Generate: run the page generators against the stage (VERSE_DIST).
//   3. Compile: turn the stage into the single-page app: dist/index.html shell + dist/content/*.json route payloads.
// Usage: SITE_ORIGIN=https://example.com node source/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)), project=path.resolve(here,'..');
const stage=path.join(project,'.build/stage');
fs.rmSync(path.join(project,'.build'),{recursive:true,force:true});
fs.mkdirSync(path.join(stage,'docs/what-is-verse-engine'),{recursive:true});
fs.copyFileSync(path.join(here,'templates/landing.html'),path.join(stage,'index.html'));
fs.copyFileSync(path.join(here,'templates/docs-overview.html'),path.join(stage,'docs/what-is-verse-engine/index.html'));
const env={...process.env,VERSE_DIST:stage};
for(const step of ['build-production-pages.mjs','build-challenge-page.mjs','build-spa.mjs']){
  const r=spawnSync(process.execPath,[path.join(here,step)],{env,stdio:['ignore','inherit','inherit']});
  if(r.status!==0){console.error(`Build failed in ${step}`);process.exit(r.status||1)}
}
fs.rmSync(path.join(project,'.build'),{recursive:true,force:true});
