import React, { useState, useEffect, useRef } from 'react';
import { ChestSequencePuzzleData } from '../utils/chestPuzzle';
import { soundManager } from '../utils/audio';
import {
  Lock,
  Unlock,
  ShieldAlert,
  Binary,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  X,
  Sparkles,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';

export type ChestType = 'TRUTH' | 'LIES' | 'UNKNOWN';

interface ChestModalProps {
  chestType: ChestType;
  puzzle: ChestSequencePuzzleData;
  truthUnlocked: boolean;
  liesUnlocked: boolean;
  unknownUnlocked: boolean;
  awardedLetter: string | null;
  onUnlock: (type: ChestType, awardedLetter?: string) => void;
  onApplyPenalty: (seconds: number) => void;
  onClose: () => void;
}

export const ChestModal: React.FC<ChestModalProps> = ({
  chestType,
  puzzle,
  truthUnlocked,
  liesUnlocked,
  unknownUnlocked,
  awardedLetter,
  onUnlock,
  onApplyPenalty,
  onClose,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Check strict sequential prerequisites
  const isPrerequisiteMet =
    chestType === 'TRUTH'
      ? true
      : chestType === 'LIES'
      ? truthUnlocked
      : liesUnlocked;

  const isCurrentChestUnlocked =
    chestType === 'TRUTH'
      ? truthUnlocked
      : chestType === 'LIES'
      ? liesUnlocked
      : unknownUnlocked;

  useEffect(() => {
    inputRef.current?.focus();
  }, [chestType, isPrerequisiteMet]);

  // Keyboard navigation
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
  }, [inputValue, isPrerequisiteMet, isCurrentChestUnlocked]);

  const handleSubmit = () => {
    if (!isPrerequisiteMet || isCurrentChestUnlocked) return;
    const cleanInput = inputValue.trim().toUpperCase();

    if (!cleanInput) {
      setErrorMessage('Input required before submission.');
      return;
    }

    if (chestType === 'TRUTH') {
      const numericVal = parseInt(cleanInput, 10);
      if (numericVal === puzzle.truth.decimalAnswer) {
        soundManager.playChestUnlatch();
        setSuccessMessage(puzzle.truth.rewardMessage);
        setErrorMessage(null);
        setTimeout(() => {
          onUnlock('TRUTH');
        }, 1200);
      } else {
        triggerWrongAnswer(
          `INCORRECT VALUE. Binary [${puzzle.truth.binaryString}] does not equal ${cleanInput}. +15s penalty applied.`
        );
      }
    } else if (chestType === 'LIES') {
      if (cleanInput === puzzle.lies.answer) {
        soundManager.playChestUnlatch();
        setSuccessMessage(puzzle.lies.rewardMessage);
        setErrorMessage(null);
        setTimeout(() => {
          onUnlock('LIES');
        }, 1200);
      } else {
        triggerWrongAnswer(
          `DECEPTION DETECTED. Digit "${cleanInput}" failed checksum validation. +15s penalty applied.`
        );
      }
    } else if (chestType === 'UNKNOWN') {
      if (cleanInput === puzzle.unknown.awardedLetter.toUpperCase()) {
        soundManager.playChestUnlatch();
        soundManager.playVictoryFanfare();
        setSuccessMessage(puzzle.unknown.rewardMessage);
        setErrorMessage(null);
        setTimeout(() => {
          onUnlock('UNKNOWN', puzzle.unknown.awardedLetter);
        }, 1400);
      } else {
        triggerWrongAnswer(
          `CIPHER MISMATCH. Letter "${cleanInput}" did not solve the unknown equation. +15s penalty applied.`
        );
      }
    }
  };

  const triggerWrongAnswer = (msg: string) => {
    soundManager.playWrongBuzzer();
    onApplyPenalty(15);
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Color theme by chest
  const theme =
    chestType === 'TRUTH'
      ? {
          primary: 'cyan',
          border: 'border-cyan-500',
          bgGlow: 'bg-cyan-500/10',
          textAccent: 'text-cyan-400',
          badgeBg: 'bg-cyan-950/80',
          btnBg: 'bg-cyan-600 hover:bg-cyan-500',
        }
      : chestType === 'LIES'
      ? {
          primary: 'amber',
          border: 'border-amber-500',
          bgGlow: 'bg-amber-500/10',
          textAccent: 'text-amber-400',
          badgeBg: 'bg-amber-950/80',
          btnBg: 'bg-amber-600 hover:bg-amber-500',
        }
      : {
          primary: 'purple',
          border: 'border-purple-500',
          bgGlow: 'bg-purple-500/10',
          textAccent: 'text-purple-400',
          badgeBg: 'bg-purple-950/80',
          btnBg: 'bg-purple-600 hover:bg-purple-500',
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none font-sans">
      <div
        className={`relative w-full max-w-lg bg-slate-950 border-2 ${theme.border} rounded-3xl shadow-2xl overflow-hidden ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Top Header Strip */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.badgeBg} border ${theme.border} ${theme.textAccent}`}>
              {isCurrentChestUnlocked ? (
                <Unlock className="w-5 h-5 text-emerald-400" />
              ) : isPrerequisiteMet ? (
                <Lock className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <div className="text-[10px] font-mono-code uppercase tracking-widest text-slate-400">
                SECTOR 04 // PEDESTAL CHEST
              </div>
              <h2 className="text-xl font-tech font-black tracking-wider text-white uppercase flex items-center gap-2">
                CHEST: <span className={theme.textAccent}>{chestType}</span>
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
        <div className="p-6 space-y-5">
          {/* PREREQUISITE LOCKOUT STATE */}
          {!isPrerequisiteMet && (
            <div className="p-5 rounded-2xl bg-red-950/70 border border-red-500/80 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-900/60 border border-red-500 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-tech font-bold text-red-300 uppercase tracking-widest text-base">
                  ACCESS DENIED: SEQUENTIAL LOCKOUT
                </h3>
                <p className="text-sm font-mono-code text-red-200">
                  {chestType === 'LIES'
                    ? 'LOCKED: Requires clearance from the TRUTH chest.'
                    : 'LOCKED: Requires clearance from the LIES chest.'}
                </p>
              </div>
              <div className="pt-2 text-xs font-mono-code text-slate-400 border-t border-red-900/60">
                {chestType === 'LIES'
                  ? 'Resolve the 4-bit binary challenge on the TRUTH chest to disengage this mechanism.'
                  : 'Resolve the deductive riddle on the LIES chest to unseal this mysterious container.'}
              </div>
            </div>
          )}

          {/* ALREADY UNLOCKED STATE */}
          {isCurrentChestUnlocked && (
            <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/80 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-900/60 border border-emerald-500 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-tech font-bold text-emerald-300 uppercase tracking-widest text-base">
                  CHEST UNLATCHED // VERIFIED
                </h3>
                <p className="text-sm font-mono-code text-emerald-100">
                  {chestType === 'TRUTH' && `Clearance 1 Active. Binary value accepted (${puzzle.truth.decimalAnswer}).`}
                  {chestType === 'LIES' && `Clearance 2 Active. Key digit accepted (${puzzle.lies.answer}).`}
                  {chestType === 'UNKNOWN' && (
                    <span className="flex items-center justify-center gap-2">
                      Alphabet Glyph Acquired:{' '}
                      <strong className="text-2xl text-purple-300 font-black">
                        [ {awardedLetter || puzzle.unknown.awardedLetter} ]
                      </strong>
                    </span>
                  )}
                </p>
              </div>
              {chestType === 'UNKNOWN' && (
                <div className="p-3 bg-purple-950/80 border border-purple-500/60 rounded-xl text-xs font-mono-code text-purple-200">
                  Submit this letter to the North Mathematical Wall terminal to reveal the hidden door!
                </div>
              )}
            </div>
          )}

          {/* ACTIVE PUZZLE STATE */}
          {isPrerequisiteMet && !isCurrentChestUnlocked && (
            <div className="space-y-4">
              {/* Question / Challenge Box */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-code">
                  <span className={`${theme.textAccent} font-bold flex items-center gap-1.5`}>
                    {chestType === 'TRUTH' && <Binary className="w-4 h-4" />}
                    {chestType === 'LIES' && <HelpCircle className="w-4 h-4" />}
                    {chestType === 'UNKNOWN' && <Sparkles className="w-4 h-4" />}
                    CHALLENGE OBJECTIVE
                  </span>
                  <span className="text-slate-400">Step 4 Sequential Lock</span>
                </div>

                {chestType === 'TRUTH' && (
                  <div className="space-y-3">
                    <p className="text-xs md:text-sm font-mono-code text-slate-200 leading-relaxed">
                      {puzzle.truth.question}
                    </p>
                    <div className="flex items-center justify-center gap-2 py-2 bg-slate-950 rounded-xl border border-cyan-500/40">
                      {puzzle.truth.binaryString.split('').map((bit, idx) => (
                        <div
                          key={idx}
                          className="w-10 h-12 bg-slate-900 border-2 border-cyan-500/70 rounded-lg flex flex-col items-center justify-center text-cyan-300 font-mono-code"
                        >
                          <span className="text-lg font-black">{bit}</span>
                          <span className="text-[9px] text-slate-500">2^{3 - idx}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {chestType === 'LIES' && (
                  <div className="space-y-2">
                    <div className="text-xs font-tech font-bold text-amber-400 uppercase">
                      {puzzle.lies.title}
                    </div>
                    <p className="text-xs md:text-sm font-mono-code text-slate-200 leading-relaxed">
                      {puzzle.lies.question}
                    </p>
                  </div>
                )}

                {chestType === 'UNKNOWN' && (
                  <div className="space-y-2">
                    <div className="text-xs font-tech font-bold text-purple-400 uppercase">
                      {puzzle.unknown.title}
                    </div>
                    <p className="text-xs md:text-sm font-mono-code text-slate-200 leading-relaxed">
                      {puzzle.unknown.question}
                    </p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="space-y-3">
                <label className="block text-xs font-mono-code text-slate-300">
                  {chestType === 'TRUTH' && 'Enter Decimal Equivalent (0 - 15):'}
                  {chestType === 'LIES' && 'Enter Single Digit Logic Key (0 - 9):'}
                  {chestType === 'UNKNOWN' && 'Enter Alphabet Letter Glyph (A - Z):'}
                </label>

                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    maxLength={chestType === 'TRUTH' ? 2 : 1}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={chestType === 'UNKNOWN' ? 'A-Z' : '0-9'}
                    className={`flex-1 px-4 py-3 bg-slate-900 border-2 ${theme.border} rounded-xl text-center text-xl font-mono-code font-bold text-white focus:outline-none focus:ring-2 focus:ring-${theme.primary}-400 uppercase placeholder:text-slate-600`}
                  />

                  <button
                    onClick={handleSubmit}
                    className={`px-6 py-3 ${theme.btnBg} text-slate-950 font-tech font-bold text-sm tracking-widest uppercase rounded-xl shadow-lg transition active:scale-95 cursor-pointer`}
                  >
                    SUBMIT
                  </button>
                </div>

                {/* Quick Keypad for Chest 2 (Single digit) */}
                {chestType === 'LIES' && (
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                      <button
                        key={digit}
                        onClick={() => {
                          setInputValue(digit.toString());
                          soundManager.playKeypadClick(digit.toString());
                        }}
                        className="py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono-code font-bold text-slate-200 hover:text-amber-400 transition cursor-pointer"
                      >
                        {digit}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback messages */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/80 text-xs font-mono-code text-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-xs font-mono-code text-emerald-200 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Hint Accordion */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1.5 text-xs font-mono-code text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showHint ? 'Hide Hint' : 'Request Security Decryption Hint'}</span>
                </button>

                {showHint && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-code text-slate-300">
                    {chestType === 'TRUTH' && puzzle.truth.hint}
                    {chestType === 'LIES' && puzzle.lies.hint}
                    {chestType === 'UNKNOWN' && puzzle.unknown.hint}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono-code text-slate-400">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Keyboard: [Enter] submit / [Esc] back</span>
            </span>
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
