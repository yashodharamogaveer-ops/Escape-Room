import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/audio';
import { X, Key, Lock, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Room3KeypadModalProps {
  expectedCode: string;
  dataFragment: string | null;
  hasKey: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const Room3KeypadModal: React.FC<Room3KeypadModalProps> = ({
  expectedCode,
  dataFragment,
  hasKey,
  onSuccess,
  onClose,
}) => {
  const [inputCode, setInputCode] = useState<string>('');
  const [status, setStatus] = useState<string>(
    hasKey
      ? 'ENTER DATA FRAGMENT CODE TO BREACH LAST DOOR'
      : 'MASTER KEY MISSING! High-value key required for the Last Door.'
  );
  const [isError, setIsError] = useState<boolean>(!hasKey);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

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
  });

  const handleSubmit = () => {
    if (isSuccess) return;

    if (!hasKey) {
      setIsError(true);
      setStatus('ACCESS BLOCKED: You need the Master Key from Room 1 to disengage this vault!');
      soundManager.playWrongBuzzer();
      return;
    }

    const cleanInput = inputCode.trim().toUpperCase();
    const cleanExpected = expectedCode.trim().toUpperCase();

    if (cleanInput === cleanExpected) {
      setIsSuccess(true);
      setIsError(false);
      setStatus('ALL CREDENTIALS ACCEPTED // LAST DOOR BREACHED!');
      soundManager.playVictoryFanfare();
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setIsError(true);
      setStatus('INVALID DATA FRAGMENT // ACCESS DENIED');
      soundManager.playWrongBuzzer();
    }
  };

  const handlePasteFragment = () => {
    if (dataFragment) {
      setInputCode(dataFragment);
      soundManager.playTerminalKeypress();
      setIsError(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none font-mono-code select-none">
      <div className="relative w-full max-w-md bg-slate-950 border-2 border-cyan-500/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h3 className="font-tech font-bold text-slate-100 tracking-wider uppercase text-sm">
              Room 3: The Last Door Vault
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Close [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Dual Security Requirement Status */}
          <div className="space-y-2">
            {/* 1. Master Key Status */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              hasKey
                ? 'bg-amber-950/50 border-amber-500/70 text-amber-200'
                : 'bg-red-950/60 border-red-500 text-red-200 animate-pulse'
            }`}>
              <div className="flex items-center gap-2">
                <Key className={`w-4 h-4 ${hasKey ? 'text-amber-400' : 'text-red-400'}`} />
                <span>
                  {hasKey ? '1. Master Key: Inserted & Turned' : '1. Master Key: MISSING! Required for Last Door'}
                </span>
              </div>
              {hasKey ? (
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
            </div>

            {/* 2. Data Fragment Status */}
            <div className="p-3 bg-cyan-950/50 border border-cyan-800/80 rounded-xl flex items-center justify-between text-xs text-cyan-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>
                  2. Data Fragment: {dataFragment ? <strong className="text-white tracking-widest">{dataFragment}</strong> : 'Pending code'}
                </span>
              </div>
              {dataFragment && (
                <button
                  onClick={handlePasteFragment}
                  className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded text-[10px] uppercase cursor-pointer"
                >
                  Autofill
                </button>
              )}
            </div>
          </div>

          {/* Input field */}
          <div className="space-y-1.5">
            <div className={`text-[11px] font-bold ${
              isSuccess ? 'text-green-400' : isError ? 'text-red-400' : 'text-slate-400'
            }`}>
              {status}
            </div>

            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value.toUpperCase());
                setIsError(false);
                soundManager.playTerminalKeypress();
              }}
              placeholder="ENTER FRAGMENT (e.g. 7342)"
              autoFocus
              disabled={isSuccess}
              className={`w-full p-3.5 rounded-xl border-2 bg-slate-900 text-center font-mono-code text-2xl font-bold tracking-widest text-cyan-300 uppercase outline-none transition-all ${
                isSuccess
                  ? 'border-green-500 bg-green-950/40 text-green-300'
                  : isError
                  ? 'border-red-500 bg-red-950/40 text-red-300 animate-pulse'
                  : 'border-slate-700 focus:border-cyan-400'
              }`}
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!inputCode || isSuccess}
              className={`flex-1 py-3 font-tech font-bold text-sm tracking-wider uppercase rounded-xl shadow-lg transition active:scale-98 ${
                isSuccess
                  ? 'bg-green-600 text-slate-950 cursor-default'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer disabled:bg-slate-800 disabled:text-slate-500'
              }`}
            >
              {isSuccess ? 'Vault Breached!' : 'Open Last Door'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
