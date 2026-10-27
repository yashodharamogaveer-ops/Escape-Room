import React, { useState } from 'react';
import { GameState } from '../types/game';
import { InteractTarget } from '../game/GameWorld';
import {
  Key,
  Map as MapIcon,
  Flashlight,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Timer,
  Cpu,
  FileCode,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

interface HUDProps {
  gameState: GameState;
  activeTarget: InteractTarget | null;
  glitchAlert: string | null;
  onInteract: () => void;
  onToggleFlashlight: () => void;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  activeTarget,
  glitchAlert,
  onInteract,
  onToggleFlashlight,
  onToggleMute,
}) => {
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const tenths = Math.floor((totalSeconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-sans">
      <div className="absolute inset-0 scanlines opacity-35 pointer-events-none" />

      {/* GLITCH ALERT NOTIFICATION FOR ROOM 2 SEAL */}
      {glitchAlert && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92vw] px-4 animate-bounce pointer-events-auto">
          <div className="bg-red-950/95 border-2 border-red-500 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 glow-red">
            <AlertOctagon className="w-7 h-7 text-red-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <div className="font-tech font-black text-sm text-red-300 uppercase tracking-widest flex items-center gap-2">
                <span>SYSTEM ALERT // CONTAINMENT BREACH</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </div>
              <p className="text-xs md:text-sm font-mono-code text-red-100 font-semibold leading-relaxed">
                {glitchAlert}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TOP-LEFT: Dynamic Objectives Checklist */}
      <div className="absolute top-4 left-4 pointer-events-auto w-72 md:w-80 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 shadow-2xl">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                gameState.currentRoom === 1
                  ? 'bg-red-500'
                  : gameState.currentRoom === 2
                  ? 'bg-amber-500'
                  : gameState.currentRoom === 3
                  ? 'bg-emerald-500'
                  : 'bg-purple-500'
              } animate-pulse`}
            />
            <h2 className="text-xs font-tech font-bold tracking-wider text-slate-200 uppercase">
              {gameState.currentRoom === 1
                ? 'Sector 01: Cage Detention'
                : gameState.currentRoom === 2
                ? 'Sector 02: Multi-Door Maze'
                : gameState.currentRoom === 3
                ? 'Sector 03: Debug Room'
                : 'Sector 04: The Monolith'}
            </h2>
          </div>
          <span className="text-[10px] font-mono-code text-slate-400">
            ROOM {gameState.currentRoom} OF 4
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-mono-code">
          {/* Room 1 Checklist */}
          {gameState.currentRoom === 1 && (
            <>
              <div className="flex items-start gap-2">
                {gameState.hasMap ? (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <span className={gameState.hasMap ? 'text-cyan-300 line-through' : 'text-slate-300'}>
                  Find hidden blueprint map
                </span>
              </div>
              <div className="flex items-start gap-2">
                {gameState.hasKey ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <span className={gameState.hasKey ? 'text-amber-300 line-through font-bold' : 'text-amber-200'}>
                  Pass hurdles: Master Key (Needed for Last Door!)
                </span>
              </div>
              <div className="flex items-start gap-2">
                {gameState.doorUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <span className={gameState.doorUnlocked ? 'text-green-300 font-bold' : 'text-cyan-200'}>
                  Solve Number/Alphabet Series at Door 1
                </span>
              </div>
            </>
          )}

          {/* Room 2 Checklist */}
          {gameState.currentRoom === 2 && (
            <>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-amber-300 line-through">
                  Sector 01 Series Solved
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Circle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-amber-200">
                  Inspect Central Big Board for safe conduit
                </span>
              </div>
              <div className="flex items-start gap-2">
                {gameState.room2DoorUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <span className={gameState.room2DoorUnlocked ? 'text-green-300 font-bold' : 'text-slate-400'}>
                  Pick correct door (Avoid traps to Room 3)
                </span>
              </div>
            </>
          )}

          {/* Room 3 Checklist */}
          {gameState.currentRoom === 3 && (
            <>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-emerald-300 line-through">
                  Sector 02 Maze Navigated
                </span>
              </div>
              <div className="flex items-start gap-2">
                {gameState.dataFragment ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                )}
                <span className={gameState.dataFragment ? 'text-emerald-300 line-through' : 'text-emerald-200 font-bold'}>
                  Fix bug on central terminal [E]
                </span>
              </div>
              <div className="flex items-start gap-2">
                {gameState.room3DoorUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <span className={gameState.room3DoorUnlocked ? 'text-green-300 font-bold' : 'text-slate-400'}>
                  Unlock airlock to Sector 04
                </span>
              </div>
            </>
          )}

          {/* Room 4 Checklist */}
          {gameState.currentRoom === 4 && (
            <>
              <div className="flex items-start gap-2">
                {gameState.chestTruthUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5 animate-pulse" />
                )}
                <span className={gameState.chestTruthUnlocked ? 'text-cyan-300 line-through' : 'text-cyan-200 font-bold'}>
                  Chest 1: TRUTH (4-Bit Binary)
                </span>
              </div>
              <div className="flex items-start gap-2">
                {gameState.chestLiesUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className={`w-4 h-4 ${gameState.chestTruthUnlocked ? 'text-amber-400 animate-pulse' : 'text-slate-600'} shrink-0 mt-0.5`} />
                )}
                <span className={gameState.chestLiesUnlocked ? 'text-amber-300 line-through' : gameState.chestTruthUnlocked ? 'text-amber-200 font-bold' : 'text-slate-500'}>
                  Chest 2: LIES (Single Digit)
                </span>
              </div>
              <div className="flex items-start gap-2">
                {gameState.chestUnknownUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className={`w-4 h-4 ${gameState.chestLiesUnlocked ? 'text-purple-400 animate-pulse' : 'text-slate-600'} shrink-0 mt-0.5`} />
                )}
                <span className={gameState.chestUnknownUnlocked ? 'text-purple-300 line-through' : gameState.chestLiesUnlocked ? 'text-purple-200 font-bold' : 'text-slate-500'}>
                  Chest 3: UNKNOWN (Alphabet Glyph: {gameState.awardedLetter ? `[${gameState.awardedLetter}]` : '?'})
                </span>
              </div>
              <div className="flex items-start gap-2">
                {gameState.room4HiddenDoorUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <span className={gameState.room4HiddenDoorUnlocked ? 'text-emerald-300 font-bold' : 'text-cyan-200'}>
                  Ignite 3rd Math Symbol & Breach Wall
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TOP-CENTER: Timer & Penalties & Data Fragment Display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2">
        <div className="bg-slate-950/85 border border-slate-800 px-4 py-1.5 rounded-full flex items-center gap-3 shadow-xl">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono-code text-sm">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white tracking-widest">
              {formatTime(gameState.elapsedSeconds)}
            </span>
          </div>

          {gameState.penaltySeconds > 0 && (
            <div className="text-[10px] font-mono-code font-bold text-red-400 bg-red-950/60 border border-red-800/80 px-2 py-0.5 rounded-full">
              +{gameState.penaltySeconds}s Penalty
            </div>
          )}

          {gameState.hintsUsedCount > 0 && (
            <div className="text-[10px] font-mono-code font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full">
              {gameState.hintsUsedCount} Hint{gameState.hintsUsedCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Small Data Fragment Badge (Always on-screen once acquired) */}
        {gameState.dataFragment && (
          <div className="bg-emerald-950/90 border border-emerald-500 rounded-full px-3.5 py-1 text-xs font-mono-code text-emerald-300 shadow-xl flex items-center gap-2 animate-fade-in">
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              DATA FRAGMENT: <strong className="text-white tracking-widest">{gameState.dataFragment}</strong>
            </span>
          </div>
        )}

        {/* Alphabet Glyph Badge from Chest 3 */}
        {gameState.awardedLetter && (
          <div className="bg-purple-950/90 border border-purple-400 rounded-full px-4 py-1 text-xs font-mono-code text-purple-200 shadow-xl flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>
              ALPHABET GLYPH: <strong className="text-white text-sm font-black tracking-widest">[{gameState.awardedLetter}]</strong>
            </span>
          </div>
        )}
      </div>

      {/* CENTER: Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`rounded-full transition-all duration-150 ${
            activeTarget
              ? 'w-7 h-7 border-2 border-emerald-400 bg-emerald-400/20 scale-125'
              : 'w-2 h-2 bg-white/75 border border-black/40'
          }`}
        />
      </div>

      {/* CENTER-BOTTOM: Action Prompt Banner */}
      {activeTarget && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            onClick={onInteract}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-tech font-bold text-sm tracking-wider uppercase rounded-full shadow-2xl transition-all transform active:scale-95 animate-bounce cursor-pointer"
          >
            <span className="w-5 h-5 rounded-md bg-slate-950 text-emerald-400 flex items-center justify-center text-xs font-mono-code">
              E
            </span>
            <span>{activeTarget.prompt.replace('[E] ', '')}</span>
          </button>
        </div>
      )}

      {/* BOTTOM-LEFT: Inventory Dock (with Data Fragment and Alphabet Glyph slots) */}
      <div className="absolute bottom-4 left-4 pointer-events-auto bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 shadow-2xl flex flex-col gap-2">
        <div className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-400 px-1">
          Tactical Inventory
        </div>
        <div className="flex gap-2">
          {/* Map Slot */}
          <div
            className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
              gameState.hasMap
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                : 'bg-slate-900 border-dashed border-slate-800 text-slate-600'
            }`}
            title={gameState.hasMap ? 'Floor 13 Schematic (Radar Active)' : 'Empty Map Slot'}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[9px] font-mono-code mt-0.5">
              {gameState.hasMap ? 'MAP' : 'EMPTY'}
            </span>
          </div>

          {/* Key Slot */}
          <div
            className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
              gameState.hasKey
                ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-dashed border-slate-800 text-slate-600'
            }`}
            title={gameState.hasKey ? 'Master Exit Key' : 'Empty Key Slot'}
          >
            <Key className="w-5 h-5" />
            <span className="text-[9px] font-mono-code mt-0.5">
              {gameState.hasKey ? 'KEY' : 'EMPTY'}
            </span>
          </div>

          {/* Data Fragment Slot */}
          <div
            className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
              gameState.dataFragment
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                : 'bg-slate-900 border-dashed border-slate-800 text-slate-600'
            }`}
            title={gameState.dataFragment ? `Data Fragment: ${gameState.dataFragment}` : 'Data Fragment (Locked)'}
          >
            <FileCode className="w-5 h-5" />
            <span className="text-[8px] font-mono-code mt-0.5 font-bold truncate max-w-[50px]">
              {gameState.dataFragment ? gameState.dataFragment : 'DATA'}
            </span>
          </div>

          {/* Alphabet Glyph Slot */}
          <div
            className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
              gameState.awardedLetter
                ? 'bg-purple-950/80 border-purple-400 text-purple-300'
                : 'bg-slate-900 border-dashed border-slate-800 text-slate-600'
            }`}
            title={gameState.awardedLetter ? `Alphabet Glyph: [${gameState.awardedLetter}]` : 'Alphabet Glyph (Chest 3)'}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] font-mono-code mt-0.5 font-bold">
              {gameState.awardedLetter ? `[${gameState.awardedLetter}]` : 'GLYPH'}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM-CENTER: Controls Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center">
        <button
          onClick={() => setControlsCollapsed(!controlsCollapsed)}
          className="mb-1 px-3 py-0.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-t-lg text-[10px] font-mono-code text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          {controlsCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {!controlsCollapsed && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-4 text-xs font-mono-code text-slate-300">
            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-bold">
                WASD
              </span>
              <span>Move</span>
            </div>

            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-bold">
                Shift
              </span>
              <span>Sprint</span>
            </div>

            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-bold">
                Mouse
              </span>
              <span>Look</span>
            </div>

            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-bold">
                E
              </span>
              <span>Interact</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleFlashlight}
                className={`p-1.5 rounded-lg border transition ${
                  gameState.flashlightOn
                    ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
                title="Toggle Flashlight [F]"
              >
                <Flashlight className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleMute}
                className={`p-1.5 rounded-lg border transition ${
                  gameState.soundEnabled
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-red-950/60 border-red-800 text-red-400'
                }`}
                title="Toggle Sound"
              >
                {gameState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
