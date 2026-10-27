export type MazeColor = 'red' | 'blue' | 'green' | 'yellow';
export type MazeSymbol = 'circle' | 'triangle' | 'square' | 'star';

export interface MazeDoor {
  index: number;
  color: MazeColor;
  symbol: MazeSymbol;
  number: number;
  positionLabel: string; // 'Left door', 'Center door', 'Right door', 'Far-Right door'
  wall: 'West' | 'North-Left' | 'North-Right' | 'East';
  x: number;
  z: number;
  rotationY: number;
}

export interface MazeMapItem {
  id: string; // 'A', 'B', 'C', 'D', 'E', 'F'
  label: string; // 'Map A'
  clueText: string;
  isAnchor: boolean;
  isHonest: boolean; // True if statement holds
  referencedMapIds: string[]; // for red lines on pinboard
  highlightedDoorIndex?: number;
  pinX: number; // percentage 0-100 on board
  pinY: number; // percentage 0-100 on board
}

export interface DoorMazeRoundData {
  round: number; // 1 to 4
  doorCount: number; // 3 or 4
  doors: MazeDoor[];
  maps: MazeMapItem[];
  correctDoorIndex: number;
  hintMapId?: string; // reveals one honest anchor map
}

const COLORS: MazeColor[] = ['red', 'blue', 'green', 'yellow'];
const SYMBOLS: MazeSymbol[] = ['circle', 'triangle', 'square', 'star'];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Builds 3 or 4 unique doors placed in the room
 */
export function generateDoors(count: 3 | 4): MazeDoor[] {
  const shuffledColors = shuffle(COLORS).slice(0, count);
  const shuffledSymbols = shuffle(SYMBOLS).slice(0, count);
  const numbers = shuffle([1, 2, 3, 4]).slice(0, count);

  const doorLayouts = count === 3 ? [
    { label: 'Left door', wall: 'West' as const, x: -7.6, z: -35.5, rotY: Math.PI / 2 },
    { label: 'Center door', wall: 'North-Left' as const, x: -2.5, z: -43.8, rotY: 0 },
    { label: 'Right door', wall: 'North-Right' as const, x: 2.5, z: -43.8, rotY: 0 },
  ] : [
    { label: 'Left door', wall: 'West' as const, x: -7.6, z: -35.5, rotY: Math.PI / 2 },
    { label: 'Center-Left door', wall: 'North-Left' as const, x: -3.2, z: -43.8, rotY: 0 },
    { label: 'Center-Right door', wall: 'North-Right' as const, x: 3.2, z: -43.8, rotY: 0 },
    { label: 'Right door', wall: 'East' as const, x: 7.6, z: -35.5, rotY: -Math.PI / 2 },
  ];

  return doorLayouts.map((layout, idx) => ({
    index: idx,
    color: shuffledColors[idx],
    symbol: shuffledSymbols[idx],
    number: numbers[idx],
    positionLabel: layout.label,
    wall: layout.wall,
    x: layout.x,
    z: layout.z,
    rotationY: layout.rotY,
  }));
}

/**
 * Solves the maze puzzle by evaluating all honest maps
 */
export function solveMaze(doors: MazeDoor[], maps: MazeMapItem[]): number[] {
  // Candidate doors that survive all honest clues
  let candidateIndices = doors.map(d => d.index);

  // An anchor map is honest iff its statement matches the room
  // Honest maps eliminate doors or point directly
  const honestMaps = maps.filter(m => m.isHonest);

  for (const m of honestMaps) {
    if (m.highlightedDoorIndex !== undefined) {
      candidateIndices = candidateIndices.filter(idx => idx === m.highlightedDoorIndex);
    }
  }

  return candidateIndices;
}

/**
 * Generates a complete, verified fair puzzle for the current round
 */
export function generateDoorMaze(round: number): DoorMazeRoundData {
  const doorCount: 3 | 4 = round >= 3 ? 4 : 3;
  const mapCount = round >= 3 ? 6 : 5;
  const maxLiarCount = round === 1 ? 1 : round === 2 ? 1 : 2;

  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const doors = generateDoors(doorCount);
    const correctIdx = Math.floor(Math.random() * doorCount);
    const correctDoor = doors[correctIdx];

    const maps: MazeMapItem[] = [];
    const mapLetters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, mapCount);

    // Positions for pinboard layout
    const pinPositions = [
      { x: 18, y: 22 },
      { x: 50, y: 18 },
      { x: 82, y: 24 },
      { x: 24, y: 68 },
      { x: 55, y: 72 },
      { x: 80, y: 70 },
    ];

    // Pick 2 anchor maps: 1 Honest Anchor, 1 Liar Anchor
    const otherDoor = doors.find(d => d.index !== correctIdx)!;

    // Map A: Honest Anchor (verifiable claim about real room)
    const anchorDoor = doors[0];
    maps.push({
      id: 'A',
      label: 'Map A',
      isAnchor: true,
      isHonest: true,
      clueText: `VERIFY: The ${anchorDoor.color.toUpperCase()} door is the ${anchorDoor.positionLabel}.`,
      referencedMapIds: ['B'],
      pinX: pinPositions[0].x,
      pinY: pinPositions[0].y,
    });

    // Map B: Liar Anchor (false claim about real room)
    // Make a false claim: switch color or symbol
    const wrongColor = COLORS.find(c => c !== anchorDoor.color)!;
    maps.push({
      id: 'B',
      label: 'Map B',
      isAnchor: true,
      isHonest: false,
      clueText: `VERIFY: The ${wrongColor.toUpperCase()} door has the ${anchorDoor.symbol.toUpperCase()} symbol.`,
      referencedMapIds: ['A', 'C'],
      pinX: pinPositions[1].x,
      pinY: pinPositions[1].y,
    });

    // Map C: Conditional map pointing to correct door
    maps.push({
      id: 'C',
      label: 'Map C',
      isAnchor: false,
      isHonest: true,
      clueText: `IF Map A is honest: Exit is the door marked with symbol ${correctDoor.symbol.toUpperCase()}!`,
      referencedMapIds: ['A'],
      highlightedDoorIndex: correctIdx,
      pinX: pinPositions[2].x,
      pinY: pinPositions[2].y,
    });

    // Map D: Decoy map from liar B
    maps.push({
      id: 'D',
      label: 'Map D',
      isAnchor: false,
      isHonest: false,
      clueText: `IF Map B is honest: Exit is door #${otherDoor.number}.`,
      referencedMapIds: ['B'],
      highlightedDoorIndex: otherDoor.index,
      pinX: pinPositions[3].x,
      pinY: pinPositions[3].y,
    });

    // Map E: Confirmation or Loop
    if (round === 1) {
      maps.push({
        id: 'E',
        label: 'Map E',
        isAnchor: false,
        isHonest: true,
        clueText: `Trust Map C. The liar Map B will lead you to immediate lockout.`,
        referencedMapIds: ['C', 'B'],
        pinX: pinPositions[4].x,
        pinY: pinPositions[4].y,
      });
    } else if (round === 2) {
      maps.push({
        id: 'E',
        label: 'Map E',
        isAnchor: false,
        isHonest: true,
        clueText: `Chain verification: Map A confirms Map C. The correct exit color is ${correctDoor.color.toUpperCase()}.`,
        referencedMapIds: ['A', 'C'],
        highlightedDoorIndex: correctIdx,
        pinX: pinPositions[4].x,
        pinY: pinPositions[4].y,
      });
    } else {
      // Round 3 & 4: Loops and extra maps
      maps.push({
        id: 'E',
        label: 'Map E',
        isAnchor: false,
        isHonest: true,
        clueText: `Map C points to the true passage. Cross-reference: Door #${correctDoor.number}.`,
        referencedMapIds: ['C'],
        highlightedDoorIndex: correctIdx,
        pinX: pinPositions[4].x,
        pinY: pinPositions[4].y,
      });

      // Map F: Red herring or secondary loop
      const anotherDoor = doors.find(d => d.index !== correctIdx && d.index !== otherDoor.index) || otherDoor;
      maps.push({
        id: 'F',
        label: 'Map F',
        isAnchor: false,
        isHonest: false,
        clueText: round === 4 ? `[DECOY TELEMETRY]: Disregard Map C. Exit door is ${anotherDoor.color.toUpperCase()}.` : `Verify with Map B: door #${anotherDoor.number}.`,
        referencedMapIds: ['B', 'C'],
        highlightedDoorIndex: anotherDoor.index,
        pinX: pinPositions[5].x,
        pinY: pinPositions[5].y,
      });
    }

    // Verify uniqueness with solver
    const solved = solveMaze(doors, maps);
    if (solved.length === 1 && solved[0] === correctIdx) {
      return {
        round,
        doorCount,
        doors,
        maps,
        correctDoorIndex: correctIdx,
        hintMapId: 'A', // Reveals honest Map A
      };
    }
  }

  // Fallback guaranteed structure
  const fallbackDoors = generateDoors(doorCount);
  const fallbackCorrectIdx = 0;
  return {
    round,
    doorCount,
    doors: fallbackDoors,
    maps: [
      {
        id: 'A',
        label: 'Map A',
        isAnchor: true,
        isHonest: true,
        clueText: `VERIFY: The ${fallbackDoors[0].color.toUpperCase()} door is the ${fallbackDoors[0].positionLabel}.`,
        referencedMapIds: ['C'],
        pinX: 20,
        pinY: 25,
      },
      {
        id: 'B',
        label: 'Map B',
        isAnchor: true,
        isHonest: false,
        clueText: `VERIFY: The ${fallbackDoors[1].color.toUpperCase()} door is the ${fallbackDoors[2].positionLabel}.`,
        referencedMapIds: ['A'],
        pinX: 50,
        pinY: 20,
      },
      {
        id: 'C',
        label: 'Map C',
        isAnchor: false,
        isHonest: true,
        clueText: `IF Map A is verified: The escape is the ${fallbackDoors[0].symbol.toUpperCase()} door!`,
        referencedMapIds: ['A'],
        highlightedDoorIndex: fallbackCorrectIdx,
        pinX: 80,
        pinY: 25,
      },
      {
        id: 'D',
        label: 'Map D',
        isAnchor: false,
        isHonest: false,
        clueText: `Follow Map B to door #${fallbackDoors[1].number}.`,
        referencedMapIds: ['B'],
        highlightedDoorIndex: 1,
        pinX: 30,
        pinY: 70,
      },
      {
        id: 'E',
        label: 'Map E',
        isAnchor: false,
        isHonest: true,
        clueText: `Map C is genuine. Beware of Map B.`,
        referencedMapIds: ['C', 'B'],
        pinX: 70,
        pinY: 70,
      },
    ],
    correctDoorIndex: fallbackCorrectIdx,
    hintMapId: 'A',
  };
}
