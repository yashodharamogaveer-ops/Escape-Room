// Proves every debugging puzzle works using REAL Python (the same Pyodide + runner the game uses).
// Usage: npm run verify:debug
import { readFileSync } from 'node:fs';
import { loadPyodide } from 'pyodide';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const src = readFileSync('src/utils/debugPrograms.ts', 'utf8');
const fixes = JSON.parse(readFileSync('scripts/debug-fixes.json', 'utf8'));

// Evaluate the TS data file (plain object literals) without a build step.
const body = src.replace(/import .*?;\n/, '').replace(/export function[\s\S]*$/, '')
  .replace('export const DEBUG_PROGRAMS: DebugProgram[] =', 'return ');
const programs = new Function(body.trim().replace(/;\s*$/, ''))();

const py = await loadPyodide();
py.runPython(readFileSync('public/py-runner.py', 'utf8'));
const run = (code) => JSON.parse(py.globals.get('run_user')(code));

let failed = 0;
for (const p of programs) {
  const [find, replace] = fixes[p.id];
  const problems = [];
  if (!p.buggyCode.includes(find)) problems.push('fix pattern not found in buggy code');
  const fixed = p.buggyCode.replace(find, replace);
  const buggyRes = run(p.buggyCode);
  const fixedRes = run(fixed);
  if (buggyRes.ok && buggyRes.out.trim() === p.expectedOutput) problems.push('buggy code already prints the answer');
  if (!fixedRes.ok) problems.push('fixed code crashes: ' + fixedRes.err);
  else if (fixedRes.out.trim() !== p.expectedOutput) problems.push(`fixed code prints ${fixedRes.out.trim()} (expected ${p.expectedOutput})`);
  if (!/^\d{4}$/.test(p.expectedOutput)) problems.push('expected output is not 4 digits');
  for (const s of p.requiredSnippets) if (!fixed.includes(s)) problems.push('required snippet missing: ' + s);
  if (p.buggyCode.includes(p.expectedOutput)) problems.push('answer literal appears in the code');
  const kind = buggyRes.ok ? `wrong output ${buggyRes.out.trim()}` : buggyRes.err.split('\n').pop();
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${p.id.padEnd(18)} [${p.bugType}] buggy -> ${kind}`);
  problems.forEach((m) => console.log('      - ' + m));
  if (problems.length) failed++;
}
console.log(failed ? `\n${failed} program(s) failed` : `\nAll ${programs.length} programs verified with real Python.`);
process.exit(failed ? 1 : 0);
