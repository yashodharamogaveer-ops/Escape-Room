import { BoxPuzzleData, ColorName, ScrambledDigit } from '../types/game';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateBoxPuzzle(): BoxPuzzleData {
  const colors: ColorName[] = ['red', 'blue', 'green', 'yellow'];
  
  // 1. Randomize Painting color order (e.g. ['green', 'blue', 'red', 'yellow'])
  const paintingColorOrder = shuffleArray(colors);

  // 2. Choose 4 distinct digits between 1 and 9 for great readability
  const allDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const selectedDigits = shuffleArray(allDigits).slice(0, 4);

  // 3. Assign each painting color in sequence to a digit
  const colorToDigitMap: Record<ColorName, number> = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
  };

  paintingColorOrder.forEach((color, idx) => {
    colorToDigitMap[color] = selectedDigits[idx];
  });

  // Correct 4-digit code in the painting's color order
  const correctCode = paintingColorOrder.map(c => colorToDigitMap[c]).join('');

  // 4. Scramble the digits on the box note so they are strictly in the WRONG order
  let scrambledDigits: ScrambledDigit[] = [];
  let isSameOrder = true;
  let attempts = 0;

  while (isSameOrder && attempts < 20) {
    attempts++;
    const shuffledColors = shuffleArray(colors);
    scrambledDigits = shuffledColors.map(c => ({
      color: c,
      digit: colorToDigitMap[c],
    }));

    // Ensure it's not by chance the identical order as the painting
    isSameOrder = scrambledDigits.map(s => s.color).join(',') === paintingColorOrder.join(',');
  }

  // Fallback swap if by rare chance still identical
  if (isSameOrder) {
    [scrambledDigits[0], scrambledDigits[1]] = [scrambledDigits[1], scrambledDigits[0]];
  }

  return {
    correctCode,
    paintingColorOrder,
    scrambledDigits,
    colorToDigitMap,
  };
}
