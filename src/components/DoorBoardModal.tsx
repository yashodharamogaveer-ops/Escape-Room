import React, { useState } from 'react';
import { DoorMazeRoundData, MazeMapItem } from '../game/doorMazeGenerator';
import { X, AlertCircle, HelpCircle, Eye, Lightbulb, Compass, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DoorBoardModalProps {
  roundData: DoorMazeRoundData;
  hintsUsedCount: number;
  revealedHint: boolean;
  onUseHint: () => void;
  onClose: () => void;
}

export const DoorBoardModal: React.FC<DoorBoardModalProps> = ({
  roundData,
  hintsUsedCount,
  revealedHint,
  onUseHint,
  onClose,
}) => {
  const [selectedMap, setSelectedMap] = useState<MazeMapItem | null>(null);

  const getMapById = (id: string) => roundData.maps.find(m => m.id === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/90 backdrop-blur-none select-none font-mono-code">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[900px] bg-[#0c0d12] border-2 border-amber-600/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#12141c] border-b border-amber-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-tech font-bold text-amber-200 tracking-wider uppercase text-sm md:text-base">
                Central Tactical Pinboard // Round {roundData.round} of 4
              </h3>
              <p className="text-[11px] text-amber-400/80 font-sans">
                "TRUST ONLY WHAT YOU CAN VERIFY. A MAP THAT LIES ABOUT THIS ROOM CANNOT BE TRUSTED."
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!revealedHint && (
              <button
                onClick={onUseHint}
                className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Reveal one honest map (+20s penalty)"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Reveal Honest Map (+20s)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-amber-950/80 text-amber-400 hover:text-white rounded-lg transition cursor-pointer"
              title="Close Board [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Board Main Area (Corkboard / Cyber Pinboard with SVG Red String Connections) */}
        <div className="relative flex-1 bg-[#151722] p-4 overflow-hidden">
          {/* Subtle grid and corkboard pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          {/* SVG Red Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {roundData.maps.map(m => {
              return m.referencedMapIds.map(refId => {
                const target = getMapById(refId);
                if (!target) return null;
                return (
                  <g key={`${m.id}->${refId}`}>
                    {/* Shadow line */}
                    <line
                      x1={`${m.pinX}%`}
                      y1={`${m.pinY}%`}
                      x2={`${target.pinX}%`}
                      y2={`${target.pinY}%`}
                      stroke="black"
                      strokeWidth="4"
                      strokeOpacity="0.5"
                    />
                    {/* Red string line */}
                    <line
                      x1={`${m.pinX}%`}
                      y1={`${m.pinY}%`}
                      x2={`${target.pinX}%`}
                      y2={`${target.pinY}%`}
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                      strokeOpacity="0.85"
                    />
                  </g>
                );
              });
            })}
          </svg>

          {/* Map Cards Pinned to the Board */}
          {roundData.maps.map(mapItem => {
            const isRevealedHonest = revealedHint && mapItem.id === roundData.hintMapId;

            return (
              <div
                key={mapItem.id}
                onClick={() => setSelectedMap(mapItem)}
                style={{
                  left: `${mapItem.pinX}%`,
                  top: `${mapItem.pinY}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-10 w-44 md:w-56 p-3 rounded-xl border-2 transition-all cursor-pointer shadow-xl ${
                  isRevealedHonest
                    ? 'bg-amber-950/90 border-green-400 ring-2 ring-green-400/50'
                    : 'bg-[#1b1e2e]/95 border-amber-600/60 hover:border-amber-400 hover:scale-105'
                }`}
              >
                {/* Red pushpin */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-md z-20" />

                {/* Card Title */}
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-amber-900/60 text-xs">
                  <span className="font-tech font-bold text-amber-300 uppercase">
                    {mapItem.label}
                  </span>
                  {mapItem.isAnchor ? (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-700/60 font-mono-code">
                      Anchor
                    </span>
                  ) : (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono-code">
                      Linked
                    </span>
                  )}
                </div>

                {/* Clue Text */}
                <p className="text-[11px] font-sans text-slate-200 leading-snug line-clamp-3">
                  {mapItem.clueText}
                </p>

                {/* References indicator */}
                {mapItem.referencedMapIds.length > 0 && (
                  <div className="mt-2 text-[9px] text-red-400 font-mono-code flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    <span>References: {mapItem.referencedMapIds.map(id => `Map ${id}`).join(', ')}</span>
                  </div>
                )}

                {isRevealedHonest && (
                  <div className="mt-1 text-[9px] text-green-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span>Verified Honest by System Hint</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend / Instructions Footer */}
        <div className="px-5 py-3 bg-[#10121a] border-t border-amber-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs text-amber-300/80">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span>Red dashed lines: Dependency reference chains</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
              <span>Anchor Maps: Verify against real room doors</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Click any map to inspect in detail</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-tech font-bold rounded-lg text-xs uppercase cursor-pointer"
            >
              Exit to Room [Esc]
            </button>
          </div>
        </div>

        {/* Enlarged Map Inspection Modal Overlay */}
        {selectedMap && (
          <div className="absolute inset-0 z-30 bg-black/85 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-[#181b28] border-2 border-amber-500 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-amber-900/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-600 border border-white" />
                  <h4 className="font-tech font-bold text-lg text-amber-200 uppercase">
                    {selectedMap.label} Details
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedMap(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Diagram / Schematic Illustration */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                <div className="w-48 h-32 border-2 border-cyan-500/70 rounded-lg relative flex items-center justify-center bg-cyan-950/20">
                  <span className="text-[10px] text-cyan-400 font-mono-code">ROOM 4 SECTOR</span>
                  {/* You are here dot */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[8px] text-cyan-300">BOARD</span>
                  </div>
                </div>
              </div>

              {/* Full Clue Text */}
              <div className="p-4 bg-amber-950/30 border border-amber-700/60 rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Tactical Statement:
                </div>
                <p className="text-sm font-sans text-white leading-relaxed font-semibold">
                  "{selectedMap.clueText}"
                </p>
              </div>

              <div className="text-xs text-slate-400 font-sans leading-relaxed">
                {selectedMap.isAnchor ? (
                  <p>
                    🔍 <strong>Anchor Map:</strong> Look at the actual doors in the room. If this statement matches what you see, this map is <strong>HONEST</strong>. If it contradicts the real doors, it is a <strong>LIAR</strong>.
                  </p>
                ) : (
                  <p>
                    🔗 <strong>Chained Map:</strong> This map references other maps on the board. Follow the dependency lines to deduce whether its clue holds truth.
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedMap(null)}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-tech font-bold text-xs uppercase rounded-xl transition cursor-pointer"
              >
                Back to Pinboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
