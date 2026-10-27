import React, { useRef, useState } from 'react';
import { Trophy, X, Download, Upload, Trash2 } from 'lucide-react';
import {
  loadLeaderboard,
  formatDuration,
  exportLeaderboardJson,
  exportLeaderboardCsv,
  importLeaderboardJson,
  clearLeaderboard,
} from '../utils/leaderboard';

interface LeaderboardModalProps {
  onClose: () => void;
  highlightId?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose, highlightId }) => {
  const [entries, setEntries] = useState(loadLeaderboard);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const added = await importLeaderboardJson(file);
      setEntries(loadLeaderboard());
      setMessage(added ? `Imported ${added} new score${added === 1 ? '' : 's'}.` : 'No new scores found in that file.');
    } catch {
      setMessage('That file is not a valid Lockdown 13 leaderboard (.json).');
    }
  };

  const handleClear = () => {
    if (window.confirm('Delete ALL saved scores on this device? Export them first if you want a backup.')) {
      clearLeaderboard();
      setEntries([]);
      setMessage('Leaderboard cleared.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/90 font-sans">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-950 border-2 border-amber-600 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 text-amber-400 font-tech font-black tracking-wider uppercase">
            <Trophy className="w-5 h-5" />
            <span>Escape Leaderboard</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {entries.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10 font-mono-code">
              No escapes recorded yet. Be the first to break out of Floor 13!
            </p>
          ) : (
            <table className="w-full text-xs md:text-sm font-mono-code">
              <thead>
                <tr className="text-slate-400 text-left border-b border-slate-800">
                  <th className="py-1.5 px-1">#</th>
                  <th className="px-1">Player</th>
                  <th className="px-1">Final Time</th>
                  <th className="px-1 hidden sm:table-cell">Hints</th>
                  <th className="px-1 hidden sm:table-cell">Wrong</th>
                  <th className="px-1 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 50).map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-b border-slate-900 ${
                      e.id === highlightId ? 'bg-emerald-950/70 text-emerald-300 font-bold' : 'text-slate-200'
                    }`}
                  >
                    <td className="py-1.5 px-1">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                    <td className="px-1 truncate max-w-[9rem]">{e.name}</td>
                    <td className="px-1 text-amber-300">{formatDuration(e.totalSeconds)}</td>
                    <td className="px-1 hidden sm:table-cell">{e.hints}</td>
                    <td className="px-1 hidden sm:table-cell">{e.attempts}</td>
                    <td className="px-1 hidden md:table-cell text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-900 p-3 space-y-2">
          <p className="text-[11px] text-slate-400 leading-snug">
            Scores are saved on this device. Use Export to save them as a file, and Import to load a file from another device.
            Final time = your time + penalties (hints +20s, wrong answers).
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={exportLeaderboardJson} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button onClick={exportLeaderboardCsv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 cursor-pointer ml-auto">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
          </div>
          {message && <div className="text-xs text-amber-300">{message}</div>}
        </div>
      </div>
    </div>
  );
};
