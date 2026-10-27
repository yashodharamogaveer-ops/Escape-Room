export interface ChestTruthPuzzle {
  binaryString: string;
  decimalAnswer: number;
  question: string;
  hint: string;
  rewardMessage: string;
}

export interface ChestLiesPuzzle {
  title: string;
  question: string;
  answer: string; // single digit "0" - "9"
  hint: string;
  rewardMessage: string;
}

export interface ChestUnknownPuzzle {
  title: string;
  question: string;
  awardedLetter: string; // e.g. "E", "K", "H", "N", "T", "D", "X"
  hint: string;
  rewardMessage: string;
}

export interface SymbolWallPuzzle {
  visibleSymbols: [string, string]; // e.g. ["∑", "√"]
  hiddenSymbol: string; // e.g. "π"
  incompleteWord: string; // e.g. "C O D _"
  missingLetter: string; // e.g. "E"
  completedWord: string; // e.g. "C O D E"
  riddleHint: string;
}

export interface ChestSequencePuzzleData {
  truth: ChestTruthPuzzle;
  lies: ChestLiesPuzzle;
  unknown: ChestUnknownPuzzle;
  wall: SymbolWallPuzzle;
}

// Word pairs for the Wall and Chest 3
interface WordRiddlePair {
  incompleteWord: string;
  missingLetter: string;
  completedWord: string;
  riddle: string;
  hint: string;
}

const WORD_RIDDLE_PAIRS: WordRiddlePair[] = [
  {
    incompleteWord: 'C O D _',
    missingLetter: 'E',
    completedWord: 'CODE',
    riddle:
      'I am the 5th letter of the alphabet, the most frequent character in computer code, and the vowel that completes "ESC_P_". What single letter am I?',
    hint: 'First vowel in "ENTER" or "ESCAPE". Letter value: 5.',
  },
  {
    incompleteWord: 'G A T _',
    missingLetter: 'E',
    completedWord: 'GATE',
    riddle:
      'What single letter completes logic "NOT GAT_", stands for Euler\'s mathematical constant (approx 2.718), and is the 5th alphabet character?',
    hint: 'Fifth letter of the alphabet. Sound of "E".',
  },
  {
    incompleteWord: 'P A T _',
    missingLetter: 'H',
    completedWord: 'PATH',
    riddle:
      'What letter sits between G and I in ASCII, represents Planck\'s constant in physics, and begins the words "HACKER" and "HEXADECIMAL"?',
    hint: '8th letter of the alphabet. "H".',
  },
  {
    incompleteWord: 'L O C _',
    missingLetter: 'K',
    completedWord: 'LOCK',
    riddle:
      'What is the 11th letter of the alphabet, symbol for 1,000 bytes (e.g. 64_B), and the missing letter to lock or un-lock a terminal?',
    hint: 'Letter before L. Metric abbreviation for kilo.',
  },
  {
    incompleteWord: 'E X I _',
    missingLetter: 'T',
    completedWord: 'EXIT',
    riddle:
      'I look like a highway junction or crossroad. I am the 20th letter of the alphabet, and the initial letter of "TERMINAL" and "TRUTH". What letter am I?',
    hint: '20th letter. Capital T.',
  },
  {
    incompleteWord: 'F R E _',
    missingLetter: 'E',
    completedWord: 'FREE',
    riddle:
      'Double me to break open your bonds. I am the natural base of logarithms and the 5th letter of the alphabet. What single letter am I?',
    hint: 'Letter E.',
  },
  {
    incompleteWord: 'O P E _',
    missingLetter: 'N',
    completedWord: 'OPEN',
    riddle:
      'What is the 14th letter of the alphabet, represents North on a compass, and completes the command to "O P E _" a secure portal?',
    hint: '14th letter. Capital N.',
  },
  {
    incompleteWord: 'V O I _',
    missingLetter: 'D',
    completedWord: 'VOID',
    riddle:
      'In Roman numerals I represent 500. In computer science I represent decimal format or debug mode. What 4th letter of the alphabet completes "V O I _"?',
    hint: '4th letter of the alphabet. Capital D.',
  },
  {
    incompleteWord: 'R O O _',
    missingLetter: 'T',
    completedWord: 'ROOT',
    riddle:
      'Superuser access on Unix systems requires this authority. Which 20th letter of the alphabet completes the word "R O O _"?',
    hint: '20th letter. Capital T.',
  },
];

// Mathematical symbol sets
const SYMBOL_SETS: { visible: [string, string]; hidden: string }[] = [
  { visible: ['∑', '√'], hidden: 'π' },
  { visible: ['∫', '∆'], hidden: '∞' },
  { visible: ['∏', '≈'], hidden: 'Ω' },
  { visible: ['λ', '≠'], hidden: 'Ψ' },
  { visible: ['∇', '±'], hidden: '∂' },
  { visible: ['⊕', '⊗'], hidden: '∯' },
];

// Single-digit riddles for Chest 2 ("LIES")
interface SingleDigitRiddle {
  title: string;
  question: string;
  answer: string;
  hint: string;
}

const SINGLE_DIGIT_RIDDLES: SingleDigitRiddle[] = [
  {
    title: 'THE HACKER PARADOX',
    question:
      'A captive AI declares: "3 of my 9 security nodes are active. If you invert this truth by subtracting active nodes from total nodes, and then divide by 2, you bypass my lie." What is the single digit?',
    answer: '3',
    hint: '(9 total - 3 active) = 6. Divided by 2 = ?',
  },
  {
    title: 'THE BITWISE REVERSAL',
    question:
      'Evaluate the arithmetic checksum: (4 × 3) - (14 ÷ 2). The resulting single digit disarms the deceit sensor.',
    answer: '5',
    hint: '(12) - (7) = ?',
  },
  {
    title: 'LOGICAL DECEPTION FILTER',
    question:
      'Security sensor A pulses every 2 seconds. Sensor B pulses every 3 seconds. At how many seconds does the first synchronized pulse occur (between 1 and 9)?',
    answer: '6',
    hint: 'Least common multiple of 2 and 3.',
  },
  {
    title: 'THE FIBONACCI CIPHER',
    question:
      'Identify the missing single digit in the Fibonacci memory chain: 1, 1, 2, 3, 5, ?',
    answer: '8',
    hint: 'Sum of previous two numbers: 3 + 5.',
  },
  {
    title: 'EVEN PRIME DISCRIMINATOR',
    question:
      'The liar asserts: "No prime number can ever be even." How many even prime numbers actually exist in all of mathematics?',
    answer: '1',
    hint: 'Only the number 2 is both even and prime.',
  },
  {
    title: 'BINARY NIBBLE CAPACITY',
    question:
      'How many bits are contained in a standard computational nibble (half a byte)? Single digit.',
    answer: '4',
    hint: 'A byte has 8 bits. A nibble has half that.',
  },
  {
    title: 'PARITY DECAY',
    question:
      'Complete the descending odd series: 9, 7, 5, 3, ? What is the next single-digit odd number?',
    answer: '1',
    hint: 'Subtract 2 from 3.',
  },
  {
    title: 'OCTAL UPPER BOUND',
    question:
      'In base-8 (octal numbering), what is the highest single numerical digit available before carrying over to 10?',
    answer: '7',
    hint: 'Digits in base-8 run from 0 to 7.',
  },
  {
    title: 'SYMMETRIC PRIME',
    question:
      'What single digit is the only number that is both a prime number and the exact number of sides on a triangle?',
    answer: '3',
    hint: 'A triangle has 3 vertices.',
  },
];

// Binary codes for Chest 1 ("TRUTH")
interface BinaryChallenge {
  binary: string;
  decimal: number;
}

const BINARY_CHALLENGES: BinaryChallenge[] = [
  { binary: '1011', decimal: 11 },
  { binary: '1101', decimal: 13 },
  { binary: '0110', decimal: 6 },
  { binary: '1110', decimal: 14 },
  { binary: '0101', decimal: 5 },
  { binary: '1001', decimal: 9 },
  { binary: '1111', decimal: 15 },
  { binary: '0111', decimal: 7 },
  { binary: '1010', decimal: 10 },
  { binary: '1100', decimal: 12 },
  { binary: '0011', decimal: 3 },
  { binary: '1000', decimal: 8 },
];

export function generateChestSequencePuzzle(): ChestSequencePuzzleData {
  // 1. Randomize Chest 1 (TRUTH)
  const binChallenge = BINARY_CHALLENGES[Math.floor(Math.random() * BINARY_CHALLENGES.length)];
  const truth: ChestTruthPuzzle = {
    binaryString: binChallenge.binary,
    decimalAnswer: binChallenge.decimal,
    question: `Hacker binary cipher intercepted: [ ${binChallenge.binary.split('').join(' ')} ]₂. Convert this 4-bit binary value to standard decimal to disengage the TRUTH security latch.`,
    hint: 'Binary positional place values from left to right: [8s, 4s, 2s, 1s]. Add the values where bit is 1.',
    rewardMessage: `TRUTH INTEGRITY CONFIRMED! Value ${binChallenge.decimal} verified. Clearance Level 1 granted. The LIES lock mechanism has been activated.`,
  };

  // 2. Randomize Chest 2 (LIES)
  const liesRiddle = SINGLE_DIGIT_RIDDLES[Math.floor(Math.random() * SINGLE_DIGIT_RIDDLES.length)];
  const lies: ChestLiesPuzzle = {
    title: liesRiddle.title,
    question: liesRiddle.question,
    answer: liesRiddle.answer,
    hint: liesRiddle.hint,
    rewardMessage: `DECEPTION DEFEATED! Key digit ${liesRiddle.answer} accepted. Clearance Level 2 granted. The UNKNOWN chest seal is now disengaged.`,
  };

  // 3. Randomize Chest 3 (UNKNOWN) & Wall Puzzle
  const wordPair = WORD_RIDDLE_PAIRS[Math.floor(Math.random() * WORD_RIDDLE_PAIRS.length)];
  const symbolSet = SYMBOL_SETS[Math.floor(Math.random() * SYMBOL_SETS.length)];

  const unknown: ChestUnknownPuzzle = {
    title: 'THE UNKNOWN CYPHER',
    question: wordPair.riddle,
    awardedLetter: wordPair.missingLetter.toUpperCase(),
    hint: wordPair.hint,
    rewardMessage: `ENIGMA RESOLVED! You uncovered the Alphabet Glyph "${wordPair.missingLetter.toUpperCase()}". It has been added to your Tactical HUD. Proceed to the North Mathematical Wall.`,
  };

  const wall: SymbolWallPuzzle = {
    visibleSymbols: symbolSet.visible,
    hiddenSymbol: symbolSet.hidden,
    incompleteWord: wordPair.incompleteWord,
    missingLetter: wordPair.missingLetter.toUpperCase(),
    completedWord: wordPair.completedWord,
    riddleHint: `The third mathematical symbol [ ${symbolSet.hidden} ] will ignite once the missing glyph is transcribed into the formula terminal.`,
  };

  return {
    truth,
    lies,
    unknown,
    wall,
  };
}
