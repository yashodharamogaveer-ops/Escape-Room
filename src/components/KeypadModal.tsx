import React, { useState, useEffect, useCallback } from 'react';
import { BoxPuzzleData, COLOR_CONFIGS } from '../types/game';
import { soundManager } from '../utils/audio';
import { X, Key, ShieldAlert, CheckCircle, Delete } from 'lucide-react';

interface KeypadModalProps {
  puzzleData: BoxPuzzleData;
  isUnlocked: boolean;
  hasKey: boolean;
  onSuccessUnlock: () => void;
  onTakeKey: () => void;
  onClose: () => void;
}

export const KeypadModal: React.FC<KeypadModalProps> = ({
  puzzleData,
  isUnlocked,
  hasKey,
  onSuccessUnlock,
  onTakeKey,
  onClose,
}) => {
  const [inputCode, setInputCode] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('ENTER 4-DIGIT SECURITY CODE');
  const [isError, setIsError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(isUnlocked);

  const handleDigit = useCallback((digit: string) => {
    if (isSuccess || inputCode.length >= 4) return;
    soundManager.playKeypadClick(digit);
    setInputCode(prev => prev + digit);
    setIsError(false);
  }, [inputCode, isSuccess]);

  const handleClear = useCallback(() => {
    soundManager.playKeypadClick('0');
    setInputCode('');
    setIsError(false);
    setStatusMessage('ENTER 4-DIGIT SECURITY CODE');
  }, []);

  const handleDelete = useCallback(() => {
    if (inputCode.length === 0) return;
    soundManager.playKeypadClick('0');
    setInputCode(prev => prev.slice(0, -1));
    setIsError(false);
  }, [inputCode]);

  const handleSubmit = useCallback(() => {
    if (inputCode.length !== 4) {
      setIsError(true);
      setStatusMessage('CODE MUST BE 4 DIGITS');
      soundManager.playWrongBuzzer();
      return;
    }

    if (inputCode === puzzleData.correctCode) {
      setIsSuccess(true);
      setIsError(false);
      setStatusMessage('ACCESS GRANTED // KEY RETRIEVED');
      onSuccessUnlock();
    } else {
      setIsError(true);
      setStatusMessage('WRONG CODE // ACCESS DENIED');
      soundManager.playWrongBuzzer();
      setTimeout(() => {
        setInputCode('');
      }, 700);
    }
  }, [inputCode, puzzleData.correctCode, onSuccessUnlock]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleSubmit, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none">
      <div className="relative w-full max-w-md bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="font-tech font-bold text-slate-100 tracking-wider uppercase text-sm">
              Level 13 Security Box
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            title="Close [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Taped Sticky Note on the box with Scrambled Colored Digits */}
          <div className="bg-amber-100 border-2 border-amber-300 rounded-xl p-3 text-slate-900 shadow-md">
            <div className="text-[11px] font-mono-code font-bold tracking-wider text-slate-800 text-center uppercase border-b border-amber-300/80 pb-1 mb-2">
              Taped Memo Found On Box (Scrambled Order)
            </div>

            <div className="grid grid-cols-4 gap-2">
              {puzzleData.scrambledDigits.map((item, idx) => {
                const conf = COLOR_CONFIGS[item.color];
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center p-2 rounded-lg text-white font-mono-code font-bold shadow-sm"
                    style={{ backgroundColor: conf.hex }}
                  >
                    <span className="text-2xl leading-none">{item.digit}</span>
                    <span className="text-[9px] uppercase tracking-wider mt-0.5 opacity-90">
                      {conf.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-amber-900 text-center font-medium mt-2">
              Notice: The color order here is wrong. Check the wall painting to find the correct 1st, 2nd, 3rd, and 4th colors!
            </p>
          </div>

          {/* Keypad Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center">
            <div className={`text-xs font-mono-code font-bold tracking-wider mb-2.5 ${
              isSuccess ? 'text-green-400' : isError ? 'text-red-400' : 'text-slate-400'
            }`}>
              {statusMessage}
            </div>

            {/* 4 Digit Boxes */}
            <div className="flex gap-2.5 justify-center">
              {[0, 1, 2, 3].map((slotIdx) => {
                const char = inputCode[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    className={`w-12 h-14 rounded-lg flex items-center justify-center text-2xl font-mono-code font-bold border-2 transition-all ${
                      isSuccess
                        ? 'bg-green-950/60 border-green-500 text-green-300'
                        : isError
                        ? 'bg-red-950/60 border-red-500 text-red-300 animate-pulse'
                        : char
                        ? 'bg-slate-800 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {char || '•'}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Keypad Buttons (0-9, Clear, Enter) */}
          {!isSuccess ? (
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigit(digit)}
                  className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-mono-code font-bold text-lg rounded-xl active:scale-95 transition"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="py-3 bg-slate-900 hover:bg-red-950/50 border border-slate-800 hover:border-red-800 text-red-400 font-mono-code font-bold text-sm rounded-xl active:scale-95 transition flex items-center justify-center gap-1"
                title="Clear all"
              >
                CLR
              </button>
              <button
                onClick={() => handleDigit('0')}
                className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-mono-code font-bold text-lg rounded-xl active:scale-95 transition"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono-code font-bold text-sm rounded-xl active:scale-95 transition flex items-center justify-center"
                title="Delete"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                onClick={handleSubmit}
                disabled={inputCode.length !== 4}
                className="col-span-3 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 disabled:cursor-not-allowed font-tech font-bold text-base tracking-wider rounded-xl uppercase active:scale-98 transition shadow-lg"
              >
                Submit Code
              </button>
            </div>
          ) : (
            <div className="bg-green-950/50 border border-green-800 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-green-400" />
              <div>
                <h4 className="font-tech font-bold text-green-300 text-base">
                  Security Box Unlocked!
                </h4>
                <p className="text-xs text-green-200/90 mt-1">
                  You overcame the color cipher hurdles! The lid swings open, revealing the <strong className="text-amber-400">Master Brass Key</strong>.
                </p>
                <div className="mt-2 text-[11px] font-mono-code text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-800/80">
                  ★ High-Value Item: This Master Key is required for the LAST DOOR in Room 3!
                </div>
              </div>

              {!hasKey ? (
                <button
                  onClick={() => {
                    onTakeKey();
                    onClose();
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-tech font-bold text-sm rounded-xl uppercase flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  Take Master Key & Add to Inventory
                </button>
              ) : (
                <div className="text-xs font-mono-code text-amber-400 flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  Master Key is safely in your inventory for the final vault!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
