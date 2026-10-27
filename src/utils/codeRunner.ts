// Real Python (CPython compiled to WebAssembly via Pyodide), self-hosted so it also works offline.
export interface ExecutionResult {
  success: boolean;
  logs: string;
  error?: string;
  timedOut?: boolean;
}

type WorkerMessage =
  | { type: 'ready' }
  | { type: 'init-error'; error: string }
  | { type: 'result'; id: number; ok: boolean; out: string; err: string };

let worker: Worker | null = null;
let readyPromise: Promise<void> | null = null;
let nextId = 1;
const pending = new Map<number, (r: ExecutionResult) => void>();

function bootWorker(): Promise<void> {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise<void>((resolve, reject) => {
    const url = new URL('py-worker.mjs', document.baseURI).href;
    const w = new Worker(url, { type: 'module' });
    worker = w;

    const bootTimer = window.setTimeout(() => reject(new Error('Python runtime took too long to load.')), 90000);

    w.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === 'ready') {
        window.clearTimeout(bootTimer);
        resolve();
      } else if (msg.type === 'init-error') {
        window.clearTimeout(bootTimer);
        reject(new Error(msg.error));
      } else if (msg.type === 'result') {
        const done = pending.get(msg.id);
        if (done) {
          pending.delete(msg.id);
          done({ success: msg.ok, logs: msg.out, error: msg.ok ? undefined : msg.err });
        }
      }
    };
    w.onerror = (e) => {
      window.clearTimeout(bootTimer);
      reject(new Error(e.message || 'Python worker failed to start.'));
    };
  });

  readyPromise.catch(() => resetWorker());
  return readyPromise;
}

function resetWorker() {
  if (worker) worker.terminate();
  worker = null;
  readyPromise = null;
  pending.forEach((done) => done({ success: false, logs: '', error: 'Python runtime was restarted.' }));
  pending.clear();
}

/** Start loading Python in the background (call when the player nears the terminal room). */
export function preloadPython(): void {
  bootWorker().catch(() => undefined);
}

export async function executeCodeInWorker(code: string, timeoutMs: number = 4000): Promise<ExecutionResult> {
  try {
    await bootWorker();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, logs: '', error: `Python runtime failed to load: ${msg}` };
  }

  return new Promise<ExecutionResult>((resolve) => {
    const id = nextId++;
    const timer = window.setTimeout(() => {
      pending.delete(id);
      resetWorker(); // the only way to stop an infinite loop
      preloadPython(); // warm up a fresh runtime for the next attempt
      resolve({
        success: false,
        logs: '',
        error: `TimeoutError: the program ran longer than ${timeoutMs / 1000}s. It probably contains an infinite loop (a while loop that never ends).`,
        timedOut: true,
      });
    }, timeoutMs);

    pending.set(id, (result) => {
      window.clearTimeout(timer);
      resolve(result);
    });
    worker?.postMessage({ id, code });
  });
}
