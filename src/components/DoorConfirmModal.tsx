import React, { useEffect } from 'react';
import { MazeDoor } from '../game/doorMazeGenerator';
import { DoorClosed, Check, X, AlertTriangle } from 'lucide-react';

interface DoorConfirmModalProps {
  door: MazeDoor;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DoorConfirmModal: React.FC<DoorConfirmModalProps> = ({ door, onConfirm, onCancel }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') {
        onConfirm();
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  const colorHex = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
  }[door.color];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none select-none font-mono-code">
      <div className="relative w-full max-w-md bg-slate-950 border-2 border-amber-600/80 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <DoorClosed className="w-6 h-6 text-amber-400" />
          <div>
            <h3 className="font-tech font-bold text-white text-base uppercase">
              Choose This Door?
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Press [Y] to open or [N] / [Esc] to cancel.
            </p>
          </div>
        </div>

        {/* Door identity display */}
        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-16 rounded-lg flex flex-col items-center justify-center border-2 shadow-lg"
              style={{ backgroundColor: colorHex, borderColor: '#ffffff' }}
            >
              <span className="text-white text-xs font-bold uppercase">{door.symbol[0]}</span>
              <span className="text-white text-lg font-black">{door.number}</span>
            </div>
            <div>
              <div className="font-tech font-bold text-white text-sm uppercase">
                {door.positionLabel}
              </div>
              <div className="text-xs text-slate-400">
                Color: <span className="font-bold text-white capitalize">{door.color}</span> • Symbol: <span className="font-bold text-white capitalize">{door.symbol}</span>
              </div>
              <div className="text-xs text-amber-400 font-bold">
                Door #{door.number}
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-amber-300/90 font-sans bg-amber-950/40 border border-amber-800/80 p-3 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Warning: Choosing the wrong door triggers security damage and sends you back one round!
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-tech font-bold text-sm uppercase rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Yes, Open Door (Y)</span>
          </button>

          <button
            onClick={onCancel}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel (N)
          </button>
        </div>
      </div>
    </div>
  );
};
