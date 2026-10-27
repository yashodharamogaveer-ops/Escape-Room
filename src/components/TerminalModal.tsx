import React, { useState, useRef, useEffect } from 'react';
import { DebugProgram } from '../types/game';
import { executeCodeInWorker } from '../utils/codeRunner';
import { soundManager } from '../utils/audio';
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Lightbulb,
  X,
  CheckCircle,
  Clock,
  TerminalSquare,
  FileText,
} from 'lucide-react';

interface TerminalModalProps {
  program: DebugProgram;
  elapsedSeconds: number;
  hintsUsedCount: number;
  attemptsCount: number;
  initialCode: string;
  isUnlocked: boolean;
  onCodeChange: (newCode: string) => void;
  onSuccess: (dataFragment: string) => void;
  onUseHint: () => void;
  onAttempt: () => void;
  onClose: () => void;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({
  program,
  elapsedSeconds,
  hintsUsedCount,
  attemptsCount,
  initialCode,
  isUnlocked,
  onCodeChange,
  onSuccess,
  onUseHint,
  onAttempt,
  onClose,
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [consoleOutput, setConsoleOutput] = useState<string>(
    '# Real Python sandbox ready.\n# Read the code, find the bug, fix it, then press [RUN PROGRAM] (or Ctrl+Enter).'
  );
  const [isSuccess, setIsSuccess] = useState<boolean>(isUnlocked);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState<number>(hintsUsedCount);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleCodeInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onCodeChange(newCode);
    soundManager.playTerminalKeypress();
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLastError(null);
    onAttempt();
    soundManager.playTerminalKeypress();

    setConsoleOutput('# Running your program with real Python... (the first run may take a few seconds while Python loads)');

    const result = await executeCodeInWorker(code, 4000);
    setIsRunning(false);

    if (!result.success) {
      soundManager.playWrongBuzzer();
      const errText = result.error || 'Execution failed with runtime exception.';
      setLastError(errText);
      setConsoleOutput(
        `> EXCEPTION ENCOUNTERED:\n${errText}\n\n${result.logs ? `Captured logs prior to failure:\n${result.logs}` : ''}`
      );
      return;
    }

    const trimmedOutput = (result.logs || '').trim();

    // Anti-cheat: the player must fix the program, not just print the answer.
    const missing = program.requiredSnippets.find((snippet) => !code.includes(snippet));
    const hardcoded = code.includes(program.expectedOutput);

    if (trimmedOutput === program.expectedOutput && (missing || hardcoded)) {
      soundManager.playWrongBuzzer();
      setConsoleOutput(
        `> PROGRAM OUTPUT: ${trimmedOutput}\n\n[!] INTEGRITY CHECK FAILED: the program must produce the key by itself.\nDo not type the answer into the code - fix the bug instead${missing ? ` (keep: ${missing})` : ''}.`
      );
      return;
    }

    if (trimmedOutput === program.expectedOutput) {
      setIsSuccess(true);
      soundManager.playKeypadSuccess();
      setConsoleOutput(
        `> PROGRAM OUTPUT: ${trimmedOutput}\n\n[OK] ACCESS GRANTED!\n\n========================================\n[ NOTE MESSAGE SAVED TO INVENTORY ]\nSecurity Decryption Key: ${program.expectedOutput}\nThe airlock to Sector 04 is now UNLOCKED. Close this terminal [Esc] and walk through the door.\n========================================`
      );
      onSuccess(program.expectedOutput);
    } else {
      soundManager.playWrongBuzzer();
      setConsoleOutput(
        `> PROGRAM OUTPUT: ${trimmedOutput || '(no print output)'}\n\n[!] The program ran, but this is not the correct key.\nThere is still a logic bug. Re-read each line and trace the values by hand. Use a hint if you are stuck (+20s).`
      );
    }
  };

  const handleReset = () => {
    setCode(program.buggyCode);
    onCodeChange(program.buggyCode);
    setLastError(null);
    setConsoleOutput('# Code restored to original state.');
    soundManager.playTerminalKeypress();
  };

  const handleRequestHint = () => {
    if (hintsRevealed >= 2) return;
    const nextCount = hintsRevealed + 1;
    setHintsRevealed(nextCount);
    onUseHint();
    soundManager.playTerminalKeypress();
  };

  const lines = code.split('\n');
  const lineNumbers = lines.map((_, i) => i + 1).join('\n');

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/90 backdrop-blur-none select-none font-mono-code">
      <div className={`relative w-full max-w-5xl h-[92vh] max-h-[920px] bg-[#070d0a] border-2 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isSuccess ? 'border-green-500 shadow-green-950/50' : 'border-emerald-700/80'
      }`}>
        <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

        {/* Top Terminal Bar */}
        <div className="px-4 py-3 bg-[#0a1410] border-b border-emerald-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs md:text-sm tracking-wide">
              <TerminalIcon className="w-4 h-4" />
              <span>TERMINAL // {program.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-emerald-500/80">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Time: {formatTime(elapsedSeconds)}</span>
            </div>
            <div className="hidden sm:inline-block">
              Attempts: <span className="text-emerald-300 font-bold">{attemptsCount}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-emerald-950/80 text-emerald-400 hover:text-white rounded-lg transition cursor-pointer"
              title="Close Terminal [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Goal description */}
        <div className="px-4 py-2 bg-[#08120e] border-b border-emerald-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-emerald-300/90 font-sans">
            <strong className="text-white font-mono-code">GOAL:</strong> Debug the Python program. Once fixed, a 4-digit code note message will be generated!
          </div>
          <div className="text-[11px] text-emerald-500">
            {program.description}
          </div>
        </div>

        {/* Code Editor + Output Console */}
        <div className="flex-1 min-h-0 grid grid-rows-[1fr_210px] md:grid-rows-[1fr_240px] gap-2 p-3 overflow-hidden">
          <div className="relative flex rounded-xl border border-emerald-900/80 bg-[#040806] overflow-hidden focus-within:border-emerald-500 transition-colors">
            <div className="w-10 md:w-12 py-3 px-1 text-right text-emerald-800 text-xs select-none border-r border-emerald-950 bg-[#060b08] leading-[1.6]">
              <pre className="font-mono-code">{lineNumbers}</pre>
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeInput}
              onKeyDown={(e) => {
                // Tab inserts 4 spaces (Python is indentation-sensitive)
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const el = e.currentTarget;
                  const { selectionStart, selectionEnd } = el;
                  const next = code.slice(0, selectionStart) + '    ' + code.slice(selectionEnd);
                  setCode(next);
                  onCodeChange(next);
                  requestAnimationFrame(() => {
                    el.selectionStart = el.selectionEnd = selectionStart + 4;
                  });
                }
              }}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              className="flex-1 w-full p-3 bg-transparent text-emerald-300 text-xs md:text-sm font-mono-code leading-[1.6] outline-none resize-none overflow-y-auto selection:bg-emerald-800 selection:text-white"
              style={{ tabSize: 4 }}
            />
          </div>

          <div className="flex flex-col rounded-xl border border-emerald-900/80 bg-[#030605] overflow-hidden">
            <div className="px-3 py-1.5 bg-[#08120d] border-b border-emerald-950 flex items-center justify-between text-xs text-emerald-400 font-bold shrink-0">
              <div className="flex items-center gap-1.5">
                <TerminalSquare className="w-3.5 h-3.5" />
                <span>EXECUTION OUTPUT</span>
              </div>
              {isSuccess && (
                <div className="flex items-center gap-1 text-green-400 text-xs uppercase animate-pulse">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>4-Digit Note Saved</span>
                </div>
              )}
            </div>

            <div className="flex-1 p-3 overflow-y-auto text-xs font-mono-code leading-relaxed">
              <pre
                className={`whitespace-pre-wrap ${
                  isSuccess
                    ? 'text-green-300 font-semibold'
                    : lastError
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}
              >
                {consoleOutput}
              </pre>
            </div>
          </div>
        </div>

        {/* Hints */}
        {hintsRevealed > 0 && (
          <div className="px-4 py-2 bg-amber-950/40 border-t border-amber-900/80 text-xs text-amber-200 shrink-0 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>HINT (+{hintsRevealed * 20}s Penalty Applied)</span>
            </div>
            <p className="text-[11px] text-amber-300/90 font-sans">
              <strong>Hint 1:</strong> {program.hint1}
            </p>
            {hintsRevealed >= 2 && (
              <p className="text-[11px] text-amber-200 font-sans">
                <strong>Hint 2:</strong> {program.hint2}
              </p>
            )}
          </div>
        )}

        {/* Note message banner if unlocked */}
        {isSuccess && (
          <div className="px-4 py-2.5 bg-green-950/70 border-t border-green-700 text-xs text-green-200 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-400 shrink-0" />
              <span>NOTE SAVED: Decryption Fragment <strong>[{program.expectedOutput}]</strong> logged in inventory for Room 3 Vault!</span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="p-3 bg-[#0a1410] border-t border-emerald-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={isRunning || isSuccess}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
                isSuccess
                  ? 'bg-green-600 text-slate-950 cursor-default'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSuccess ? 'Verified' : isRunning ? 'Running Python...' : 'Run Program'}</span>
            </button>

            <button
              onClick={handleReset}
              disabled={isRunning || isSuccess}
              className="px-3.5 py-2.5 bg-[#12221b] hover:bg-[#182e25] border border-emerald-800/80 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleRequestHint}
              disabled={hintsRevealed >= 2 || isSuccess}
              className={`px-3.5 py-2.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                hintsRevealed >= 2
                  ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-800 text-amber-300 cursor-pointer'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>
                {hintsRevealed === 0
                  ? 'Get Hint (+20s)'
                  : hintsRevealed === 1
                  ? 'Detailed Hint (+20s)'
                  : 'All Hints Used'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[11px] text-emerald-600">
              Ctrl+Enter to Run • Esc to Close
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close [Esc]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
