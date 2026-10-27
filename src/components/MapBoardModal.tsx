import React, { useEffect } from 'react';
import { MultiDoorPuzzleData, DOOR_CONFIGS, DoorLetter } from '../utils/mapBoardPuzzle';
import { X, Network, AlertTriangle, CheckCircle, ArrowRight, CornerDownRight, Compass, ShieldAlert } from 'lucide-react';

interface MapBoardModalProps {
  puzzleData: MultiDoorPuzzleData;
  onClose: () => void;
}

export const MapBoardModal: React.FC<MapBoardModalProps> = ({ puzzleData, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const doors: DoorLetter[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-none font-mono-code select-none">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-950 border-2 border-cyan-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-700 flex items-center justify-center text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-tech font-bold text-slate-100 tracking-wider uppercase text-base md:text-lg">
                Sector 02 Central Navigation Board
              </h2>
              <p className="text-xs text-cyan-400 font-mono-code">
                Multi-Conduit Topology // Interconnected Sector Blueprints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Close [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advisory Banner */}
        <div className="px-5 py-2.5 bg-cyan-950/40 border-b border-cyan-900/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-cyan-200 font-sans">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>TACTICAL WARNING:</strong> 4 doors line the far wall. The maps below are interconnected with cross-conduits designed to mislead you. Trace the telemetry reports to locate the single uncompromised escape conduit!
            </span>
          </div>
        </div>

        {/* Scrollable Schematic Workspace */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* Target Doors Overview Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {doors.map((letter) => {
              const conf = DOOR_CONFIGS[letter];
              return (
                <div
                  key={letter}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between ${conf.bgClass} ${conf.borderClass}`}
                >
                  <div>
                    <div className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider">
                      Physical Portal
                    </div>
                    <div className={`font-tech font-bold text-base ${conf.textClass}`}>
                      DOOR {letter}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/20 flex items-center justify-center font-bold text-white text-xs">
                    {letter}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Central Entry Origin Node */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[11px] font-bold uppercase mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Starting Concourse (You Are Here)</span>
            </div>
            <h3 className="font-tech font-bold text-white text-base">
              {puzzleData.entryStationName}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl font-sans">
              Pressurized distribution manifold feeding four distinct sub-sector ducts. Only one conduit maintains positive airlock pressure.
            </p>
          </div>

          {/* Interconnected Sub-Station Maps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {puzzleData.stations.map((station) => {
              const doorConf = DOOR_CONFIGS[station.leadsTo as DoorLetter];
              const isSafe = station.status === 'SAFE';

              return (
                <div
                  key={station.id}
                  className={`relative p-5 rounded-2xl border-2 transition-all ${
                    isSafe
                      ? 'bg-slate-900/90 border-emerald-500/80 shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {/* Station Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                        <h4 className="font-tech font-bold text-white text-sm">
                          {station.name}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Conduit: <span className="text-cyan-300 font-mono-code">{station.conduitDetails}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isSafe
                          ? 'bg-green-950 text-green-300 border-green-700'
                          : 'bg-red-950 text-red-300 border-red-800'
                      }`}
                    >
                      {station.status}
                    </span>
                  </div>

                  {/* Station Telemetry Log */}
                  <div className="py-3 text-xs leading-relaxed font-sans text-slate-300">
                    <div className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Sensor Telemetry:
                    </div>
                    <p>{station.note}</p>
                  </div>

                  {/* Destination Pointer */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono-code">
                    <span className="text-slate-400 flex items-center gap-1">
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-500" />
                      Terminates At:
                    </span>
                    <span className={`font-bold ${doorConf.textClass}`}>
                      {doorConf.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Misleading Cross-Links Section */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Interconnected Cross-Conduit Traps</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              {puzzleData.misleadingClues.map((clue, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px] space-y-1"
                >
                  <div className="text-slate-400 font-bold flex items-center gap-1">
                    <span>{clue.from}</span>
                    <ArrowRight className="w-3 h-3 text-red-400" />
                    <span>{clue.to}</span>
                  </div>
                  <p className="text-slate-500 font-sans leading-normal">
                    {clue.trapReason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-sans">
            Once you identify the safe conduit, close this board and interact with that door in 3D.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            Return to Room [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};
