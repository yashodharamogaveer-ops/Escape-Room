/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameWorld, InteractTarget, PlayerMapState } from './game/GameWorld';
import { generateBoxPuzzle } from './utils/puzzle';
import { getRandomQuestion } from './utils/questions';
import { getRandomDebugProgram } from './utils/debugPrograms';
import { generateMultiDoorPuzzle, DoorLetter } from './utils/mapBoardPuzzle';
import { generateChestSequencePuzzle } from './utils/chestPuzzle';
import { GameState } from './types/game';
import { soundManager } from './utils/audio';

import { HUD } from './components/HUD';
import { MapPanel } from './components/MapPanel';
import { KeypadModal } from './components/KeypadModal';
import { PaintingModal } from './components/PaintingModal';
import { QuestionModal } from './components/QuestionModal';
import { MapBoardModal } from './components/MapBoardModal';
import { TerminalModal } from './components/TerminalModal';
import { preloadPython } from './utils/codeRunner';
import { LeaderboardModal } from './components/LeaderboardModal';
import { addEntry, getSavedName, LeaderboardEntry } from './utils/leaderboard';
import { Room3KeypadModal } from './components/Room3KeypadModal';
import { ChestModal, ChestType } from './components/ChestModal';
import { SymbolWallModal } from './components/SymbolWallModal';
import { StartModal } from './components/StartModal';
import { WinModal } from './components/WinModal';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const gameWorldRef = useRef<GameWorld | null>(null);
  // Always-fresh handlers so the 3D world never calls stale closures
  const handlersRef = useRef<{
    handleInteract: (id: InteractTarget['id']) => void;
    handleRoomChange: (n: 1 | 2 | 3 | 4) => void;
    handlePortalEscaped: () => void;
  } | null>(null);

  // Core Game State across Room 1, Room 2, Room 3, and Room 4
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialProg = getRandomDebugProgram();
    const initialMultiDoor = generateMultiDoorPuzzle();
    const initialChestPuzzle = generateChestSequencePuzzle();
    return {
      view: 'START',
      currentRoom: 1,
      hasMap: false,
      hasKey: false,
      boxUnlocked: false,
      doorUnlocked: false,
      doorOpenProgress: 0,
      puzzleData: generateBoxPuzzle(),
      currentQuestion: getRandomQuestion(),
      wrongAnswersCount: 0,
      penaltySeconds: 0,
      lockoutEndTime: null,
      startTime: 0,
      endTime: null,
      elapsedSeconds: 0,
      escapeMethod: null,
      flashlightOn: true,
      soundEnabled: true,

      // Room 2 Multi-Door & Big Board Maze Challenge
      multiDoorPuzzle: initialMultiDoor,
      room2DoorUnlocked: false,
      room2AlertShown: false,

      // Room 3 Debug Challenge
      selectedProgram: initialProg,
      currentCode: initialProg.buggyCode,
      dataFragment: null,
      room3DoorUnlocked: false,
      hintsUsedCount: 0,
      terminalAttempts: 0,

      // Room 4 Final Safe
      room4SafeUnlocked: false,

      // Room 4 Three Pedestaled Chests & Cryptic Math Wall
      chestPuzzle: initialChestPuzzle,
      chestTruthUnlocked: false,
      chestLiesUnlocked: false,
      chestUnknownUnlocked: false,
      awardedLetter: null,
      room4HiddenDoorUnlocked: false,
    };
  });

  const [activeTarget, setActiveTarget] = useState<InteractTarget | null>(null);
  const [playerMapState, setPlayerMapState] = useState<PlayerMapState>({
    x: 0,
    z: 3.2,
    rotationY: 0,
  });
  const [playerName, setPlayerName] = useState<string>(getSavedName);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<{ entry: LeaderboardEntry; rank: number; total: number } | null>(null);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const [glitchAlert, setGlitchAlert] = useState<string | null>(null);

  // Initialize or reboot 3D world
  const initGameWorld = useCallback(() => {
    if (!mountRef.current) return;
    if (gameWorldRef.current) {
      gameWorldRef.current.dispose();
      gameWorldRef.current = null;
    }

    const world = new GameWorld(
      mountRef.current,
      gameState.puzzleData,
      gameState.chestPuzzle,
      {
        onInteract: (targetId) => {
          handlersRef.current?.handleInteract(targetId);
        },
        onTargetChange: (target) => {
          setActiveTarget(target);
        },
        onPlayerMove: (state) => {
          setPlayerMapState(state);
        },
        onRoomChange: (roomNum) => {
          handlersRef.current?.handleRoomChange(roomNum);
        },
        onPortalEnter: () => {
          handlersRef.current?.handlePortalEscaped();
        },
      }
    );

    gameWorldRef.current = world;
  }, [gameState.puzzleData, gameState.chestPuzzle]);

  // (Re)build the 3D world on first load and whenever a new run generates fresh puzzles
  useEffect(() => {
    initGameWorld();
    return () => {
      gameWorldRef.current?.dispose();
      gameWorldRef.current = null;
    };
  }, [initGameWorld]);

  // Continuous timer while playing
  useEffect(() => {
    if (gameState.view === 'START' || gameState.view === 'ESCAPED') return;

    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        elapsedSeconds: (Date.now() - prev.startTime) / 1000,
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.view]);

  // Start game handler
  const handleStartGame = (name: string) => {
    setPlayerName(name);
    setRunResult(null);
    soundManager.init();
    soundManager.startAmbientHum();
    setGameState((prev) => ({
      ...prev,
      view: 'PLAYING',
      startTime: Date.now(),
    }));
  };

  // Interact router for all 4 rooms
  const handleInteract = (targetId: InteractTarget['id']) => {
    switch (targetId) {
      case 'MAP':
        gameWorldRef.current?.pickupMap();
        setGameState((prev) => ({
          ...prev,
          hasMap: true,
        }));
        showBannerAlert('TACTICAL SCHEMATIC ACQUIRED! Real-time radar is now active on the right panel.');
        break;

      case 'PAINTING':
        setGameState((prev) => ({
          ...prev,
          view: 'INSPECTING_PAINTING',
        }));
        break;

      case 'BOX':
        setGameState((prev) => ({
          ...prev,
          view: 'INSPECTING_BOX',
        }));
        break;

      case 'DOOR':
        if (gameState.currentRoom === 1) {
          handleRoom1DoorInteraction();
        } else if (gameState.currentRoom === 3) {
          if (!gameState.room3DoorUnlocked) {
            soundManager.playWrongBuzzer();
            showBannerAlert('AIRLOCK SEALED: Debug the program on the central terminal to generate the data fragment key.');
          }
        }
        break;

      // Room 2: Inspect Big Board
      case 'MAP_BOARD':
        setGameState((prev) => ({
          ...prev,
          view: 'INSPECTING_MAP_BOARD',
        }));
        break;

      // Room 2: 4 Exit Doors (A, B, C, D)
      case 'DOOR_A':
      case 'DOOR_B':
      case 'DOOR_C':
      case 'DOOR_D': {
        const doorLetter = targetId.replace('DOOR_', '') as DoorLetter;
        handleRoom2DoorAttempt(doorLetter);
        break;
      }

      // Room 3: Debug Terminal
      case 'TERMINAL':
        setGameState((prev) => ({
          ...prev,
          view: 'TERMINAL_MODAL',
        }));
        break;

      // Room 4: The Three Chests
      case 'CHEST_TRUTH':
        setGameState((prev) => ({
          ...prev,
          view: 'INSPECTING_CHEST_TRUTH',
        }));
        break;

      case 'CHEST_LIES':
        setGameState((prev) => ({
          ...prev,
          view: 'INSPECTING_CHEST_LIES',
        }));
        break;

      case 'CHEST_UNKNOWN':
        setGameState((prev) => ({
          ...prev,
          view: 'INSPECTING_CHEST_UNKNOWN',
        }));
        break;

      // Room 4: Cryptic Mathematical Symbol Wall
      case 'SYMBOL_WALL':
        setGameState((prev) => ({
          ...prev,
          view: 'INSPECTING_SYMBOL_WALL',
        }));
        break;

      // Room 4: Safe fallback
      case 'SAFE':
        setGameState((prev) => ({
          ...prev,
          view: 'ROOM3_KEYPAD',
        }));
        break;
    }
  };

  // ROOM 1: Solves the Hacker Number/Alphabet Series to unlock Door 1 and access Room 2
  const handleRoom1DoorInteraction = () => {
    if (gameState.doorUnlocked) return;
    setGameState((prev) => ({
      ...prev,
      view: 'QUESTION_MODAL',
    }));
  };

  // Question Modal Correct Answer: Door 1 unlocks and grants access to Room 2
  const handleQuestionCorrect = () => {
    gameWorldRef.current?.unlockDoor1();
    setGameState((prev) => ({
      ...prev,
      doorUnlocked: true,
      escapeMethod: 'MAP_APTITUDE',
      view: 'PLAYING',
    }));
    showBannerAlert('SERIES SOLVED! Door 1 unlocked. Access granted to Sector 02.');
  };

  // ROOM 2: Multi-Door attempt logic
  const handleRoom2DoorAttempt = (doorLetter: DoorLetter) => {
    if (gameState.room2DoorUnlocked) {
      showBannerAlert('Door ' + doorLetter + ' is open. Proceed into Sector 03.');
      return;
    }

    if (doorLetter === gameState.multiDoorPuzzle.correctDoor) {
      gameWorldRef.current?.openRoom2Door(doorLetter);
      setGameState((prev) => ({
        ...prev,
        room2DoorUnlocked: true,
      }));
      showBannerAlert(
        'CONDUIT CONFIRMED SAFE! Door ' + doorLetter + ' unlocked. Step through to Sector 03 (Debug Room).'
      );
    } else {
      soundManager.playWrongBuzzer();
      setGameState((prev) => ({
        ...prev,
        wrongAnswersCount: prev.wrongAnswersCount + 1,
        penaltySeconds: prev.penaltySeconds + 15,
      }));
      showBannerAlert(
        'TRAP TRIGGERED! Misleading conduit at Door ' + doorLetter + '. Rerouted back to previous step (+15s penalty)!'
      );
      // Teleport player back to previous step (Room 2 entrance concourse)
      gameWorldRef.current?.teleportTo(0, -6.8);
    }
  };

  // Room transition listener (called when player physically walks across doorways)
  const handleRoomChange = (newRoom: 1 | 2 | 3 | 4) => {
    setGameState((prev) => ({
      ...prev,
      currentRoom: newRoom,
    }));

    if (newRoom === 2 || newRoom === 3) {
      preloadPython(); // warm up real Python before the debug terminal is used
    }

    if (newRoom === 2) {
      setGlitchAlert(
        'SYSTEM ALERT: Sector 02 contains 4 exit portals. Check the Central Big Board to trace the safe conduit and avoid misleading cross-loops!'
      );
      setTimeout(() => {
        setGlitchAlert(null);
      }, 7000);
    } else if (newRoom === 3) {
      showBannerAlert(
        'ENTERED SECTOR 03: SERVER DEBUG ROOM. Debug the program on the central terminal [E] to extract the data fragment.'
      );
    } else if (newRoom === 4) {
      showBannerAlert(
        'ENTERED SECTOR 04: THE MONOLITH. Solve the 3 sequential chests [TRUTH -> LIES -> UNKNOWN] to acquire the alphabet glyph, then transcribe it to breach the solid wall!'
      );
    }
  };

  // Room 3 Debug Challenge: Success
  const handleTerminalSuccess = (dataFragment: string) => {
    gameWorldRef.current?.unlockDoor3();
    setGameState((prev) => ({
      ...prev,
      dataFragment,
      room3DoorUnlocked: true,
    }));
    showBannerAlert('DATA FRAGMENT ACQUIRED: "' + dataFragment + '". Airlock to Sector 04 is UNLOCKED!');
  };

  // Room 3 Hint Usage (+20s penalty per hint)
  const handleUseHint = () => {
    setGameState((prev) => ({
      ...prev,
      hintsUsedCount: prev.hintsUsedCount + 1,
      penaltySeconds: prev.penaltySeconds + 20,
    }));
  };

  // ROOM 4: Chest Unlocks (TRUTH, LIES, UNKNOWN)
  const handleChestUnlock = (type: ChestType, letter?: string) => {
    gameWorldRef.current?.unlockChest(type);

    setGameState((prev) => {
      const nextState = { ...prev, view: 'PLAYING' as const };
      if (type === 'TRUTH') {
        nextState.chestTruthUnlocked = true;
      } else if (type === 'LIES') {
        nextState.chestLiesUnlocked = true;
      } else if (type === 'UNKNOWN') {
        nextState.chestUnknownUnlocked = true;
        const awarded = letter || prev.chestPuzzle.unknown.awardedLetter;
        nextState.awardedLetter = awarded;
      }
      return nextState;
    });

    if (type === 'TRUTH') {
      showBannerAlert('CHEST "TRUTH" UNLOCKED! Binary verified. LIES security matrix is now disengaged.');
    } else if (type === 'LIES') {
      showBannerAlert('CHEST "LIES" UNLOCKED! Deception defeated. UNKNOWN container seal is now open.');
    } else if (type === 'UNKNOWN') {
      const awarded = letter || gameState.chestPuzzle.unknown.awardedLetter;
      showBannerAlert(`ALPHABET GLYPH [${awarded}] ACQUIRED! Transcribe it to the North Mathematical Wall.`);
    }
  };

  // Penalty from Chest or Wall failure (+15s)
  const handleApplyPenalty = (seconds: number) => {
    setGameState((prev) => ({
      ...prev,
      wrongAnswersCount: prev.wrongAnswersCount + 1,
      penaltySeconds: prev.penaltySeconds + seconds,
    }));
  };

  // ROOM 4: Wall Symbol Complete & Hidden Door Breach!
  const handleWallDoorUnlocked = () => {
    gameWorldRef.current?.revealHiddenDoor();
    setGameState((prev) => ({
      ...prev,
      room4HiddenDoorUnlocked: true,
    }));
    showBannerAlert('WALL BREACH DETECTED: Final Round Portal Open.');
  };

  // Final Step: Player steps through the breached doorway into the Portal
  const handlePortalEscaped = () => {
    setGameState((prev) => {
      if (prev.view === 'ESCAPED') return prev;
      soundManager.playVictoryFanfare();
      return {
        ...prev,
        room4SafeUnlocked: true,
        endTime: Date.now(),
        view: 'ESCAPED',
      };
    });
  };

  // Record the finished run on the leaderboard exactly once per escape
  const savedRunRef = useRef<number | null>(null);
  useEffect(() => {
    if (gameState.view !== 'ESCAPED' || !gameState.endTime) return;
    if (savedRunRef.current === gameState.endTime) return;
    savedRunRef.current = gameState.endTime;
    const baseSeconds = Math.max(0, (gameState.endTime - gameState.startTime) / 1000);
    setRunResult(
      addEntry({
        name: playerName,
        baseSeconds,
        penaltySeconds: gameState.penaltySeconds,
        totalSeconds: baseSeconds + gameState.penaltySeconds,
        hints: gameState.hintsUsedCount,
        attempts: gameState.wrongAnswersCount,
        route: gameState.escapeMethod === 'BOX_KEY' ? 'Color Cipher Key' : 'Aptitude Logic Test',
      })
    );
  }, [gameState.view, gameState.endTime]);

  // Room 4 Safe Success (Legacy fallback)
  const handleRoom3SafeSuccess = () => {
    gameWorldRef.current?.unlockSafe();
    setGameState((prev) => ({
      ...prev,
      room4SafeUnlocked: true,
      endTime: Date.now(),
      view: 'ESCAPED',
    }));
  };

  // Temporary system banner helper
  const showBannerAlert = (msg: string) => {
    setSystemAlert(msg);
    setTimeout(() => {
      setSystemAlert((current) => (current === msg ? null : current));
    }, 4500);
  };

  // Keypad Box Success (Master Key)
  const handleBoxUnlocked = () => {
    gameWorldRef.current?.unlockBox();
    setGameState((prev) => ({
      ...prev,
      boxUnlocked: true,
    }));
  };

  const handleTakeKey = () => {
    gameWorldRef.current?.pickupKey();
    setGameState((prev) => ({
      ...prev,
      hasKey: true,
    }));
    showBannerAlert('MASTER KEY ACQUIRED! High-value asset secured for the Last Door in Sector 04.');
  };

  // Question Modal Wrong Answer
  const handleQuestionWrong = () => {
    setGameState((prev) => {
      const nextWrong = prev.wrongAnswersCount + 1;
      const penaltyToAdd = nextWrong >= 3 && prev.wrongAnswersCount < 3 ? 30 : 0;
      return {
        ...prev,
        wrongAnswersCount: nextWrong,
        penaltySeconds: prev.penaltySeconds + penaltyToAdd,
        lockoutEndTime: Date.now() + 15000,
        currentQuestion: getRandomQuestion(prev.currentQuestion?.id),
      };
    });
  };

  // Toggles
  const handleToggleFlashlight = () => {
    const isNowOn = gameWorldRef.current?.toggleFlashlight() ?? true;
    setGameState((prev) => ({
      ...prev,
      flashlightOn: isNowOn,
    }));
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setGameState((prev) => ({
      ...prev,
      soundEnabled: !muted,
    }));
  };

  // Play Again: Regenerates all puzzles and code (new map board every run!)
  const handlePlayAgain = () => {
    const newPuzzle = generateBoxPuzzle();
    const newQuestion = getRandomQuestion();
    const newProgram = getRandomDebugProgram();
    const newMultiDoor = generateMultiDoorPuzzle();
    const newChestPuzzle = generateChestSequencePuzzle();

    setGameState({
      view: 'START',
      currentRoom: 1,
      hasMap: false,
      hasKey: false,
      boxUnlocked: false,
      doorUnlocked: false,
      doorOpenProgress: 0,
      puzzleData: newPuzzle,
      currentQuestion: newQuestion,
      wrongAnswersCount: 0,
      penaltySeconds: 0,
      lockoutEndTime: null,
      startTime: 0,
      endTime: null,
      elapsedSeconds: 0,
      escapeMethod: null,
      flashlightOn: true,
      soundEnabled: true,

      multiDoorPuzzle: newMultiDoor,
      room2DoorUnlocked: false,
      room2AlertShown: false,

      selectedProgram: newProgram,
      currentCode: newProgram.buggyCode,
      dataFragment: null,
      room3DoorUnlocked: false,
      hintsUsedCount: 0,
      terminalAttempts: 0,

      room4SafeUnlocked: false,

      chestPuzzle: newChestPuzzle,
      chestTruthUnlocked: false,
      chestLiesUnlocked: false,
      chestUnknownUnlocked: false,
      awardedLetter: null,
      room4HiddenDoorUnlocked: false,
    });

    // The effect watching puzzleData/chestPuzzle rebuilds the 3D world for the new run.
  };

  handlersRef.current = { handleInteract, handleRoomChange, handlePortalEscaped };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-crosshair outline-none"
        tabIndex={0}
      />

      {/* Persistent In-Game HUD */}
      {gameState.view !== 'START' && gameState.view !== 'ESCAPED' && (
        <HUD
          gameState={gameState}
          activeTarget={activeTarget}
          glitchAlert={glitchAlert}
          onInteract={() => {
            if (activeTarget) {
              handleInteract(activeTarget.id);
            }
          }}
          onToggleFlashlight={handleToggleFlashlight}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Always-visible Map Panel on the Right Side */}
      {gameState.view !== 'START' && gameState.view !== 'ESCAPED' && (
        <MapPanel
          hasMap={gameState.hasMap}
          currentRoom={gameState.currentRoom}
          playerState={playerMapState}
        />
      )}

      {/* Floating System Alert Banner */}
      {systemAlert && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 animate-fade-in pointer-events-none">
          <div className="bg-slate-950/95 border border-cyan-500/80 rounded-xl p-3 text-cyan-200 text-xs font-mono-code shadow-2xl flex items-center justify-center text-center">
            {systemAlert}
          </div>
        </div>
      )}

      {/* Modals & Overlays */}
      {gameState.view === 'START' && (
        <StartModal onStartGame={handleStartGame} onShowLeaderboard={() => setShowLeaderboard(true)} />
      )}

      {gameState.view === 'INSPECTING_BOX' && (
        <KeypadModal
          puzzleData={gameState.puzzleData}
          isUnlocked={gameState.boxUnlocked}
          hasKey={gameState.hasKey}
          onSuccessUnlock={handleBoxUnlocked}
          onTakeKey={handleTakeKey}
          onClose={() => setGameState((prev) => ({ ...prev, view: 'PLAYING' }))}
        />
      )}

      {gameState.view === 'INSPECTING_PAINTING' && (
        <PaintingModal
          colorOrder={gameState.puzzleData.paintingColorOrder}
          onClose={() => setGameState((prev) => ({ ...prev, view: 'PLAYING' }))}
        />
      )}

      {gameState.view === 'QUESTION_MODAL' && gameState.currentQuestion && (
        <QuestionModal
          question={gameState.currentQuestion}
          wrongAnswersCount={gameState.wrongAnswersCount}
          lockoutEndTime={gameState.lockoutEndTime}
          onCorrectAnswer={handleQuestionCorrect}
          onWrongAnswer={handleQuestionWrong}
          onClose={() => setGameState((prev) => ({ ...prev, view: 'PLAYING' }))}
        />
      )}

      {/* Room 2: Big Navigation Board Inspection Modal */}
      {gameState.view === 'INSPECTING_MAP_BOARD' && (
        <MapBoardModal
          puzzleData={gameState.multiDoorPuzzle}
          onClose={() => setGameState((prev) => ({ ...prev, view: 'PLAYING' }))}
        />
      )}

      {/* Room 3: Debug Terminal Modal */}
      {gameState.view === 'TERMINAL_MODAL' && (
        <TerminalModal
          program={gameState.selectedProgram}
          elapsedSeconds={gameState.elapsedSeconds}
          hintsUsedCount={gameState.hintsUsedCount}
          attemptsCount={gameState.terminalAttempts}
          initialCode={gameState.currentCode}
          isUnlocked={gameState.room3DoorUnlocked}
          onCodeChange={(newCode) =>
            setGameState((prev) => ({ ...prev, currentCode: newCode }))
          }
          onSuccess={handleTerminalSuccess}
          onUseHint={handleUseHint}
          onAttempt={() =>
            setGameState((prev) => ({
              ...prev,
              terminalAttempts: prev.terminalAttempts + 1,
            }))
          }
          onClose={() => setGameState((prev) => ({ ...prev, view: 'PLAYING' }))}
        />
      )}

      {/* Room 4: Final Vault Safe / Last Door Keypad */}
      {gameState.view === 'ROOM3_KEYPAD' && (
        <Room3KeypadModal
          expectedCode={gameState.selectedProgram.expectedOutput}
          dataFragment={gameState.dataFragment}
          hasKey={gameState.hasKey}
          onSuccess={handleRoom3SafeSuccess}
          onClose={() => setGameState((prev) => ({ ...prev, view: 'PLAYING' }))}
        />
      )}

      {/* Room 4: Three Chests (TRUTH -> LIES -> UNKNOWN) */}
      {(gameState.view === 'INSPECTING_CHEST_TRUTH' ||
        gameState.view === 'INSPECTING_CHEST_LIES' ||
        gameState.view === 'INSPECTING_CHEST_UNKNOWN') && (
        <ChestModal
          key={gameState.view}
          chestType={
            gameState.view === 'INSPECTING_CHEST_TRUTH'
              ? 'TRUTH'
              : gameState.view === 'INSPECTING_CHEST_LIES'
              ? 'LIES'
              : 'UNKNOWN'
          }
          puzzle={gameState.chestPuzzle}
          truthUnlocked={gameState.chestTruthUnlocked}
          liesUnlocked={gameState.chestLiesUnlocked}
          unknownUnlocked={gameState.chestUnknownUnlocked}
          awardedLetter={gameState.awardedLetter}
          onUnlock={handleChestUnlock}
          onApplyPenalty={handleApplyPenalty}
          onClose={() => setGameState((prev) => ({ ...prev, view: 'PLAYING' }))}
        />
      )}

      {/* Room 4: Cryptic Mathematical Symbol Wall */}
      {gameState.view === 'INSPECTING_SYMBOL_WALL' && (
        <SymbolWallModal
          wallPuzzle={gameState.chestPuzzle.wall}
          awardedLetter={gameState.awardedLetter}
          doorUnlocked={gameState.room4HiddenDoorUnlocked}
          onUnlockDoor={handleWallDoorUnlocked}
          onApplyPenalty={handleApplyPenalty}
          onClose={() => setGameState((prev) => ({ ...prev, view: 'PLAYING' }))}
        />
      )}

      {/* Escaped Win Screen */}
      {gameState.view === 'ESCAPED' && (
        <WinModal
          playerName={playerName}
          result={runResult}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          escapeMethod={gameState.escapeMethod}
          elapsedSeconds={gameState.endTime ? (gameState.endTime - gameState.startTime) / 1000 : gameState.elapsedSeconds}
          penaltySeconds={gameState.penaltySeconds}
          wrongAnswersCount={gameState.wrongAnswersCount}
          hintsUsedCount={gameState.hintsUsedCount}
          dataFragment={gameState.dataFragment}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal highlightId={runResult?.entry.id} onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );
}
