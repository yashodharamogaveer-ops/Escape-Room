import { MultiDoorPuzzleData } from '../utils/mapBoardPuzzle';
import { ChestSequencePuzzleData } from '../utils/chestPuzzle';

export type ColorName = 'red' | 'blue' | 'green' | 'yellow';

export interface ColorInfo {
  name: ColorName;
  hex: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const COLOR_CONFIGS: Record<ColorName, ColorInfo> = {
  red: {
    name: 'red',
    hex: '#ef4444',
    label: 'RED',
    bgClass: 'bg-red-500',
    textClass: 'text-red-400',
    borderClass: 'border-red-500',
  },
  blue: {
    name: 'blue',
    hex: '#3b82f6',
    label: 'BLUE',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500',
  },
  green: {
    name: 'green',
    hex: '#22c55e',
    label: 'GREEN',
    bgClass: 'bg-green-500',
    textClass: 'text-green-400',
    borderClass: 'border-green-500',
  },
  yellow: {
    name: 'yellow',
    hex: '#eab308',
    label: 'YELLOW',
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500',
  },
};

export interface ScrambledDigit {
  digit: number;
  color: ColorName;
}

export interface BoxPuzzleData {
  correctCode: string;
  paintingColorOrder: ColorName[]; // e.g. ['blue', 'red', 'yellow', 'green']
  scrambledDigits: ScrambledDigit[]; // e.g. [{digit: 4, color: 'red'}, ...]
  colorToDigitMap: Record<ColorName, number>;
}

export interface AptitudeQuestion {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DebugProgram {
  id: string;
  title: string;
  description: string;
  bugType: 'syntax' | 'logic' | 'runtime';
  requiredSnippets: string[];
  buggyCode: string;
  expectedOutput: string;
  hint1: string;
  hint2: string;
}

export type GameView = 
  | 'START' 
  | 'PLAYING' 
  | 'INSPECTING_BOX' 
  | 'INSPECTING_PAINTING' 
  | 'QUESTION_MODAL' 
  | 'INSPECTING_MAP_BOARD'
  | 'TERMINAL_MODAL'
  | 'ROOM3_KEYPAD'
  | 'INSPECTING_CHEST_TRUTH'
  | 'INSPECTING_CHEST_LIES'
  | 'INSPECTING_CHEST_UNKNOWN'
  | 'INSPECTING_SYMBOL_WALL'
  | 'ESCAPED';

export type EscapeMethod = 'MAP_APTITUDE' | 'BOX_KEY';

export interface GameState {
  view: GameView;
  currentRoom: 1 | 2 | 3 | 4; // 1: Cage, 2: Multi-Door Maze & Big Board, 3: Debug Server Room, 4: Final Vault Chamber
  hasMap: boolean;
  hasKey: boolean;
  boxUnlocked: boolean;
  doorUnlocked: boolean; // Room 1 exit door
  doorOpenProgress: number; // 0 to 1
  puzzleData: BoxPuzzleData;
  currentQuestion: AptitudeQuestion | null;
  wrongAnswersCount: number;
  penaltySeconds: number;
  lockoutEndTime: number | null; // timestamp when lockout expires
  startTime: number;
  endTime: number | null;
  elapsedSeconds: number;
  escapeMethod: EscapeMethod | null;
  flashlightOn: boolean;
  soundEnabled: boolean;

  // Room 2 Multi-Door & Big Board Maze Challenge
  multiDoorPuzzle: MultiDoorPuzzleData;
  room2DoorUnlocked: boolean;
  room2AlertShown: boolean;

  // Room 3 Debug Challenge
  selectedProgram: DebugProgram;
  currentCode: string;
  dataFragment: string | null;
  room3DoorUnlocked: boolean;
  hintsUsedCount: number;
  terminalAttempts: number;

  // Room 4 Final Safe / Vault
  room4SafeUnlocked: boolean;

  // Room 4 Interconnected 3-Chest Sequence & Mathematical Wall Reveal
  chestPuzzle: ChestSequencePuzzleData;
  chestTruthUnlocked: boolean;
  chestLiesUnlocked: boolean;
  chestUnknownUnlocked: boolean;
  awardedLetter: string | null;
  room4HiddenDoorUnlocked: boolean;
}
