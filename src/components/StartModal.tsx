import React, { useState } from 'react';
import { Play, ShieldAlert, Key, Map, ArrowRight, Trophy, User } from 'lucide-react';
import { getSavedName, saveName } from '../utils/leaderboard';

interface StartModalProps {
  onStartGame: (playerName: string) => void;
  onShowLeaderboard: () => void;
}

export const StartModal: React.FC<StartModalProps> = ({ onStartGame, onShowLeaderboard }) => {
  const [name, setName] = useState<string>(getSavedName);

  const begin = () => {
    const finalName = name.trim() || 'Player';
    saveName(finalName);
    onStartGame(finalName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-none">
      <div className="relative w-full max-w-2xl max-h-[96vh] overflow-y-auto bg-slate-950 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-cyan-500" />

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Header & Badges */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-400 text-xs font-mono-code font-bold tracking-widest uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Hostage Detention // Sector 13</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-tech font-black tracking-tight text-white uppercase mt-2">
              LOCKDOWN <span className="text-red-500">13</span>
            </h1>

            <p className="text-sm md:text-base font-mono-code text-cyan-300 font-medium">
              "You wake up in a locked room. Your phone is gone. Find a way out."
            </p>
          </div>

          {/* Story Narrative Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 space-y-2 text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
            <p>
              You were abducted by an anonymous syndicate of cyber-hackers and locked inside an impenetrable cage-like chamber on Floor 13 of an abandoned high-rise tower. The main security airlock is sealed tight.
            </p>
            <p className="text-slate-400">
              There are <strong className="text-white">two distinct paths</strong> to escape Floor 13:
            </p>
          </div>

          {/* Escape Steps & Hurdles Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Step 1: Hurdles for Master Key */}
            <div className="bg-slate-900/80 border border-amber-900/70 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-tech font-bold text-sm uppercase">
                  <Key className="w-4 h-4" />
                  <span>High-Value Master Key</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  Pass the color cipher hurdles (wall painting + scrambled digits) to unlock the metal box and secure the Master Key. It is vital for the Last Door!
                </p>
              </div>
              <div className="mt-3 text-[10px] font-mono-code text-amber-300/90 bg-amber-950/40 px-2 py-1 rounded border border-amber-900">
                ★ Essential For Last Door
              </div>
            </div>

            {/* Step 2: Door 1 Series Cipher */}
            <div className="bg-slate-900/80 border border-cyan-900/70 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-tech font-bold text-sm uppercase">
                  <Map className="w-4 h-4" />
                  <span>Door 1 Series Cipher</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  Grab the blueprint map for live radar. Approach Door 1 and solve the hacker number/alphabet series to unlock access into Room 2!
                </p>
              </div>
              <div className="mt-3 text-[10px] font-mono-code text-cyan-300/90 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-900">
                Number / Alphabet Series
              </div>
            </div>
          </div>

          {/* Controls Quick Summary */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono-code text-slate-400">
            <div><strong className="text-white">WASD</strong> Move</div>
            <div><strong className="text-white">Shift</strong> Sprint</div>
            <div><strong className="text-white">Mouse</strong> Look (Click to lock)</div>
            <div><strong className="text-white">E</strong> Interact / Inspect</div>
            <div><strong className="text-white">F</strong> Flashlight</div>
            <div><strong className="text-white">Esc</strong> Free Cursor</div>
          </div>

          {/* How to play */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 font-sans leading-relaxed space-y-1">
            <div className="font-tech font-bold text-white uppercase text-sm">How to escape</div>
            <p><strong className="text-amber-300">Sector 1:</strong> find the map, crack the color cipher or answer the aptitude questions, then solve the series on Door 1.</p>
            <p><strong className="text-amber-300">Sector 2:</strong> read the big board and pick the one safe door.</p>
            <p><strong className="text-amber-300">Sector 3:</strong> fix the broken Python program on the terminal to get the 4-digit key.</p>
            <p><strong className="text-amber-300">Sector 4:</strong> open the chests in order (TRUTH, LIES, UNKNOWN), use the letter on the wall, then walk through the hidden door.</p>
            <p className="text-slate-400">The clock runs the whole time. Hints cost +20s and wrong answers add time penalties, so think before you guess.</p>
          </div>

          {/* Player name */}
          <label className="flex items-center gap-2 bg-slate-900 border border-slate-700 focus-within:border-cyan-500 rounded-xl px-3 py-2.5">
            <User className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && begin()}
              maxLength={20}
              placeholder="Enter your name for the leaderboard"
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-500 font-mono-code"
            />
          </label>

          {/* Start Button */}
          <button
            onClick={begin}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-tech font-black text-lg tracking-widest rounded-2xl uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-98 transition transform cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Enter Floor 13</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onShowLeaderboard}
            className="w-full py-2.5 border border-amber-700 text-amber-300 hover:bg-amber-950/50 font-tech font-bold text-sm tracking-widest rounded-xl uppercase flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>View Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
