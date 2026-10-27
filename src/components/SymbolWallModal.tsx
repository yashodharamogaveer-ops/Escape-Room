import React, { useState, useEffect, useRef } from 'react';
import { SymbolWallPuzzle } from '../utils/chestPuzzle';
import { soundManager } from '../utils/audio';
import {
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  X,
  Sigma,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface SymbolWallModalProps {
  wallPuzzle: SymbolWallPuzzle;
  awardedLetter: string | null;
  doorUnlocked: boolean;
  onUnlockDoor: () => void;
  onApplyPenalty: (seconds: number) => void;
  onClose: () => void;
}

export const SymbolWallModal: React.FC<SymbolWallModalProps> = ({
  wallPuzzle,
  awardedLetter,
  doorUnlocked,
  onUnlockDoor,
  onApplyPenalty,
  onClose,
}) => {
  const [inputLetter, setInputLetter] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(doorUnlocked);
  const [isIgniting, setIsIgniting] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!doorUnlocked) {
      inputRef.current?.focus();
    }
  }, [doorUnlocked]);

  // Pre-fill button if user already has letter from Chest 3
  const handleUseInventoryLetter = () => {
    if (awardedLetter) {
      setInputLetter(awardedLetter);
      soundManager.playKeypadClick(awardedLetter);
    }
  };

  const handleSubmit = () => {
    if (doorUnlocked || success) return;
    const letter = inputLetter.trim().toUpperCase();

    if (!letter) {
      setErrorMessage('Please enter an alphabet letter.');
      return;
    }

    if (letter === wallPuzzle.missingLetter.toUpperCase()) {
      setIsIgniting(true);
      setSuccess(true);
      setErrorMessage(null);
      soundManager.playSymbolIgnite();

      setTimeout(() => {
        soundManager.playHydraulicDoorSlide();
      }, 700);

      setTimeout(() => {
        soundManager.playPortalFanfare();
        onUnlockDoor();
      }, 1500);
    } else {
      soundManager.playWrongBuzzer();
      onApplyPenalty(15);
      setErrorMessage(
        `INVALID GLYPH "${letter}". The incomplete word does not resolve. +15s penalty applied.`
      );
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputLetter, doorUnlocked, success]);

  // Render incomplete word with blanks
  const wordTokens = wallPuzzle.incompleteWord.split(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none font-sans">
      <div
        className={`relative w-full max-w-xl bg-slate-950 border-2 ${
          doorUnlocked || success ? 'border-emerald-500 shadow-emerald-500/20' : 'border-cyan-500 shadow-cyan-500/20'
        } rounded-3xl shadow-2xl overflow-hidden ${isShaking ? 'animate-shake' : ''}`}
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Sigma className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400">
                SECTOR 04 // NORTH ARCHWAY MONOLITH
              </div>
              <h2 className="text-xl font-tech font-black tracking-wider text-white uppercase flex items-center gap-2">
                CRYPTIC MATHEMATICAL WALL
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* THE 3 MATHEMATICAL SYMBOLS DISPLAY */}
          <div className="space-y-2">
            <div className="text-center text-xs font-mono-code text-slate-400 uppercase tracking-widest">
              TRIPARTITE MATHEMATICAL HARMONICS
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {/* Symbol 1 (Visible from start) */}
              <div className="aspect-square bg-slate-900/90 border-2 border-cyan-500/80 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-cyan-500/10">
                <span className="text-4xl md:text-5xl font-mono-code font-black text-cyan-400">
                  {wallPuzzle.visibleSymbols[0]}
                </span>
                <span className="text-[10px] font-mono-code text-cyan-300 mt-2">ILLUMINATED</span>
              </div>

              {/* Symbol 2 (Visible from start) */}
              <div className="aspect-square bg-slate-900/90 border-2 border-cyan-500/80 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-cyan-500/10">
                <span className="text-4xl md:text-5xl font-mono-code font-black text-cyan-400">
                  {wallPuzzle.visibleSymbols[1]}
                </span>
                <span className="text-[10px] font-mono-code text-cyan-300 mt-2">ILLUMINATED</span>
              </div>

              {/* Symbol 3 (Hidden until alphabet letter entered) */}
              <div
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-700 border-2 ${
                  doorUnlocked || success
                    ? 'bg-emerald-950/80 border-emerald-400 shadow-xl shadow-emerald-500/30'
                    : isIgniting
                    ? 'bg-cyan-950 border-cyan-300 animate-pulse'
                    : 'bg-slate-950 border-slate-800 border-dashed text-slate-700'
                }`}
              >
                {doorUnlocked || success ? (
                  <>
                    <span className="text-4xl md:text-5xl font-mono-code font-black text-emerald-400 animate-bounce">
                      {wallPuzzle.hiddenSymbol}
                    </span>
                    <span className="text-[10px] font-mono-code text-emerald-300 font-bold mt-2 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-emerald-400" /> IGNITED
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-8 h-8 text-slate-600 mb-1" />
                    <span className="text-xs font-mono-code text-slate-500 uppercase">DARK // EMPTY</span>
                    <span className="text-[9px] font-mono-code text-slate-600">Requires Glyph</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* INCOMPLETE WORD DISPLAY */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-center">
            <div className="text-xs font-mono-code text-slate-400">
              ARCHWAY ACTIVATION CIPHER // COMPLETE THE GLYPH FORMULA
            </div>

            <div className="flex items-center justify-center gap-3">
              {wordTokens.map((token, idx) => {
                const isBlank = token === '_';
                const showLetter = isBlank && (doorUnlocked || success);
                return (
                  <div
                    key={idx}
                    className={`w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-mono-code font-black border-2 transition-all ${
                      showLetter
                        ? 'bg-emerald-900/60 border-emerald-400 text-emerald-300'
                        : isBlank
                        ? 'bg-slate-950 border-cyan-500/80 text-cyan-400 border-dashed animate-pulse'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    {showLetter ? wallPuzzle.missingLetter : isBlank ? (inputLetter ? inputLetter : '?') : token}
                  </div>
                );
              })}
            </div>

            {doorUnlocked || success ? (
              <div className="text-xs font-mono-code text-emerald-300 font-bold">
                COMPLETED WORD: <span className="text-white tracking-widest">{wallPuzzle.completedWord}</span>
              </div>
            ) : (
              <div className="text-xs font-mono-code text-slate-400">
                Supply the Alphabet Letter from Chest "UNKNOWN" to fill the blank and ignite the 3rd Symbol.
              </div>
            )}
          </div>

          {/* SUBMISSION INTERFACE */}
          {!doorUnlocked && !success ? (
            <div className="space-y-4">
              {awardedLetter && (
                <div className="p-3 bg-purple-950/60 border border-purple-500/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono-code text-purple-200">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>
                      Inventory Glyph Ready: <strong className="text-white text-base font-black">[{awardedLetter}]</strong>
                    </span>
                  </div>
                  <button
                    onClick={handleUseInventoryLetter}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono-code font-bold rounded-lg transition cursor-pointer"
                  >
                    INSERT [{awardedLetter}]
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={1}
                  value={inputLetter}
                  onChange={(e) => {
                    setInputLetter(e.target.value.toUpperCase());
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="A - Z"
                  className="flex-1 px-4 py-3 bg-slate-900 border-2 border-cyan-500 rounded-xl text-center text-2xl font-mono-code font-black text-white uppercase focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder:text-slate-700"
                />

                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-tech font-bold text-sm tracking-widest uppercase rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                >
                  TRANSCRIBE
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/80 text-xs font-mono-code text-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-center space-y-2 animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-tech font-bold text-lg uppercase tracking-wider">
                <Unlock className="w-6 h-6" />
                <span>WALL BREACH DETECTED</span>
              </div>
              <p className="text-sm font-mono-code text-emerald-100">
                The 3rd mathematical symbol has ignited. The monolithic solid wall has parted open into the Final Round Portal.
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-tech font-bold text-sm tracking-wider uppercase rounded-xl transition cursor-pointer"
                >
                  <span>STEP THROUGH PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono-code text-slate-400">
            <span>[Enter] transcribe / [Esc] close</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
