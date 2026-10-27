// Runs real CPython (Pyodide, self-hosted in /pyodide) off the main thread.
import { loadPyodide } from './pyodide/pyodide.mjs';

let pyodide = null;

const ready = (async () => {
  const py = await loadPyodide({ indexURL: new URL('./pyodide/', import.meta.url).href });
  const runner = await (await fetch(new URL('./py-runner.py', import.meta.url))).text();
  py.runPython(runner);
  pyodide = py;
  postMessage({ type: 'ready' });
})().catch((err) => {
  postMessage({ type: 'init-error', error: String(err && err.message ? err.message : err) });
});

self.onmessage = async (event) => {
  await ready;
  if (!pyodide) return;
  const { id, code } = event.data;
  try {
    const fn = pyodide.globals.get('run_user');
    const result = JSON.parse(fn(code));
    fn.destroy();
    postMessage({ type: 'result', id, ...result });
  } catch (err) {
    postMessage({ type: 'result', id, ok: false, out: '', err: String(err && err.message ? err.message : err) });
  }
};
