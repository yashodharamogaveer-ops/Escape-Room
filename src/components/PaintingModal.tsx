import React, { useEffect } from 'react';
import { ColorName, COLOR_CONFIGS } from '../types/game';
import { X, Palette, Info } from 'lucide-react';

interface PaintingModalProps {
  colorOrder: ColorName[];
  onClose: () => void;
}

export const PaintingModal: React.FC<PaintingModalProps> = ({ colorOrder, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none">
      <div className="relative w-full max-w-xl bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-purple-400" />
            <h3 className="font-tech font-bold text-slate-100 tracking-wider uppercase text-sm">
              Wall Artwork Inspection: "The Four Spectrums"
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

        <div className="p-6 space-y-5">
          {/* Ornate Frame Canvas Representation */}
          <div className="p-4 bg-stone-900 border-4 border-stone-800 rounded-xl shadow-inner">
            <div className="grid grid-cols-4 gap-3 h-52">
              {colorOrder.map((colorName, idx) => {
                const conf = COLOR_CONFIGS[colorName];
                return (
                  <div
                    key={idx}
                    className="relative rounded-lg flex flex-col items-center justify-between p-3 shadow-lg border border-white/20"
                    style={{
                      background: `linear-gradient(180deg, ${conf.hex} 0%, #0a0c10 100%)`,
                    }}
                  >
                    {/* Order indicator */}
                    <div className="w-8 h-8 rounded-full bg-black/60 border border-white/40 flex items-center justify-center text-white font-mono-code font-bold text-base shadow">
                      {idx + 1}
                    </div>

                    {/* Geometric accent */}
                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <div className="w-4 h-4 rotate-45 bg-white/30" />
                    </div>

                    {/* Color label */}
                    <div className="text-[11px] font-mono-code font-bold text-white uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded border border-white/10">
                      {conf.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plaque / Puzzle Clue Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-3 text-slate-300">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs leading-relaxed">
              <p className="font-tech font-bold text-white uppercase tracking-wide">
                Exhibition Plaque: "The Sequence of Escape"
              </p>
              <p className="text-slate-400">
                "The order of passage begins on the left and concludes on the right:{' '}
                <span className="text-cyan-300 font-bold">
                  {colorOrder.map((c, i) => `${i + 1}. ${COLOR_CONFIGS[c].label}`).join(' ➔ ')}
                </span>
                ."
              </p>
              <p className="text-slate-400 pt-1 border-t border-slate-800">
                To unlock the metal security box: check the digit corresponding to each of these colors from the note on the box, and enter them in this exact order!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-tech font-bold text-sm rounded-xl uppercase transition active:scale-98"
          >
            Back to Room [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};
