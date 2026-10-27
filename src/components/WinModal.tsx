import React from 'react';
import { EscapeMethod } from '../types/game';
import { Trophy, Clock, AlertTriangle, Key, Map, RotateCcw, Lightbulb, FileCode, Download, ListOrdered } from 'lucide-react';
import { LeaderboardEntry, formatDuration, loadLeaderboard, exportLeaderboardJson } from '../utils/leaderboard';

interface WinModalProps {
  playerName: string;
  escapeMethod: EscapeMethod | null;
  elapsedSeconds: number;
  penaltySeconds: number;
  wrongAnswersCount: number;
  hintsUsedCount: number;
  dataFragment: string | null;
  result: { entry: LeaderboardEntry; rank: number; total: number } | null;
  onPlayAgain: () => void;
  onShowLeaderboard: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  playerName,
  escapeMethod,
  elapsedSeconds,
  penaltySeconds,
  wrongAnswersCount,
  hintsUsedCount,
  dataFragment,
  result,
  onPlayAgain,
  onShowLeaderboard,
}) => {
  const totalTimeSeconds = elapsedSeconds + penaltySeconds;
  const isKeyMethod = escapeMethod === 'BOX_KEY';
  const top5 = loadLeaderboard().slice(0, 5);

  const tips: string[] = [];
  if (hintsUsedCount > 0) tips.push(`You used ${hintsUsedCount} hint${hintsUsedCount > 1 ? 's' : ''} (+${hintsUsedCount * 20}s). Try tracing the code by hand first next time.`);
  if (wrongAnswersCount > 0) tips.push(`${wrongAnswersCount} wrong attempt${wrongAnswersCount > 1 ? 's' : ''} cost you extra time. Double-check an answer before you submit it.`);
  if (tips.length === 0) tips.push('A clean run with no hints and no mistakes. Challenge a friend to beat your time!');
  tips.push('The puzzles are randomized every run, so memorizing answers will not help. Learn the patterns instead.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 font-sans">
      <div className="relative w-full max-w-2xl max-h-[96vh] overflow-y-auto bg-slate-950 border-2 border-emerald-500 rounded-3xl shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-400 to-green-500" />

        <div className="p-5 md:p-7 space-y-4">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono-code font-bold tracking-widest uppercase">
              <Trophy className="w-3.5 h-3.5" />
              <span>Mission Complete // All 4 Sectors Cleared</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-tech font-black tracking-tight text-white uppercase">You Escaped Floor 13!</h1>
            <p className="text-sm text-emerald-300 font-mono-code">Well done, {playerName || 'Player'}.</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs md:text-sm text-slate-300 leading-relaxed space-y-2">
            <p>
              The final portal flares open and the tower's alarms fall silent. You stagger out into the cold night air, free. The syndicate's lockdown
              is broken, and every lock they built, from the cipher box to the Monolith, was beaten by your logic.
            </p>
            <p className="text-slate-400">
              Along the way you read a map and cracked codes, picked the one safe door, debugged real Python, and reasoned your way through the TRUTH, LIES and UNKNOWN chests.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-800 flex items-center justify-center shrink-0">
                {isKeyMethod ? <Key className="w-5 h-5 text-amber-400" /> : <Map className="w-5 h-5 text-cyan-400" />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono-code text-slate-400 uppercase">Sector 01 Route</div>
                <div className="text-xs font-bold text-white truncate">{isKeyMethod ? 'Color Cipher Key' : 'Aptitude Logic Test'}</div>
              </div>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 flex items-center justify-center shrink-0">
                <FileCode className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono-code text-slate-400 uppercase">Sector 03 Debug Key</div>
                <div className="text-xs font-bold text-emerald-300 font-mono-code tracking-wider">{dataFragment || 'AUTHENTICATED'}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono-code text-slate-400">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Base</span>
              </div>
              <div className="font-mono-code font-bold text-sm text-white mt-1">{formatDuration(elapsedSeconds)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono-code text-slate-400">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Hints</span>
              </div>
              <div className="font-mono-code font-bold text-sm text-amber-400 mt-1">{hintsUsedCount}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono-code text-slate-400">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>Wrong</span>
              </div>
              <div className="font-mono-code font-bold text-sm text-red-400 mt-1">{wrongAnswersCount}</div>
            </div>
            <div className="bg-slate-900 border border-emerald-800 rounded-xl p-2.5 text-center">
              <div className="text-[10px] font-mono-code text-slate-400">Final Time</div>
              <div className="font-mono-code font-bold text-sm text-green-400 mt-1">{formatDuration(totalTimeSeconds)}</div>
            </div>
          </div>

          {penaltySeconds > 0 && (
            <div className="text-center text-xs font-mono-code text-amber-300 bg-amber-950/40 border border-amber-800/80 p-2 rounded-xl">
              Includes +{penaltySeconds}s of penalties ({hintsUsedCount * 20}s from hints, {penaltySeconds - hintsUsedCount * 20}s from wrong attempts).
            </div>
          )}

          {result && (
            <div className="text-center text-sm font-tech font-bold text-amber-300 bg-amber-950/30 border border-amber-800 rounded-xl p-3 uppercase tracking-wide">
              Your rank: #{result.rank} of {result.total} escapee{result.total === 1 ? '' : 's'}
              {result.rank === 1 && ' - new record!'}
            </div>
          )}

          {top5.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs font-tech font-bold text-slate-300 uppercase mb-1.5">
                <ListOrdered className="w-4 h-4 text-amber-400" /> Top escapes
              </div>
              <ol className="space-y-0.5 text-xs font-mono-code">
                {top5.map((e, i) => (
                  <li key={e.id} className={`flex justify-between ${result && e.id === result.entry.id ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>
                    <span>{i + 1}. {e.name}</span>
                    <span className="text-amber-300">{formatDuration(e.totalSeconds)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1">
            <div className="font-tech font-bold text-white uppercase text-sm">How to beat your time</div>
            <ul className="list-disc pl-4 space-y-0.5 leading-relaxed">
              {tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button onClick={onPlayAgain} className="sm:col-span-3 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-slate-950 font-tech font-black text-base tracking-widest rounded-2xl uppercase flex items-center justify-center gap-3 cursor-pointer">
              <RotateCcw className="w-5 h-5" />
              <span>Play Again (new random puzzles)</span>
            </button>
            <button onClick={onShowLeaderboard} className="sm:col-span-2 py-2.5 border border-amber-700 text-amber-300 hover:bg-amber-950/50 font-tech font-bold text-sm rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer">
              <Trophy className="w-4 h-4" /> Full Leaderboard
            </button>
            <button onClick={exportLeaderboardJson} className="py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-900 text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer">
              <Download className="w-4 h-4" /> Save file
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
