import * as THREE from 'three';
import { ColorName, COLOR_CONFIGS, ScrambledDigit } from '../types/game';

/**
 * Procedural texture generator for textures in LOCKDOWN 13.
 * Strictly generates all maps in HTML5 Canvas with SRGBColorSpace.
 */

export function createConcreteFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base dark concrete
  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, 1024, 1024);

  // Noise and concrete mottling
  for (let i = 0; i < 60000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const brightness = Math.floor(25 + Math.random() * 30);
    const alpha = 0.08 + Math.random() * 0.15;
    ctx.fillStyle = `rgba(${brightness}, ${brightness + 2}, ${brightness + 4}, ${alpha})`;
    ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }

  // Expansion grid joints (large concrete slabs)
  ctx.strokeStyle = '#111317';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = 0; x <= 1024; x += 256) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
  }
  for (let y = 0; y <= 1024; y += 256) {
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
  }
  ctx.stroke();

  // Scuffs and stains
  for (let s = 0; s < 12; s++) {
    const sx = Math.random() * 1024;
    const sy = Math.random() * 1024;
    const radius = 20 + Math.random() * 60;
    const grad = ctx.createRadialGradient(sx, sy, 5, sx, sy, radius);
    grad.addColorStop(0, 'rgba(10, 12, 15, 0.4)');
    grad.addColorStop(1, 'rgba(10, 12, 15, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createConcreteWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark industrial concrete wall
  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, 1024, 1024);

  // Concrete speckling
  for (let i = 0; i < 50000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const shade = Math.floor(18 + Math.random() * 25);
    ctx.fillStyle = `rgba(${shade}, ${shade + 1}, ${shade + 3}, 0.12)`;
    ctx.fillRect(x, y, 3, 3);
  }

  // Water drips and damp stains running vertically
  for (let d = 0; d < 18; d++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 400;
    const length = 150 + Math.random() * 300;
    const grad = ctx.createLinearGradient(x, y, x, y + length);
    grad.addColorStop(0, 'rgba(10, 12, 14, 0.45)');
    grad.addColorStop(1, 'rgba(10, 12, 14, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - 6, y, 12, length);
  }

  // Horizontal seam lines for prefabricated concrete panels
  ctx.strokeStyle = '#0e1014';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.lineTo(1024, 340);
  ctx.moveTo(0, 680);
  ctx.lineTo(1024, 680);
  ctx.stroke();

  // Yellow & black industrial hazard stripe at the bottom
  const stripeH = 80;
  const stripeY = 1024 - stripeH;
  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, stripeY, 1024, stripeH);

  ctx.fillStyle = '#18181b';
  for (let x = -80; x < 1120; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, stripeY + stripeH);
    ctx.lineTo(x + 35, stripeY + stripeH);
    ctx.lineTo(x + 75, stripeY);
    ctx.lineTo(x + 40, stripeY);
    ctx.closePath();
    ctx.fill();
  }

  // Floor stencil text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('SECTOR 13 // MAXIMUM DETENTION', 40, stripeY - 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWoodCrateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Wood base
  ctx.fillStyle = '#453224';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankH = 512 / 6;
  for (let i = 0; i < 6; i++) {
    const y = i * plankH;
    const tone = 50 + (i % 2 === 0 ? 10 : -5);
    ctx.fillStyle = `rgb(${tone + 15}, ${tone}, ${tone - 15})`;
    ctx.fillRect(0, y + 2, 512, plankH - 4);

    // Wood grain lines
    ctx.strokeStyle = 'rgba(25, 15, 10, 0.25)';
    ctx.lineWidth = 1.5;
    for (let g = 0; g < 8; g++) {
      ctx.beginPath();
      ctx.moveTo(0, y + 10 + g * 8 + Math.random() * 4);
      ctx.bezierCurveTo(
        150, y + 12 + g * 8 + Math.random() * 8,
        350, y + 8 + g * 8 - Math.random() * 8,
        512, y + 10 + g * 8 + Math.random() * 4
      );
      ctx.stroke();
    }

    // Plank seam
    ctx.fillStyle = '#1c130d';
    ctx.fillRect(0, y + plankH - 3, 512, 4);
  }

  // Border frame & cross brace markings
  ctx.strokeStyle = '#2d2016';
  ctx.lineWidth = 24;
  ctx.strokeRect(12, 12, 488, 488);

  // Stencil text
  ctx.fillStyle = 'rgba(230, 210, 180, 0.4)';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FLOOR 13', 256, 230);
  ctx.font = '20px monospace';
  ctx.fillText('RESTRICTED CARGO', 256, 280);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createDoorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark steel surface
  ctx.fillStyle = '#272a30';
  ctx.fillRect(0, 0, 512, 1024);

  // Steel panels (embossed look)
  ctx.strokeStyle = '#15171a';
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 60, 432, 400);
  ctx.strokeRect(40, 520, 432, 440);

  // Inner panel fill
  ctx.fillStyle = '#1f2227';
  ctx.fillRect(44, 64, 424, 392);
  ctx.fillRect(44, 524, 424, 432);

  // Industrial Warning Stripes across center
  ctx.fillStyle = '#d97706';
  ctx.fillRect(44, 465, 424, 50);
  ctx.fillStyle = '#18181b';
  for (let x = 30; x < 500; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 515);
    ctx.lineTo(x + 20, 515);
    ctx.lineTo(x + 40, 465);
    ctx.lineTo(x + 20, 465);
    ctx.closePath();
    ctx.fill();
  }

  // Heavy steel rivets around perimeter
  ctx.fillStyle = '#4a505b';
  const drawRivet = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  };
  for (let y = 30; y < 1000; y += 80) {
    drawRivet(20, y);
    drawRivet(492, y);
  }
  for (let x = 40; x < 480; x += 80) {
    drawRivet(x, 20);
    drawRivet(x, 1004);
  }

  // Large warning exit text
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SECURITY EXIT', 256, 170);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '18px monospace';
  ctx.fillText('EMERGENCY LOCKDOWN ACTIVE', 256, 210);
  ctx.fillText('LEVEL 13 AIRLOCK PORTAL', 256, 240);

  // Hydraulic lock indicator icon
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 4;
  ctx.strokeRect(206, 280, 100, 70);
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('LOCKED', 256, 325);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPaintingTexture(colorOrder: ColorName[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Background gallery canvas (dark moody exhibition style)
  ctx.fillStyle = '#0f1115';
  ctx.fillRect(0, 0, 1024, 768);

  // Subtle linen canvas texture
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 768;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Inner art boundary
  const padX = 80;
  const padY = 60;
  const artW = 1024 - padX * 2;
  const artH = 768 - padY * 2 - 60;

  ctx.fillStyle = '#181b22';
  ctx.fillRect(padX, padY, artW, artH);

  // 4 Modern Abstract Vertical Color Bands according to colorOrder
  const stripeWidth = artW / 4;

  colorOrder.forEach((cName, idx) => {
    const info = COLOR_CONFIGS[cName];
    const x = padX + idx * stripeWidth;
    
    // Rich gradient block
    const grad = ctx.createLinearGradient(x, padY, x, padY + artH);
    grad.addColorStop(0, info.hex);
    grad.addColorStop(1, '#05070a');
    ctx.fillStyle = grad;
    ctx.fillRect(x + 10, padY + 15, stripeWidth - 20, artH - 30);

    // Dynamic geometric overlay (circle or diamond)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(x + stripeWidth / 2, padY + artH / 2, stripeWidth * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Order number (1, 2, 3, 4) clearly readable as the cipher hint!
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${idx + 1}`, x + stripeWidth / 2, padY + 90);

    // Roman numeral or step marker at bottom
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(info.label, x + stripeWidth / 2, padY + artH - 40);
  });

  // Plaque below the painting
  ctx.fillStyle = '#22252e';
  ctx.fillRect(padX + 150, 768 - 90, artW - 300, 48);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(padX + 150, 768 - 90, artW - 300, 48);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CIPHER SEQUENCE // ORDER OF THE FOUR SPECTRUMS (1 -> 4)', 512, 768 - 60);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBoxNoteTexture(scrambledDigits: ScrambledDigit[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Weathered metallic / yellow sticky note background
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(0, 0, 512, 256);

  // Border & tape at top
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(180, 0, 150, 24);

  // Header
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SEC-VAULT OVERRIDE DIGITS', 256, 50);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('(Digits scrambled - Order dictated by Art Cipher)', 256, 75);

  // Draw the 4 colored blocks with their assigned digit
  const boxW = 85;
  const startX = 50;
  const gap = 24;
  const y = 100;

  scrambledDigits.forEach((item, idx) => {
    const x = startX + idx * (boxW + gap);
    const color = COLOR_CONFIGS[item.color];

    // Colored badge
    ctx.fillStyle = color.hex;
    ctx.fillRect(x, y, boxW, 85);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, boxW, 85);

    // Digit inside badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.digit}`, x + boxW / 2, y + 60);

    // Color name label underneath
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(color.label, x + boxW / 2, y + 110);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMapSheetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Blueprint background
  ctx.fillStyle = '#0b2545';
  ctx.fillRect(0, 0, 512, 512);

  // Blueprint grid
  ctx.strokeStyle = 'rgba(30, 144, 255, 0.25)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Room outline
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 8;
  ctx.strokeRect(60, 60, 392, 392);

  // Red exit door mark
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(210, 60);
  ctx.lineTo(300, 60);
  ctx.stroke();

  // Blueprint title
  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FLOOR 13 TACTICAL SCHEMATIC', 256, 120);

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('▲ NORTH EXIT (RESTRICTED)', 256, 95);

  ctx.fillStyle = '#60a5fa';
  ctx.font = '16px monospace';
  ctx.fillText('[CLASSIFIED ARCHITECTURAL LOG]', 256, 420);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBigBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark blueprint cyber background
  ctx.fillStyle = '#081320';
  ctx.fillRect(0, 0, 1024, 512);

  // Grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Header Title
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SECTOR 02 TRANSIT SCHEMATIC BOARD', 512, 45);
  ctx.font = '16px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('INTERCONNECTED ESCAPE CONDUIT TOPOLOGY [PRESS E TO INSPECT]', 512, 75);

  // 4 Target Door Nodes across top
  const doors = [
    { label: 'DOOR A', color: '#38bdf8', x: 180 },
    { label: 'DOOR B', color: '#22c55e', x: 400 },
    { label: 'DOOR C', color: '#f59e0b', x: 620 },
    { label: 'DOOR D', color: '#ef4444', x: 840 },
  ];

  doors.forEach(d => {
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(d.x - 70, 110, 140, 60);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(d.x - 70, 110, 140, 60);

    ctx.fillStyle = d.color;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(d.label, d.x, 148);
  });

  // Central Hub Node
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(412, 380, 200, 70);
  ctx.fillStyle = '#0f2942';
  ctx.fillRect(412, 380, 200, 70);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('CENTRAL ENTRY', 512, 422);

  // Connecting Network Lines & Traps
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  doors.forEach(d => {
    ctx.beginPath();
    ctx.moveTo(512, 380);
    ctx.bezierCurveTo(512, 280, d.x, 260, d.x, 170);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Warning text at bottom
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('WARNING: 3 PATHS ARE SECTOR TRAPS (WILL RESET TO PREVIOUS STEP)', 512, 485);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
