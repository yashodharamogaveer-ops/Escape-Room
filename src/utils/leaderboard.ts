// Leaderboard stored on this device (browser localStorage) with JSON/CSV export + import,
// so scores can be saved as a real file and shared between devices.
export interface LeaderboardEntry {
  id: string;
  name: string;
  totalSeconds: number; // base time + penalties (what ranks players)
  baseSeconds: number;
  penaltySeconds: number;
  hints: number;
  attempts: number;
  route: string; // Sector 01 route used
  date: string; // ISO date
}

const KEY = 'lockdown13.leaderboard.v1';
const NAME_KEY = 'lockdown13.playerName';
const MAX_ENTRIES = 200;

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sortEntries(parsed.filter(isEntry)) : [];
  } catch {
    return [];
  }
}

function isEntry(e: unknown): e is LeaderboardEntry {
  if (!e || typeof e !== 'object') return false;
  const x = e as Record<string, unknown>;
  return typeof x.id === 'string' && typeof x.name === 'string' && typeof x.totalSeconds === 'number' && Number.isFinite(x.totalSeconds);
}

function sortEntries(list: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...list].sort((a, b) => a.totalSeconds - b.totalSeconds || a.date.localeCompare(b.date));
}

function save(list: LeaderboardEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sortEntries(list).slice(0, MAX_ENTRIES)));
  } catch {
    /* storage full or blocked: the game still works, scores just won't persist */
  }
}

/** Adds a finished run and returns it with its 1-based rank. */
export function addEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): { entry: LeaderboardEntry; rank: number; total: number } {
  const full: LeaderboardEntry = {
    ...entry,
    name: entry.name.trim().slice(0, 20) || 'Player',
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
  };
  const list = sortEntries([...loadLeaderboard(), full]);
  save(list);
  return { entry: full, rank: list.findIndex((e) => e.id === full.id) + 1, total: list.length };
}

export function clearLeaderboard() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function getSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name.trim().slice(0, 20));
  } catch {
    /* ignore */
  }
}

export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
}

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportLeaderboardJson() {
  download('lockdown13-leaderboard.json', JSON.stringify(loadLeaderboard(), null, 2), 'application/json');
}

export function exportLeaderboardCsv() {
  const rows = [['Rank', 'Name', 'Final Time', 'Base Time (s)', 'Penalty (s)', 'Hints', 'Wrong Attempts', 'Route', 'Date']];
  loadLeaderboard().forEach((e, i) => {
    rows.push([
      String(i + 1),
      `"${e.name.replace(/"/g, '""')}"`,
      formatDuration(e.totalSeconds),
      e.baseSeconds.toFixed(1),
      String(e.penaltySeconds),
      String(e.hints),
      String(e.attempts),
      e.route,
      e.date,
    ]);
  });
  download('lockdown13-leaderboard.csv', rows.map((r) => r.join(',')).join('\n'), 'text/csv');
}

/** Merge scores from an exported JSON file. Returns how many new entries were added. */
export async function importLeaderboardJson(file: File): Promise<number> {
  const parsed = JSON.parse(await file.text());
  if (!Array.isArray(parsed)) throw new Error('Not a leaderboard file');
  const current = loadLeaderboard();
  const known = new Set(current.map((e) => e.id));
  const incoming = parsed.filter(isEntry).filter((e: LeaderboardEntry) => !known.has(e.id));
  save([...current, ...incoming]);
  return incoming.length;
}
