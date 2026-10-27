import React, { useEffect, useRef } from 'react';
import { PlayerMapState } from '../game/GameWorld';
import { Map, Lock, Cpu, Vault, Network } from 'lucide-react';

interface MapPanelProps {
  hasMap: boolean;
  currentRoom: 1 | 2 | 3 | 4;
  playerState: PlayerMapState;
}

export const MapPanel: React.FC<MapPanelProps> = ({ hasMap, currentRoom, playerState }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!hasMap || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const margin = 24;
    const mapW = width - margin * 2;
    const mapH = height - margin * 2;

    // Dark high-tech background
    ctx.fillStyle = '#07101e';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid
    ctx.strokeStyle = '#0f2942';
    ctx.lineWidth = 1;
    for (let x = margin; x <= width - margin; x += mapW / 6) {
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, height - margin);
      ctx.stroke();
    }
    for (let y = margin; y <= height - margin; y += mapH / 6) {
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(width - margin, y);
      ctx.stroke();
    }

    if (currentRoom === 1) {
      // ROOM 1: X: [-6, 6], Z: [-6, 6]
      const toMapX = (worldX: number) => margin + ((worldX + 6) / 12) * mapW;
      const toMapY = (worldZ: number) => margin + ((worldZ + 6) / 12) * mapH;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(margin, margin, mapW, mapH);

      // Cage line
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(toMapX(1.2), toMapY(1.2));
      ctx.lineTo(toMapX(5.6), toMapY(1.2));
      ctx.stroke();
      ctx.setLineDash([]);

      // Exit Door
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(toMapX(-1.2), toMapY(-5.95));
      ctx.lineTo(toMapX(1.2), toMapY(-5.95));
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DOOR 1 (SERIES CIPHER)', toMapX(0), toMapY(-5.95) + 14);

      // Desk
      const deskX = toMapX(3.9);
      const deskY = toMapY(-2.5);
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(deskX - 18, deskY - 10, 36, 20);
      ctx.fillStyle = '#93c5fd';
      ctx.font = '9px monospace';
      ctx.fillText('DESK', deskX, deskY + 3);

      // Box & Crates
      const boxX = toMapX(-3.8);
      const boxY = toMapY(1.0);
      ctx.fillStyle = '#3f2e1e';
      ctx.fillRect(boxX - 12, boxY - 12, 24, 24);
      ctx.fillStyle = '#fde68a';
      ctx.font = '8px monospace';
      ctx.fillText('BOX', boxX, boxY + 3);

      renderPlayer(ctx, toMapX(playerState.x), toMapY(playerState.z), playerState.rotationY);
    } else if (currentRoom === 2) {
      // ROOM 2: X: [-6, 6], Z: [-18, -6]
      const toMapX = (worldX: number) => margin + ((worldX + 6) / 12) * mapW;
      const toMapY = (worldZ: number) => margin + ((worldZ - (-18)) / 12) * mapH;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(margin, margin, mapW, mapH);

      // Entry Door from Room 1 (bottom)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(toMapX(-1.2), toMapY(-6.1));
      ctx.lineTo(toMapX(1.2), toMapY(-6.1));
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ENTRY (SEALED)', toMapX(0), toMapY(-6.1) - 6);

      // 4 Exit Doors (A, B, C, D) along top (Z = -18)
      const doorOffsets = [
        { l: 'A', x: -4.5, c: '#38bdf8' },
        { l: 'B', x: -1.5, c: '#22c55e' },
        { l: 'C', x: 1.5, c: '#f59e0b' },
        { l: 'D', x: 4.5, c: '#ef4444' },
      ];

      doorOffsets.forEach((d) => {
        const dx = toMapX(d.x);
        const dy = toMapY(-17.9);
        ctx.strokeStyle = d.c;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(dx - 12, dy);
        ctx.lineTo(dx + 12, dy);
        ctx.stroke();

        ctx.fillStyle = d.c;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(d.l, dx, dy + 12);
      });

      // Big Board in Center (X = 0, Z = -12.0)
      const bX = toMapX(0);
      const bY = toMapY(-12.0);
      ctx.fillStyle = '#0f2942';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.fillRect(bX - 25, bY - 8, 50, 16);
      ctx.strokeRect(bX - 25, bY - 8, 50, 16);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BIG BOARD', bX, bY + 3);

      renderPlayer(ctx, toMapX(playerState.x), toMapY(playerState.z), playerState.rotationY);
    } else if (currentRoom === 3) {
      // ROOM 3: X: [-6, 6], Z: [-30, -18]
      const toMapX = (worldX: number) => margin + ((worldX + 6) / 12) * mapW;
      const toMapY = (worldZ: number) => margin + ((worldZ - (-30)) / 12) * mapH;

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(margin, margin, mapW, mapH);

      // Terminal Desk at (0, -24.5)
      const termX = toMapX(0);
      const termY = toMapY(-24.5);
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.fillRect(termX - 22, termY - 14, 44, 28);
      ctx.strokeRect(termX - 22, termY - 14, 44, 28);
      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TERMINAL', termX, termY + 3);

      // Exit Door to Vault (top)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(toMapX(-1.2), toMapY(-29.9));
      ctx.lineTo(toMapX(1.2), toMapY(-29.9));
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.font = '9px monospace';
      ctx.fillText('VAULT PORTAL', toMapX(0), toMapY(-29.9) + 12);

      renderPlayer(ctx, toMapX(playerState.x), toMapY(playerState.z), playerState.rotationY);
    } else if (currentRoom === 4) {
      // ROOM 4: X: [-4, 4], Z: [-39, -30]
      const toMapX = (worldX: number) => margin + ((worldX + 4) / 8) * mapW;
      const toMapY = (worldZ: number) => margin + ((worldZ - (-39)) / 9) * mapH;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(margin, margin, mapW, mapH);

      // Safe pedestal at (0, -35.5)
      const safeX = toMapX(0);
      const safeY = toMapY(-35.5);
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.fillRect(safeX - 20, safeY - 16, 40, 32);
      ctx.strokeRect(safeX - 20, safeY - 16, 40, 32);
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LAST DOOR', safeX, safeY + 3);

      renderPlayer(ctx, toMapX(playerState.x), toMapY(playerState.z), playerState.rotationY);
    }
  }, [hasMap, currentRoom, playerState]);

  const renderPlayer = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    rotationY: number
  ) => {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-rotationY);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 30, -Math.PI / 2 - 0.45, -Math.PI / 2 + 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -18);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-5, -15);
    ctx.lineTo(5, -15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  const roomTitle =
    currentRoom === 1
      ? 'Room 1: Cage Room'
      : currentRoom === 2
      ? 'Room 2: 4-Door Maze'
      : currentRoom === 3
      ? 'Room 3: Debug Room'
      : 'Room 4: Final Vault';

  return (
    <div className="absolute top-4 right-4 z-20 w-64 md:w-72 bg-slate-950/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl backdrop-blur-none pointer-events-auto">
      <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentRoom === 1 ? (
            <Map className="w-4 h-4 text-cyan-400" />
          ) : currentRoom === 2 ? (
            <Network className="w-4 h-4 text-cyan-400" />
          ) : currentRoom === 3 ? (
            <Cpu className="w-4 h-4 text-emerald-400" />
          ) : (
            <Vault className="w-4 h-4 text-blue-400" />
          )}
          <span className="text-xs font-tech font-bold tracking-wider text-slate-200 uppercase">
            {roomTitle}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded font-semibold ${
            hasMap
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
              : 'bg-red-950 text-red-400 border border-red-800'
          }`}
        >
          {hasMap ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <div className="p-3">
        {hasMap ? (
          <div>
            <div className="relative border border-cyan-900/60 rounded-lg overflow-hidden bg-slate-950 flex justify-center">
              <canvas
                ref={canvasRef}
                width={250}
                height={250}
                className="w-full aspect-square block"
              />
            </div>
            <div className="mt-2 text-[10px] font-mono-code text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                Player
              </span>
              <span className="text-slate-500">
                Sector 0{currentRoom} / Floor 13
              </span>
            </div>
          </div>
        ) : (
          <div className="py-6 px-3 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-xs font-tech font-bold text-slate-300 uppercase tracking-wide">
              No Map Yet
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans">
              Find and pick up the tactical blueprint in Room 1 to unlock real-time navigation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
