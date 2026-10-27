import React, { useState, useEffect } from 'react';
import { AptitudeQuestion } from '../types/game';
import { soundManager } from '../utils/audio';
import { X, ShieldCheck, AlertTriangle, Clock, HelpCircle, Lock, ArrowRight } from 'lucide-react';

interface QuestionModalProps {
  question: AptitudeQuestion;
  wrongAnswersCount: number;
  lockoutEndTime: number | null;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
  onClose: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  wrongAnswersCount,
  lockoutEndTime,
  onCorrectAnswer,
  onWrongAnswer,
  onClose,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answeredState, setAnsweredState] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    const updateLockout = () => {
      if (!lockoutEndTime) {
        setSecondsRemaining(0);
        return;
      }
      const diff = Math.ceil((lockoutEndTime - Date.now()) / 1000);
      if (diff > 0) {
        setSecondsRemaining(diff);
      } else {
        setSecondsRemaining(0);
      }
    };

    updateLockout();
    const interval = setInterval(updateLockout, 500);
    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  const isLockedOut = secondsRemaining > 0;

  const handleSelectOption = (index: number) => {
    if (isLockedOut || answeredState !== 'IDLE') return;
    setSelectedIdx(index);

    if (index === question.correctIndex) {
      setAnsweredState('CORRECT');
      soundManager.playKeypadSuccess();
      setTimeout(() => {
        onCorrectAnswer();
      }, 1500);
    } else {
      setAnsweredState('WRONG');
      soundManager.playWrongBuzzer();
      setTimeout(() => {
        onWrongAnswer();
        setAnsweredState('IDLE');
        setSelectedIdx(null);
      }, 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none font-mono-code select-none">
      <div className="relative w-full max-w-xl bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-tech font-bold text-slate-100 tracking-wider uppercase text-sm">
                Door 1 Security Airlock
              </h3>
              <p className="text-[10px] font-mono-code text-cyan-400">
                Hacker Cipher // Solve the Series to Access Room 2
              </p>
            </div>
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
          {/* Lockout Warning Banner */}
          {isLockedOut ? (
            <div className="bg-red-950/70 border-2 border-red-500 rounded-xl p-5 flex flex-col items-center text-center space-y-2.5 animate-pulse">
              <Lock className="w-10 h-10 text-red-400" />
              <h4 className="font-tech font-bold text-red-300 text-lg uppercase tracking-wide">
                ALARM! Wrong Answer Lockout Active
              </h4>
              <p className="text-xs text-red-200 font-sans">
                Security terminal reboot in progress. Wait before attempting next series challenge.
              </p>
              <div className="flex items-center gap-2 text-2xl font-mono-code font-bold text-red-400 bg-red-900/60 px-4 py-1.5 rounded-lg border border-red-700">
                <Clock className="w-5 h-5" />
                <span>{secondsRemaining}s</span>
              </div>
              {wrongAnswersCount >= 3 && (
                <div className="text-[11px] font-mono-code text-amber-300 bg-amber-950/80 px-3 py-1 rounded border border-amber-700">
                  ⚠️ 3+ Wrong Answers: +30s Time Penalty Applied!
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Question Category & Penalty Stats */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-code px-2.5 py-1 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-semibold uppercase">
                  Cipher Type: {question.category}
                </span>
                <span className="text-xs font-mono-code text-slate-400">
                  Fails: <span className="text-red-400 font-bold">{wrongAnswersCount}</span>
                </span>
              </div>

              {/* Question Text */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed font-sans">
                    {question.question}
                  </p>
                </div>
              </div>

              {/* Status Alert if answered */}
              {answeredState === 'CORRECT' && (
                <div className="p-3 bg-green-950/80 border border-green-500 text-green-300 rounded-xl text-xs font-mono-code">
                  <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                    <span>SERIES VERIFIED // ACCESS TO ROOM 2 GRANTED!</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>{question.explanation}</div>
                </div>
              )}

              {answeredState === 'WRONG' && (
                <div className="p-3 bg-red-950/80 border border-red-500 text-red-300 rounded-xl text-xs font-mono-code animate-pulse">
                  <div className="font-bold text-sm mb-1">ALARM! WRONG ANSWER!</div>
                  <div>15-second security lockout triggered.</div>
                </div>
              )}

              {/* 4 Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {question.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedIdx === idx;
                  const isCorrect = idx === question.correctIndex;

                  let btnStyle = 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-200 cursor-pointer';
                  if (answeredState === 'CORRECT' && isCorrect) {
                    btnStyle = 'bg-green-950 border-green-500 text-green-300';
                  } else if (answeredState === 'WRONG' && isSelected) {
                    btnStyle = 'bg-red-950 border-red-500 text-red-300';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={answeredState !== 'IDLE'}
                      className={`p-3.5 rounded-xl border text-left font-mono-code text-sm transition-all flex items-center gap-3 active:scale-98 ${btnStyle}`}
                    >
                      <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">
                        {letter}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] font-mono-code text-slate-500">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Solve the sequence to release the magnetic latch.
                </span>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Back to Room [Esc]
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
