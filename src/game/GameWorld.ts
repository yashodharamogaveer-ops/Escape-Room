import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BoxPuzzleData } from '../types/game';
import { DoorLetter } from '../utils/mapBoardPuzzle';
import { ChestSequencePuzzleData } from '../utils/chestPuzzle';
import {
  createConcreteFloorTexture,
  createConcreteWallTexture,
  createWoodCrateTexture,
  createDoorTexture,
  createPaintingTexture,
  createBoxNoteTexture,
  createMapSheetTexture,
  createBigBoardTexture,
} from '../utils/textures';
import { soundManager } from '../utils/audio';

export interface InteractTarget {
  id:
    | 'MAP'
    | 'BOX'
    | 'PAINTING'
    | 'DOOR'
    | 'MAP_BOARD'
    | 'DOOR_A'
    | 'DOOR_B'
    | 'DOOR_C'
    | 'DOOR_D'
    | 'TERMINAL'
    | 'SAFE'
    | 'CHEST_TRUTH'
    | 'CHEST_LIES'
    | 'CHEST_UNKNOWN'
    | 'SYMBOL_WALL';
  prompt: string;
  distance: number;
}

export interface PlayerMapState {
  x: number;
  z: number;
  rotationY: number;
}

interface ServerLed {
  mesh: THREE.Mesh;
  color: THREE.Color;
  blinkRate: number;
  phase: number;
}

export class GameWorld {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();

  // Lighting & Flashlight
  private flashlight!: THREE.SpotLight;
  private flashlightTarget!: THREE.Object3D;
  private redSirenLight!: THREE.PointLight;
  private sirenPivot!: THREE.Group;
  private ceilingFlickerLight!: THREE.PointLight;
  private terminalLight!: THREE.PointLight;

  // 3D Objects: Room 1
  private door1Group!: THREE.Group;
  private door1Panel!: THREE.Mesh;
  private door1StatusLed!: THREE.Mesh;
  private deskGroup!: THREE.Group;
  private crateGroups: THREE.Group[] = [];
  private paintingGroup!: THREE.Group;
  private boxGroup!: THREE.Group;
  private boxLid!: THREE.Group;
  private keyItemInsideBox!: THREE.Group;
  private mapItemMesh!: THREE.Group;
  private mapBeaconLight!: THREE.PointLight;

  // 3D Objects: Room 2 (Multi-Door & Big Board)
  private room2Group!: THREE.Group;
  private bigBoardGroup!: THREE.Group;
  private doorsRoom2: Record<DoorLetter, { group: THREE.Group; panel: THREE.Mesh; led: THREE.Mesh; opened: boolean; progress: number }> = {
    A: {} as any,
    B: {} as any,
    C: {} as any,
    D: {} as any,
  };

  // 3D Objects: Room 3 (Debug Room)
  private room3Group!: THREE.Group;
  private serverLeds: ServerLed[] = [];
  private terminalDeskGroup!: THREE.Group;
  private terminalScreenMesh!: THREE.Mesh;
  private door3Group!: THREE.Group;
  private door3Panel!: THREE.Mesh;
  private door3StatusLed!: THREE.Mesh;

  // 3D Objects: Room 4 (High-Tech Chamber & Three Pedestaled Chests)
  private room4Group!: THREE.Group;
  private safeGroup!: THREE.Group;
  private safeDoor!: THREE.Group;
  private safeStatusLed!: THREE.Mesh;

  // Room 4 Chests: TRUTH, LIES, UNKNOWN
  private chestLids: Record<'TRUTH' | 'LIES' | 'UNKNOWN', THREE.Group> = {
    TRUTH: {} as any,
    LIES: {} as any,
    UNKNOWN: {} as any,
  };
  private chestGlowLights: Record<'TRUTH' | 'LIES' | 'UNKNOWN', THREE.PointLight> = {
    TRUTH: {} as any,
    LIES: {} as any,
    UNKNOWN: {} as any,
  };
  private chestStatus: Record<'TRUTH' | 'LIES' | 'UNKNOWN', { opened: boolean; progress: number }> = {
    TRUTH: { opened: false, progress: 0 },
    LIES: { opened: false, progress: 0 },
    UNKNOWN: { opened: false, progress: 0 },
  };

  // Room 4 Monolithic Wall & Hidden Door
  private wallHiddenDoorLeft!: THREE.Mesh;
  private wallHiddenDoorRight!: THREE.Mesh;
  private symbolWallCanvas!: HTMLCanvasElement;
  private symbolWallTex!: THREE.CanvasTexture;
  private symbolWallMesh!: THREE.Mesh;
  private hiddenDoorOpened: boolean = false;
  private hiddenDoorProgress: number = 0;
  private seamStripMesh: THREE.Mesh | null = null;
  private wallShakeTime: number = 0;
  private portalVortexMesh!: THREE.Mesh;
  private portalVortexLight!: THREE.PointLight;

  // Textures cache for disposal
  private texturesToDispose: THREE.Texture[] = [];

  // Player state & controls
  private playerPos: THREE.Vector3 = new THREE.Vector3(0, 1.65, 3.2);
  private cameraPitch: number = 0;
  private cameraYaw: number = 0;
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private isSprinting: boolean = false;
  private isPointerLocked: boolean = false;
  private footstepTimer: number = 0;

  // Mouse dragging fallback
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // Puzzle & Game status
  private puzzleData: BoxPuzzleData;
  private chestPuzzle: ChestSequencePuzzleData;
  private hasMap: boolean = false;
  private hasKey: boolean = false;
  private boxOpened: boolean = false;

  private door1Opened: boolean = false;
  private door1Progress: number = 0;
  private door1Slammed: boolean = false;

  private door3Opened: boolean = false;
  private door3Progress: number = 0;

  private safeOpened: boolean = false;
  private safeProgress: number = 0;

  private currentRoom: 1 | 2 | 3 | 4 = 1;

  private currentActiveTarget: InteractTarget | null = null;

  // Callbacks to React
  private onInteractCallback?: (target: InteractTarget['id']) => void;
  private onTargetChangeCallback?: (target: InteractTarget | null) => void;
  private onPlayerMoveCallback?: (state: PlayerMapState) => void;
  private onRoomChangeCallback?: (room: 1 | 2 | 3 | 4) => void;
  private onPortalEnterCallback?: () => void;

  constructor(
    container: HTMLElement,
    puzzleData: BoxPuzzleData,
    chestPuzzle: ChestSequencePuzzleData,
    callbacks: {
      onInteract: (target: InteractTarget['id']) => void;
      onTargetChange: (target: InteractTarget | null) => void;
      onPlayerMove: (state: PlayerMapState) => void;
      onRoomChange?: (room: 1 | 2 | 3 | 4) => void;
      onPortalEnter?: () => void;
    }
  ) {
    this.container = container;
    this.puzzleData = puzzleData;
    this.chestPuzzle = chestPuzzle;
    this.onInteractCallback = callbacks.onInteract;
    this.onTargetChangeCallback = callbacks.onTargetChange;
    this.onPlayerMoveCallback = callbacks.onPlayerMove;
    this.onRoomChangeCallback = callbacks.onRoomChange;
    this.onPortalEnterCallback = callbacks.onPortalEnter;

    this.checkSoftwareGl();
    this.initScene();
    this.initLights();

    // Build the 4 sequential sectors
    this.buildRoom1();
    this.buildRoom2();
    this.buildRoom3();
    this.buildRoom4();

    this.bindEvents();
    this.startLoop();
  }

  private checkSoftwareGl(): void {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) {
      this.isSoftwareGl = true;
      return;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  }

  private initScene(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080d);
    this.scene.fog = new THREE.FogExp2(0x080b11, 0.042);

    this.camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 65);
    this.camera.position.copy(this.playerPos);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {}
  }

  private initLights(): void {
    const amb = new THREE.AmbientLight(0x18202d, 0.45);
    this.scene.add(amb);

    const hemiLight = new THREE.HemisphereLight(0x273b5c, 0x090d14, 0.5);
    hemiLight.position.set(0, 4, 0);
    this.scene.add(hemiLight);

    // Siren lamp in Room 1
    this.sirenPivot = new THREE.Group();
    this.sirenPivot.position.set(0, 3.4, 0);
    this.scene.add(this.sirenPivot);

    const sirenHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x111317, metalness: 0.8, roughness: 0.3 })
    );
    sirenHousing.position.y = 0.15;
    this.sirenPivot.add(sirenHousing);

    const glassDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhysicalMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.85,
        roughness: 0.1,
      })
    );
    glassDome.rotation.x = Math.PI;
    this.sirenPivot.add(glassDome);

    this.redSirenLight = new THREE.PointLight(0xef4444, 2.5, 14, 1.6);
    this.redSirenLight.position.set(0, -0.1, 0);
    this.sirenPivot.add(this.redSirenLight);

    this.ceilingFlickerLight = new THREE.PointLight(0xbfdbfe, 1.2, 10, 1.8);
    this.ceilingFlickerLight.position.set(0, 3.3, 1.5);
    this.scene.add(this.ceilingFlickerLight);

    // Flashlight
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);

    this.flashlight = new THREE.SpotLight(0xfff7ed, 4.2, 22, Math.PI / 7, 0.45, 1.4);
    this.flashlight.position.copy(this.camera.position);
    this.flashlight.target = this.flashlightTarget;
    this.flashlight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      this.flashlight.shadow.mapSize.width = 1024;
      this.flashlight.shadow.mapSize.height = 1024;
      this.flashlight.shadow.bias = -0.0005;
    }
    this.scene.add(this.flashlight);
  }

  // --- ROOM 1: CAGE DETENTION ROOM (Z: 6 to -6) ---

  private buildRoom1(): void {
    const floorTex = createConcreteFloorTexture();
    const wallTex = createConcreteWallTexture();
    this.texturesToDispose.push(floorTex, wallTex);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.15 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    this.scene.add(floor);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9, metalness: 0.2 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.6, 0);
    this.scene.add(ceiling);

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8, metalness: 0.2 });

    const wallN1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.6, 0.4), wallMat);
    wallN1.position.set(-3.75, 1.8, -6);
    this.scene.add(wallN1);

    const wallN2 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.6, 0.4), wallMat);
    wallN2.position.set(3.75, 1.8, -6);
    this.scene.add(wallN2);

    const wallNTop = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.8, 0.4), wallMat);
    wallNTop.position.set(0, 3.2, -6);
    this.scene.add(wallNTop);

    const wallS = new THREE.Mesh(new THREE.BoxGeometry(12, 3.6, 0.4), wallMat);
    wallS.position.set(0, 1.8, 6);
    this.scene.add(wallS);

    const wallE = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 12), wallMat);
    wallE.position.set(6, 1.8, 0);
    this.scene.add(wallE);

    const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 12), wallMat);
    wallW.position.set(-6, 1.8, 0);
    this.scene.add(wallW);

    // Cage Bars in Room 1
    const barMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, metalness: 0.9, roughness: 0.4 });
    const cageBarGeom = new THREE.CylinderGeometry(0.025, 0.025, 3.6, 8);
    for (let bx = 1.2; bx <= 5.6; bx += 0.35) {
      const bar = new THREE.Mesh(cageBarGeom, barMat);
      bar.position.set(bx, 1.8, 1.2);
      this.scene.add(bar);
    }
    const cageFrame = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.08, 0.08), barMat);
    cageFrame.position.set(3.4, 3.2, 1.2);
    this.scene.add(cageFrame);

    this.buildDoor1();
    this.buildHackerDesk();
    this.buildCrates();
    this.buildWallPainting();
    this.buildLockedBox();
    this.buildHiddenMap();
  }

  private buildDoor1(): void {
    this.door1Group = new THREE.Group();
    this.door1Group.position.set(0, 0, -5.85);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, metalness: 0.85, roughness: 0.3 });
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 0.3), frameMat);
    frameL.position.set(-1.3, 1.4, 0);
    this.door1Group.add(frameL);

    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 0.3), frameMat);
    frameR.position.set(1.3, 1.4, 0);
    this.door1Group.add(frameR);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.3), frameMat);
    frameTop.position.set(0, 2.8, 0);
    this.door1Group.add(frameTop);

    const doorTex = createDoorTexture();
    this.texturesToDispose.push(doorTex);
    const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, metalness: 0.75, roughness: 0.35 });
    this.door1Panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.7, 0.15), doorMat);
    this.door1Panel.position.set(0, 1.35, 0);
    this.door1Group.add(this.door1Panel);

    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    this.door1StatusLed = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), ledMat);
    this.door1StatusLed.position.set(1.4, 1.55, 0.15);
    this.door1Group.add(this.door1StatusLed);

    this.scene.add(this.door1Group);
  }

  private buildHackerDesk(): void {
    this.deskGroup = new THREE.Group();
    this.deskGroup.position.set(3.9, 0, -2.5);

    const woodTex = createWoodCrateTexture();
    this.texturesToDispose.push(woodTex);
    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.08, 1.2),
      new THREE.MeshStandardMaterial({ map: woodTex, metalness: 0.2, roughness: 0.7 })
    );
    tableTop.position.set(0, 0.95, 0);
    this.deskGroup.add(tableTop);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, metalness: 0.9, roughness: 0.25 });
    const legPositions = [
      [-0.95, 0.47, -0.45],
      [0.95, 0.47, -0.45],
      [-0.95, 0.47, 0.45],
      [0.95, 0.47, 0.45],
    ];
    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.08), legMat);
      leg.position.set(lx, ly, lz);
      this.deskGroup.add(leg);
    });

    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.9), legMat);
    shelf.position.set(0, 0.22, 0);
    this.deskGroup.add(shelf);

    this.scene.add(this.deskGroup);
  }

  private buildCrates(): void {
    const crateTex = createWoodCrateTexture();
    this.texturesToDispose.push(crateTex);
    const crateMat = new THREE.MeshStandardMaterial({ map: crateTex, metalness: 0.15, roughness: 0.75 });

    const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), crateMat);
    c1.position.set(-3.8, 0.4, 1.0);
    this.scene.add(c1);

    const c2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.4), crateMat);
    c2.position.set(-3.6, 0.5, 3.8);
    this.scene.add(c2);
  }

  private buildWallPainting(): void {
    this.paintingGroup = new THREE.Group();
    this.paintingGroup.position.set(-5.75, 1.9, -1.0);
    this.paintingGroup.rotation.y = Math.PI / 2;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.6, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x111419, metalness: 0.85, roughness: 0.25 })
    );
    this.paintingGroup.add(frame);

    const paintTex = createPaintingTexture(this.puzzleData.paintingColorOrder);
    this.texturesToDispose.push(paintTex);
    const canvasMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.4),
      new THREE.MeshStandardMaterial({ map: paintTex, roughness: 0.4, metalness: 0.1 })
    );
    canvasMesh.position.z = 0.05;
    this.paintingGroup.add(canvasMesh);

    this.scene.add(this.paintingGroup);
  }

  private buildLockedBox(): void {
    this.boxGroup = new THREE.Group();
    this.boxGroup.position.set(-3.8, 0.8, 1.0);
    this.boxGroup.rotation.y = 0.3;

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e2430, metalness: 0.9, roughness: 0.25 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 0.45), metalMat);
    body.position.set(0, 0.14, 0);
    this.boxGroup.add(body);

    this.boxLid = new THREE.Group();
    this.boxLid.position.set(0, 0.28, -0.22);
    const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 0.46), metalMat);
    lidMesh.position.set(0, 0.025, 0.22);
    this.boxLid.add(lidMesh);
    this.boxGroup.add(this.boxLid);

    this.keyItemInsideBox = new THREE.Group();
    this.keyItemInsideBox.position.set(0, 0.18, 0);
    this.keyItemInsideBox.visible = false;
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), goldMat);
    shaft.rotation.z = Math.PI / 2;
    this.keyItemInsideBox.add(shaft);
    this.boxGroup.add(this.keyItemInsideBox);

    const noteTex = createBoxNoteTexture(this.puzzleData.scrambledDigits);
    this.texturesToDispose.push(noteTex);
    const noteMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.21),
      new THREE.MeshStandardMaterial({ map: noteTex, roughness: 0.6 })
    );
    noteMesh.position.set(0, 0.14, 0.23);
    this.boxGroup.add(noteMesh);

    this.scene.add(this.boxGroup);
  }

  private buildHiddenMap(): void {
    this.mapItemMesh = new THREE.Group();
    this.mapItemMesh.position.set(3.8, 0.28, -2.5);

    const mapTex = createMapSheetTexture();
    this.texturesToDispose.push(mapTex);
    const rolledMap = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.04, 0.35),
      new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.4, metalness: 0.1 })
    );
    this.mapItemMesh.add(rolledMap);

    this.mapBeaconLight = new THREE.PointLight(0x38bdf8, 1.2, 2.5, 1.8);
    this.mapBeaconLight.position.set(0, 0.2, 0);
    this.mapItemMesh.add(this.mapBeaconLight);

    this.scene.add(this.mapItemMesh);
  }

  // --- ROOM 2: MULTI-DOOR MAZE & BIG BOARD (Z: -6 to -18) ---

  private buildRoom2(): void {
    this.room2Group = new THREE.Group();

    const floorTex = createConcreteFloorTexture();
    const wallTex = createConcreteWallTexture();
    this.texturesToDispose.push(floorTex, wallTex);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8, metalness: 0.25 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -12);
    this.room2Group.add(floor);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.9, metalness: 0.3 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.6, -12);
    this.room2Group.add(ceiling);

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.75, metalness: 0.3 });

    // East and West Walls (Z: -6 to -18)
    const wallE2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 12), wallMat);
    wallE2.position.set(6, 1.8, -12);
    this.room2Group.add(wallE2);

    const wallW2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 12), wallMat);
    wallW2.position.set(-6, 1.8, -12);
    this.room2Group.add(wallW2);

    // North Wall with 4 Door openings
    const wallN2 = new THREE.Mesh(new THREE.BoxGeometry(12, 0.8, 0.4), wallMat);
    wallN2.position.set(0, 3.2, -18);
    this.room2Group.add(wallN2);

    // Pillar dividers between the 4 doors
    [-6, -3.0, 0, 3.0, 6].forEach((px) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.8, 0.4), wallMat);
      pillar.position.set(px, 1.4, -18);
      this.room2Group.add(pillar);
    });

    // 1. THE BIG BOARD IN THE CENTER OF ROOM 2 (X = 0, Z = -12.0)
    this.buildBigBoard();

    // 2. THE 4 DOORS: A, B, C, D (along Z = -17.85)
    this.buildRoom2Doors();

    this.scene.add(this.room2Group);
  }

  private buildBigBoard(): void {
    this.bigBoardGroup = new THREE.Group();
    this.bigBoardGroup.position.set(0, 0, -12.0);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.25 });

    // Twin support pillars
    [-1.6, 1.6].forEach((px) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.12), frameMat);
      pillar.position.set(px, 1.2, 0);
      this.bigBoardGroup.add(pillar);

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.4), frameMat);
      base.position.set(px, 0.04, 0);
      this.bigBoardGroup.add(base);
    });

    // Main Board Frame
    const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.9, 0.1), frameMat);
    boardFrame.position.set(0, 1.7, 0);
    this.bigBoardGroup.add(boardFrame);

    // Board Surface (South Face - facing player as they enter)
    const boardTex = createBigBoardTexture();
    this.texturesToDispose.push(boardTex);
    const boardMat = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.35, metalness: 0.1 });

    const southFace = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), boardMat);
    southFace.position.set(0, 1.7, 0.06);
    this.bigBoardGroup.add(southFace);

    // Board Surface (North Face)
    const northFace = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), boardMat);
    northFace.position.set(0, 1.7, -0.06);
    northFace.rotation.y = Math.PI;
    this.bigBoardGroup.add(northFace);

    // Overhead illuminated LED bar on board
    const lampBar = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.08, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x38bdf8, emissiveIntensity: 0.8 })
    );
    lampBar.position.set(0, 2.7, 0.2);
    this.bigBoardGroup.add(lampBar);

    const boardSpot = new THREE.PointLight(0x38bdf8, 2.2, 5.0, 1.8);
    boardSpot.position.set(0, 2.6, 0.6);
    this.bigBoardGroup.add(boardSpot);

    this.room2Group.add(this.bigBoardGroup);
  }

  private buildRoom2Doors(): void {
    const doorTex = createDoorTexture();
    this.texturesToDispose.push(doorTex);

    const doorSpecs: { letter: DoorLetter; x: number; colorHex: number; label: string }[] = [
      { letter: 'A', x: -4.5, colorHex: 0x38bdf8, label: 'DOOR A' },
      { letter: 'B', x: -1.5, colorHex: 0x22c55e, label: 'DOOR B' },
      { letter: 'C', x: 1.5, colorHex: 0xf59e0b, label: 'DOOR C' },
      { letter: 'D', x: 4.5, colorHex: 0xef4444, label: 'DOOR D' },
    ];

    doorSpecs.forEach((spec) => {
      const g = new THREE.Group();
      g.position.set(spec.x, 0, -17.85);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.9, roughness: 0.25 });
      const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.2), frameMat);
      frameL.position.set(-1.1, 1.4, 0);
      g.add(frameL);

      const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.2), frameMat);
      frameR.position.set(1.1, 1.4, 0);
      g.add(frameR);

      const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, metalness: 0.75, roughness: 0.35 });
      const panel = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.7, 0.12), doorMat);
      panel.position.set(0, 1.35, 0);
      g.add(panel);

      // Colored Sign Banner above door
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 256;
      signCanvas.height = 64;
      const sCtx = signCanvas.getContext('2d')!;
      sCtx.fillStyle = '#080d16';
      sCtx.fillRect(0, 0, 256, 64);
      sCtx.fillStyle = `#${spec.colorHex.toString(16).padStart(6, '0')}`;
      sCtx.font = 'bold 36px monospace';
      sCtx.textAlign = 'center';
      sCtx.fillText(spec.label, 128, 45);

      const signTex = new THREE.CanvasTexture(signCanvas);
      signTex.colorSpace = THREE.SRGBColorSpace;
      this.texturesToDispose.push(signTex);

      const signMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.4),
        new THREE.MeshBasicMaterial({ map: signTex })
      );
      signMesh.position.set(0, 2.95, 0.12);
      g.add(signMesh);

      // Status LED
      const ledMat = new THREE.MeshStandardMaterial({
        color: spec.colorHex,
        emissive: spec.colorHex,
        emissiveIntensity: 1.6,
        roughness: 0.1,
      });
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), ledMat);
      led.position.set(1.15, 1.5, 0.1);
      g.add(led);

      this.room2Group.add(g);

      this.doorsRoom2[spec.letter] = {
        group: g,
        panel,
        led,
        opened: false,
        progress: 0,
      };
    });
  }

  // --- ROOM 3: THE DEBUG ROOM (Z: -18 to -30) ---

  private buildRoom3(): void {
    this.room3Group = new THREE.Group();

    const floorTex = createConcreteFloorTexture();
    const wallTex = createConcreteWallTexture();
    this.texturesToDispose.push(floorTex, wallTex);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8, metalness: 0.25 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -24);
    this.room3Group.add(floor);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.9, metalness: 0.3 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.6, -24);
    this.room3Group.add(ceiling);

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.75, metalness: 0.3 });

    const wallE3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 12), wallMat);
    wallE3.position.set(6, 1.8, -24);
    this.room3Group.add(wallE3);

    const wallW3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 12), wallMat);
    wallW3.position.set(-6, 1.8, -24);
    this.room3Group.add(wallW3);

    // North Wall with door to Room 4
    const wallN3_1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.6, 0.4), wallMat);
    wallN3_1.position.set(-3.75, 1.8, -30);
    this.room3Group.add(wallN3_1);

    const wallN3_2 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.6, 0.4), wallMat);
    wallN3_2.position.set(3.75, 1.8, -30);
    this.room3Group.add(wallN3_2);

    const wallN3_Top = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.8, 0.4), wallMat);
    wallN3_Top.position.set(0, 3.2, -30);
    this.room3Group.add(wallN3_Top);

    // Server Racks with Blinking LEDs
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x12171f, metalness: 0.9, roughness: 0.25 });
    const rackPositions = [
      [-4.8, 1.5, -21],
      [-4.8, 1.5, -24],
      [-4.8, 1.5, -27],
      [4.8, 1.5, -21],
      [4.8, 1.5, -24],
      [4.8, 1.5, -27],
    ];

    const ledGeom = new THREE.BoxGeometry(0.04, 0.04, 0.02);
    const ledColors = [0x22c55e, 0x38bdf8, 0xf59e0b, 0xef4444];

    rackPositions.forEach(([rx, ry, rz]) => {
      const rackGroup = new THREE.Group();
      rackGroup.position.set(rx, ry, rz);

      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.0, 1.0), rackMat);
      rackGroup.add(tower);

      for (let row = -1.1; row <= 1.1; row += 0.25) {
        for (let col = -0.35; col <= 0.35; col += 0.18) {
          const cHex = ledColors[Math.floor(Math.random() * ledColors.length)];
          const ledMat = new THREE.MeshStandardMaterial({
            color: cHex,
            emissive: cHex,
            emissiveIntensity: 1.5,
            roughness: 0.2,
          });
          const led = new THREE.Mesh(ledGeom, ledMat);
          const faceX = rx > 0 ? -0.52 : 0.52;
          led.position.set(faceX, row, col);
          rackGroup.add(led);

          this.serverLeds.push({
            mesh: led,
            color: new THREE.Color(cHex),
            blinkRate: 1.5 + Math.random() * 5.0,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
      this.room3Group.add(rackGroup);
    });

    // Central Debug Terminal Desk
    this.buildTerminalDesk();

    // Door 3 (Exit from Room 3 to Room 4 at Z = -29.85)
    this.buildDoor3();

    this.scene.add(this.room3Group);
  }

  private buildTerminalDesk(): void {
    this.terminalDeskGroup = new THREE.Group();
    this.terminalDeskGroup.position.set(0, 0, -24.5);

    const consolePedestal = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.95, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x141a24, metalness: 0.85, roughness: 0.25 })
    );
    consolePedestal.position.set(0, 0.475, 0);
    this.terminalDeskGroup.add(consolePedestal);

    const screenFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.0, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x090c12, metalness: 0.9, roughness: 0.2 })
    );
    screenFrame.position.set(0, 1.45, -0.2);
    screenFrame.rotation.x = -0.15;
    this.terminalDeskGroup.add(screenFrame);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#05110a';
    ctx.fillRect(0, 0, 512, 320);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('// SECTOR 03: SERVER DEBUG ROOM', 20, 45);
    ctx.font = '16px monospace';
    ctx.fillText('> DEBUG TERMINAL: ONLINE', 20, 90);
    ctx.fillText('> FIX BUG TO GENERATE DATA FRAGMENT', 20, 130);
    ctx.fillStyle = '#86efac';
    ctx.fillText('[ PRESS [E] TO LAUNCH DEBUG SUITE ]', 20, 200);

    const screenTex = new THREE.CanvasTexture(canvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    this.texturesToDispose.push(screenTex);

    this.terminalScreenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.48, 0.88),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    this.terminalScreenMesh.position.set(0, 1.45, -0.13);
    this.terminalScreenMesh.rotation.x = -0.15;
    this.terminalDeskGroup.add(this.terminalScreenMesh);

    this.terminalLight = new THREE.PointLight(0x22c55e, 2.2, 5.0, 1.8);
    this.terminalLight.position.set(0, 1.8, 0.4);
    this.terminalDeskGroup.add(this.terminalLight);

    this.room3Group.add(this.terminalDeskGroup);
  }

  private buildDoor3(): void {
    this.door3Group = new THREE.Group();
    this.door3Group.position.set(0, 0, -29.85);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0d1017, metalness: 0.85, roughness: 0.3 });
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 0.3), frameMat);
    frameL.position.set(-1.3, 1.4, 0);
    this.door3Group.add(frameL);

    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 0.3), frameMat);
    frameR.position.set(1.3, 1.4, 0);
    this.door3Group.add(frameR);

    const doorTex = createDoorTexture();
    this.texturesToDispose.push(doorTex);
    const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, metalness: 0.8, roughness: 0.3 });
    this.door3Panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.7, 0.15), doorMat);
    this.door3Panel.position.set(0, 1.35, 0);
    this.door3Group.add(this.door3Panel);

    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    this.door3StatusLed = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), ledMat);
    this.door3StatusLed.position.set(1.4, 1.55, 0.15);
    this.door3Group.add(this.door3StatusLed);

    this.room3Group.add(this.door3Group);
  }

  // --- ROOM 4: HIGH-TECH CHAMBER (3 CHESTS, MATH WALL, HIDDEN DOOR) ---

  private buildRoom4(): void {
    this.room4Group = new THREE.Group();

    const floorTex = createConcreteFloorTexture();
    const wallTex = createConcreteWallTexture();
    this.texturesToDispose.push(floorTex, wallTex);

    // Floor (Z: -30 to -41.5)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8.4, 11.5),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7, metalness: 0.35 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -35.75);
    this.room4Group.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(8.4, 11.5),
      new THREE.MeshStandardMaterial({ color: 0x070a0f, roughness: 0.9, metalness: 0.4 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.6, -35.75);
    this.room4Group.add(ceiling);

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.75, metalness: 0.3 });

    // East and West Walls
    const wallE4 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 11.5), wallMat);
    wallE4.position.set(4.2, 1.8, -35.75);
    this.room4Group.add(wallE4);

    const wallW4 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.6, 11.5), wallMat);
    wallW4.position.set(-4.2, 1.8, -35.75);
    this.room4Group.add(wallW4);

    // Neon floor strips along chamber borders
    const stripMatCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 9.0), stripMatCyan);
    stripL.position.set(-3.9, 0.01, -34.5);
    this.room4Group.add(stripL);

    const stripR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 9.0), stripMatCyan);
    stripR.position.set(3.9, 0.01, -34.5);
    this.room4Group.add(stripR);

    // Overhead spotlights for the 3 pedestals
    const spotTruth = new THREE.PointLight(0x38bdf8, 2.4, 6.0, 1.8);
    spotTruth.position.set(-2.4, 3.2, -34.5);
    this.room4Group.add(spotTruth);

    const spotLies = new THREE.PointLight(0xf59e0b, 2.4, 6.0, 1.8);
    spotLies.position.set(0, 3.2, -34.5);
    this.room4Group.add(spotLies);

    const spotUnknown = new THREE.PointLight(0xc084fc, 2.4, 6.0, 1.8);
    spotUnknown.position.set(2.4, 3.2, -34.5);
    this.room4Group.add(spotUnknown);

    // Build the 3 Pedestaled Chests
    this.buildChest('TRUTH', -2.4, 0x38bdf8);
    this.buildChest('LIES', 0.0, 0xf59e0b);
    this.buildChest('UNKNOWN', 2.4, 0xc084fc);

    // Build the North Monolithic Wall, Math Symbols, and Hidden Door Portal
    this.buildNorthMonolithAndHiddenDoor();

    this.scene.add(this.room4Group);
  }

  // Helper to build a high-fidelity 3D Chest on Pedestal
  private buildChest(type: 'TRUTH' | 'LIES' | 'UNKNOWN', posX: number, colorHex: number): void {
    const chestGroup = new THREE.Group();
    chestGroup.position.set(posX, 0, -34.5);

    // 1. Pedestal Base
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      metalness: 0.85,
      roughness: 0.35,
    });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.7, 16), pedMat);
    pedestal.position.set(0, 0.35, 0);
    chestGroup.add(pedestal);

    // Decorative metal ring on pedestal
    const ringMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.03, 8, 24), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.68, 0);
    chestGroup.add(ring);

    // Glowing Nameplate on front of pedestal
    const plateCanvas = document.createElement('canvas');
    plateCanvas.width = 256;
    plateCanvas.height = 80;
    const pCtx = plateCanvas.getContext('2d')!;
    pCtx.fillStyle = '#06090f';
    pCtx.fillRect(0, 0, 256, 80);
    pCtx.lineWidth = 4;
    pCtx.strokeStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    pCtx.strokeRect(4, 4, 248, 72);
    pCtx.fillStyle = `#${colorHex.toString(16).padStart(6, '0')}`;
    pCtx.font = 'bold 32px monospace';
    pCtx.textAlign = 'center';
    pCtx.fillText(type, 128, 48);

    const plateTex = new THREE.CanvasTexture(plateCanvas);
    plateTex.colorSpace = THREE.SRGBColorSpace;
    this.texturesToDispose.push(plateTex);

    const plateMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.2),
      new THREE.MeshBasicMaterial({ map: plateTex })
    );
    plateMesh.position.set(0, 0.45, 0.66);
    chestGroup.add(plateMesh);

    // 2. Chest Lower Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x161e2e,
      metalness: 0.8,
      roughness: 0.3,
    });
    const chestBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.5), bodyMat);
    chestBody.position.set(0, 0.875, 0);
    chestGroup.add(chestBody);

    // Corner metal brackets
    const bracketMat = new THREE.MeshStandardMaterial({
      color: 0x243247,
      metalness: 0.95,
      roughness: 0.2,
    });
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.52), bracketMat);
    b1.position.set(0, 0.72, 0);
    chestGroup.add(b1);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.52), bracketMat);
    b2.position.set(0, 1.03, 0);
    chestGroup.add(b2);

    // Front digital key clasp
    const claspMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.06), claspMat);
    clasp.position.set(0, 0.95, 0.26);
    chestGroup.add(clasp);

    // 3. Chest Hinged Lid (Pivots from back edge)
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 1.05, -0.25); // back top edge

    const lidMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.7, 16, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x1b2436, metalness: 0.85, roughness: 0.3 })
    );
    lidMesh.rotation.z = Math.PI / 2;
    lidMesh.position.set(0, 0, 0.25);
    lidPivot.add(lidMesh);

    const lidRim = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.52), bracketMat);
    lidRim.position.set(0, 0, 0.25);
    lidPivot.add(lidRim);

    chestGroup.add(lidPivot);
    this.chestLids[type] = lidPivot;

    // 4. Internal Glowing Relic / Light (revealed when lid opens)
    const relicMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 2.0,
      metalness: 0.2,
      roughness: 0.1,
    });
    const relic = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), relicMat);
    relic.position.set(0, 0.95, 0);
    chestGroup.add(relic);

    const chestLight = new THREE.PointLight(colorHex, 0.2, 3.0, 2.0);
    chestLight.position.set(0, 1.1, 0);
    chestGroup.add(chestLight);
    this.chestGlowLights[type] = chestLight;

    this.room4Group.add(chestGroup);
  }

  // Builds the North Wall with the 3 Mathematical Symbols and Seamless Sliding Door
  private buildNorthMonolithAndHiddenDoor(): void {
    const wallTex = createConcreteWallTexture();
    this.texturesToDispose.push(wallTex);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.75, metalness: 0.3 });

    // Fixed Left and Right Wall segments
    const leftFixed = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.6, 0.4), wallMat);
    leftFixed.position.set(-2.85, 1.8, -38.85);
    this.room4Group.add(leftFixed);

    const rightFixed = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.6, 0.4), wallMat);
    rightFixed.position.set(2.85, 1.8, -38.85);
    this.room4Group.add(rightFixed);

    // Lintel beam across top above door
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.9, 0.4), wallMat);
    lintel.position.set(0, 3.15, -38.85);
    this.room4Group.add(lintel);

    // SEAMLESS HIDDEN SLIDING DOORS (Initially flush at X = 0, exactly matching the wall texture!)
    // To ensure NO visible door initially, they look completely like a solid wall
    const doorMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.75,
      metalness: 0.3,
    });

    this.wallHiddenDoorLeft = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.7, 0.36), doorMat);
    this.wallHiddenDoorLeft.position.set(-0.75, 1.35, -38.85);
    this.room4Group.add(this.wallHiddenDoorLeft);

    this.wallHiddenDoorRight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.7, 0.36), doorMat);
    this.wallHiddenDoorRight.position.set(0.75, 1.35, -38.85);
    this.room4Group.add(this.wallHiddenDoorRight);

    // Glowing seam light strip that ignites on breach
    const seamStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 2.7, 0.38),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    seamStrip.position.set(0, 1.35, -38.84);
    seamStrip.visible = false; // wall must look completely solid until breach
    this.seamStripMesh = seamStrip;
    this.room4Group.add(seamStrip);

    // THE MATHEMATICAL SYMBOLS DISPLAY PANEL (Above the sliding wall center)
    this.symbolWallCanvas = document.createElement('canvas');
    this.symbolWallCanvas.width = 640;
    this.symbolWallCanvas.height = 240;
    this.renderSymbolWallCanvas(false);

    this.symbolWallTex = new THREE.CanvasTexture(this.symbolWallCanvas);
    this.symbolWallTex.colorSpace = THREE.SRGBColorSpace;
    this.texturesToDispose.push(this.symbolWallTex);

    this.symbolWallMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.9),
      new THREE.MeshBasicMaterial({ map: this.symbolWallTex })
    );
    this.symbolWallMesh.position.set(0, 2.4, -38.62);
    this.room4Group.add(this.symbolWallMesh);

    // Glyph Console Pedestal at bottom of the wall
    const consoleStand = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0f1522, metalness: 0.85, roughness: 0.3 })
    );
    consoleStand.position.set(0, 0.45, -38.2);
    this.room4Group.add(consoleStand);

    const consoleTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.1, 0.35),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      })
    );
    consoleTop.position.set(0, 0.92, -38.2);
    this.room4Group.add(consoleTop);

    // BEHIND THE WALL: FINAL ROUND PORTAL CHAMBER (Z: -39.0 to -41.5)
    this.buildPortalChamber();
  }

  // Renders the 3 Mathematical symbols onto the wall canvas
  private renderSymbolWallCanvas(s3Ignited: boolean): void {
    const ctx = this.symbolWallCanvas.getContext('2d')!;
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, 640, 240);

    // Border Frame
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(6, 6, 628, 228);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CRYPTIC ARCHWAY FORMULA // HARMONIC MATRIX', 320, 32);

    const wallP = this.chestPuzzle.wall;
    const symbols = [wallP.visibleSymbols[0], wallP.visibleSymbols[1], wallP.hiddenSymbol];
    const boxX = [130, 320, 510];

    // Draw 3 Symbol boxes
    for (let i = 0; i < 3; i++) {
      const x = boxX[i];
      const isS3 = i === 2;
      const isLit = !isS3 || s3Ignited;

      ctx.fillStyle = isLit ? '#0d1d2e' : '#0a0d14';
      ctx.fillRect(x - 55, 55, 110, 105);

      ctx.lineWidth = 3;
      ctx.strokeStyle = isLit ? (isS3 ? '#22c55e' : '#38bdf8') : '#334155';
      ctx.strokeRect(x - 55, 55, 110, 105);

      if (isLit) {
        ctx.fillStyle = isS3 ? '#4ade80' : '#38bdf8';
        ctx.font = 'bold 58px monospace';
        ctx.fillText(symbols[i], x, 130);
      } else {
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('[ ? ]', x, 105);
        ctx.font = '12px monospace';
        ctx.fillText('UNLIT', x, 135);
      }
    }

    // Subtitle formula word status
    ctx.fillStyle = s3Ignited ? '#4ade80' : '#38bdf8';
    ctx.font = 'bold 18px monospace';
    const wordStatus = s3Ignited
      ? `FORMULA COMPLETE: [ ${wallP.completedWord} ] -> PORTAL OPEN`
      : `INPUT GLYPH: [ ${wallP.incompleteWord} ]`;
    ctx.fillText(wordStatus, 320, 205);
  }

  // Builds the glowing vortex portal behind the hidden sliding door
  private buildPortalChamber(): void {
    // Portal archway ring
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x22c55e,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const archRing = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 12, 32), archMat);
    archRing.position.set(0, 1.4, -40.0);
    this.room4Group.add(archRing);

    // Glowing swirling vortex disk
    const vortexCanvas = document.createElement('canvas');
    vortexCanvas.width = 256;
    vortexCanvas.height = 256;
    const vCtx = vortexCanvas.getContext('2d')!;
    const grad = vCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#38bdf8');
    grad.addColorStop(0.7, '#22c55e');
    grad.addColorStop(1, '#052e16');
    vCtx.fillStyle = grad;
    vCtx.fillRect(0, 0, 256, 256);

    const vortexTex = new THREE.CanvasTexture(vortexCanvas);
    this.texturesToDispose.push(vortexTex);

    this.portalVortexMesh = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 32),
      new THREE.MeshBasicMaterial({
        map: vortexTex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      })
    );
    this.portalVortexMesh.position.set(0, 1.4, -40.2);
    this.room4Group.add(this.portalVortexMesh);

    this.portalVortexLight = new THREE.PointLight(0x22c55e, 0.1, 8.0, 1.8);
    this.portalVortexLight.position.set(0, 1.4, -39.8);
    this.room4Group.add(this.portalVortexLight);
  }

  // --- Controls & Collision ---

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', this.onCanvasClick);
    canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  private onPointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
  };

  private onCanvasClick = (): void => {
    soundManager.init();
    soundManager.startAmbientHum();

    if (!this.isPointerLocked) {
      try {
        this.renderer.domElement.requestPointerLock?.();
      } catch {}
    }

    if (this.currentActiveTarget && this.onInteractCallback) {
      this.onInteractCallback(this.currentActiveTarget.id);
    }
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    const sensitivity = 0.0022;

    if (this.isPointerLocked) {
      this.cameraYaw -= e.movementX * sensitivity;
      this.cameraPitch -= e.movementY * sensitivity;
      this.cameraPitch = Math.max(-Math.PI * 0.44, Math.min(Math.PI * 0.44, this.cameraPitch));
    } else if (this.isDragging) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.cameraYaw -= dx * sensitivity;
      this.cameraPitch -= dy * sensitivity;
      this.cameraPitch = Math.max(-Math.PI * 0.44, Math.min(Math.PI * 0.44, this.cameraPitch));
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    // Don't treat typing in modal text fields as game controls
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = true;
        break;
      case 'KeyE':
        if (this.currentActiveTarget && this.onInteractCallback) {
          this.onInteractCallback(this.currentActiveTarget.id);
        }
        break;
      case 'KeyF':
        this.toggleFlashlight();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = false;
        break;
    }
  };

  private onResize = (): void => {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public toggleFlashlight(): boolean {
    this.flashlight.visible = !this.flashlight.visible;
    soundManager.playFlashlightClick();
    return this.flashlight.visible;
  }

  public teleportTo(x: number, z: number): void {
    this.playerPos.set(x, 1.65, z);
    this.camera.position.copy(this.playerPos);
    this.cameraPitch = 0;
    this.cameraYaw = 0; // face forward (North)
  }

  // --- Collision Across Room 1, 2, 3, and 4 ---

  private checkCollision(newX: number, newZ: number): boolean {
    const r = 0.42;

    // ZONE 1: ROOM 1 (Z: -6 to 6)
    if (newZ >= -6.0) {
      if (newX - r < -5.5 || newX + r > 5.5) return true;
      if (newZ + r > 5.5) return true;

      if ((!this.door1Opened || this.door1Slammed) && newZ - r < -5.4 && Math.abs(newX) < 1.3) {
        return true;
      }
      if (newX + r > 2.6 && newX - r < 5.2 && newZ + r > -3.3 && newZ - r < -1.7) return true;
      if (newX + r > -4.6 && newX - r < -3.0 && newZ + r > 0.3 && newZ - r < 1.7) return true;
      if (newX + r > -5.2 && newX - r < -2.7 && newZ + r > 2.9 && newZ - r < 4.8) return true;
      if (newX + r > 1.0 && newX - r < 5.8 && newZ + r > 1.0 && newZ - r < 1.4) return true;

      return false;
    }

    // ZONE 2: ROOM 2 (Z: -6.0 to -18.0)
    if (newZ < -6.0 && newZ >= -18.0) {
      if (this.door1Slammed && newZ + r > -6.4) return true;
      if (newX - r < -5.5 || newX + r > 5.5) return true;

      // Obstacle: Big Board in Center: X: [-2.0, 2.0], Z: [-12.6, -11.4]
      if (newX + r > -2.0 && newX - r < 2.0 && newZ + r > -12.6 && newZ - r < -11.4) return true;

      // North wall barrier at Z = -18.0 unless walking through an opened door
      if (newZ - r < -17.6) {
        // Check if passing through an opened door: A (-4.5), B (-1.5), C (1.5), D (4.5)
        let passingOpened = false;
        for (const key of ['A', 'B', 'C', 'D'] as DoorLetter[]) {
          const d = this.doorsRoom2[key];
          if (d && d.opened) {
            const dx = key === 'A' ? -4.5 : key === 'B' ? -1.5 : key === 'C' ? 1.5 : 4.5;
            if (Math.abs(newX - dx) < 1.0) {
              passingOpened = true;
              break;
            }
          }
        }
        if (!passingOpened) return true;
      }

      return false;
    }

    // ZONE 3: ROOM 3 (Z: -18.0 to -30.0)
    if (newZ < -18.0 && newZ >= -30.0) {
      if (newX - r < -5.5 || newX + r > 5.5) return true;

      // Door 3 barrier at Z = -30.0
      if (!this.door3Opened && newZ - r < -29.6 && Math.abs(newX) < 1.3) return true;

      // Server racks along walls
      if (newX - r < -4.1 && newZ + r > -28.0 && newZ - r < -20.0) return true;
      if (newX + r > 4.1 && newZ + r > -28.0 && newZ - r < -20.0) return true;

      // Central terminal desk: X: [-1.2, 1.2], Z: [-25.4, -23.6]
      if (newX + r > -1.2 && newX - r < 1.2 && newZ + r > -25.4 && newZ - r < -23.6) return true;

      return false;
    }

    // ZONE 4: ROOM 4 (Z: -30.0 to -41.5)
    if (newZ < -30.0) {
      // East and west walls at +/- 3.9
      if (newX - r < -3.8 || newX + r > 3.8) return true;

      // 3 Chest Pedestals: TRUTH (-2.4, -34.5), LIES (0, -34.5), UNKNOWN (2.4, -34.5)
      const chestPos = [
        { x: -2.4, z: -34.5 },
        { x: 0.0, z: -34.5 },
        { x: 2.4, z: -34.5 },
      ];
      for (const cp of chestPos) {
        const dx = newX - cp.x;
        const dz = newZ - cp.z;
        if (dx * dx + dz * dz < (0.65 + r) * (0.65 + r)) return true;
      }

      // North Wall barrier at Z = -38.6
      if (!this.hiddenDoorOpened) {
        if (newZ - r < -38.6) return true;
      } else {
        // Doorway is open between X in [-1.25, 1.25]
        if (Math.abs(newX) > 1.2 && newZ - r < -38.6) return true;
        // Back of portal chamber at Z = -40.8
        if (newZ - r < -40.6) return true;
      }

      return false;
    }

    return false;
  }

  private updateMovement(delta: number): void {
    const speed = this.isSprinting ? 5.8 : 3.5;
    const moveX = (this.moveRight ? 1 : 0) - (this.moveLeft ? 1 : 0);
    const moveZ = (this.moveBackward ? 1 : 0) - (this.moveForward ? 1 : 0);

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      const moveDir = new THREE.Vector3();
      moveDir.addScaledVector(forward, -moveZ);
      moveDir.addScaledVector(right, moveX);
      moveDir.normalize();

      const stepDist = speed * delta;
      const targetX = this.playerPos.x + moveDir.x * stepDist;
      const targetZ = this.playerPos.z + moveDir.z * stepDist;

      if (!this.checkCollision(targetX, this.playerPos.z)) {
        this.playerPos.x = targetX;
      }
      if (!this.checkCollision(this.playerPos.x, targetZ)) {
        this.playerPos.z = targetZ;
      }

      this.footstepTimer += delta * (this.isSprinting ? 2.5 : 1.8);
      if (this.footstepTimer > 1.0) {
        soundManager.playFootstep(this.isSprinting);
        this.footstepTimer = 0;
      }

      if (this.onPlayerMoveCallback) {
        this.onPlayerMoveCallback({
          x: this.playerPos.x,
          z: this.playerPos.z,
          rotationY: this.cameraYaw,
        });
      }
    }

    this.checkRoomTransitions();

    this.camera.position.x = this.playerPos.x;
    this.camera.position.z = this.playerPos.z;
    const headBob = isMoving ? Math.sin(this.clock.getElapsedTime() * (this.isSprinting ? 14 : 9)) * 0.03 : 0;
    this.camera.position.y = this.playerPos.y + headBob;

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.cameraYaw;
    this.camera.rotation.x = this.cameraPitch;
    if (this.wallShakeTime > 0) {
      const k = Math.min(1, this.wallShakeTime) * 0.012;
      this.camera.rotation.z = (Math.random() - 0.5) * k * 2;
      this.camera.position.y += (Math.random() - 0.5) * k * 2;
      this.wallShakeTime -= 0.016;
    } else {
      this.camera.rotation.z = 0;
    }

    this.flashlight.position.copy(this.camera.position);
    const forwardVec = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    this.flashlightTarget.position.copy(this.camera.position).add(forwardVec.multiplyScalar(5));
  }

  private checkRoomTransitions(): void {
    // Room 1 -> Room 2
    if (this.currentRoom === 1 && this.playerPos.z < -7.0) {
      this.currentRoom = 2;
      this.door1Slammed = true;
      this.door1Opened = false;
      this.door1Panel.position.x = 0;
      soundManager.playDoorSlam();
      soundManager.playAlertBeep();

      if (this.onRoomChangeCallback) {
        this.onRoomChangeCallback(2);
      }
    }

    // Room 2 -> Room 3 (Debug Room)
    if (this.currentRoom === 2 && this.playerPos.z < -18.8) {
      this.currentRoom = 3;
      if (this.onRoomChangeCallback) {
        this.onRoomChangeCallback(3);
      }
    }

    // Room 3 -> Room 4 (Chamber with 3 Chests)
    if (this.currentRoom === 3 && this.playerPos.z < -30.8) {
      this.currentRoom = 4;
      if (this.onRoomChangeCallback) {
        this.onRoomChangeCallback(4);
      }
    }

    // Room 4 -> Step through Hidden Door Portal
    if (this.currentRoom === 4 && this.hiddenDoorOpened && this.playerPos.z < -39.1) {
      if (this.onPortalEnterCallback) {
        this.onPortalEnterCallback();
      }
    }
  }

  // --- Interaction Detection ---

  private checkInteractables(): void {
    const targets: { id: InteractTarget['id']; pos: THREE.Vector3; prompt: string; maxDist: number }[] = [];

    // ROOM 1
    if (this.currentRoom === 1) {
      if (!this.hasMap) {
        targets.push({
          id: 'MAP',
          pos: new THREE.Vector3(3.8, 0.4, -2.5),
          prompt: '[E] Pick up Tactical Map',
          maxDist: 2.4,
        });
      }
      if (!this.boxOpened) {
        targets.push({
          id: 'BOX',
          pos: new THREE.Vector3(-3.8, 1.0, 1.0),
          prompt: '[E] Examine Keypad Box (Hurdle for Master Key)',
          maxDist: 2.2,
        });
      }
      targets.push({
        id: 'PAINTING',
        pos: new THREE.Vector3(-5.7, 1.9, -1.0),
        prompt: '[E] Inspect Wall Painting Hint',
        maxDist: 3.2,
      });
      if (!this.door1Opened) {
        targets.push({
          id: 'DOOR',
          pos: new THREE.Vector3(0, 1.4, -5.7),
          prompt: '[E] Solve Series to Open Door 1',
          maxDist: 2.6,
        });
      }
    }

    // ROOM 2: BIG BOARD & 4 DOORS
    if (this.currentRoom === 2) {
      targets.push({
        id: 'MAP_BOARD',
        pos: new THREE.Vector3(0, 1.7, -12.0),
        prompt: '[E] Inspect Navigation Board',
        maxDist: 3.5,
      });

      // 4 Doors
      targets.push({
        id: 'DOOR_A',
        pos: new THREE.Vector3(-4.5, 1.4, -17.7),
        prompt: '[E] Open Door A',
        maxDist: 2.5,
      });
      targets.push({
        id: 'DOOR_B',
        pos: new THREE.Vector3(-1.5, 1.4, -17.7),
        prompt: '[E] Open Door B',
        maxDist: 2.5,
      });
      targets.push({
        id: 'DOOR_C',
        pos: new THREE.Vector3(1.5, 1.4, -17.7),
        prompt: '[E] Open Door C',
        maxDist: 2.5,
      });
      targets.push({
        id: 'DOOR_D',
        pos: new THREE.Vector3(4.5, 1.4, -17.7),
        prompt: '[E] Open Door D',
        maxDist: 2.5,
      });
    }

    // ROOM 3: DEBUG TERMINAL & EXIT DOOR
    if (this.currentRoom === 3) {
      targets.push({
        id: 'TERMINAL',
        pos: new THREE.Vector3(0, 1.2, -24.2),
        prompt: '[E] Use Terminal (Debug Subroutine)',
        maxDist: 2.6,
      });

      if (!this.door3Opened) {
        targets.push({
          id: 'DOOR',
          pos: new THREE.Vector3(0, 1.4, -29.7),
          prompt: '[E] Locked Airlock (Requires Terminal Data Fragment)',
          maxDist: 2.5,
        });
      }
    }

    // ROOM 4: THREE CHESTS & CRYPTIC MATHEMATICAL WALL
    if (this.currentRoom === 4) {
      targets.push({
        id: 'CHEST_TRUTH',
        pos: new THREE.Vector3(-2.4, 1.0, -34.1),
        prompt: '[E] Open Chest: TRUTH (4-Bit Binary)',
        maxDist: 2.5,
      });
      targets.push({
        id: 'CHEST_LIES',
        pos: new THREE.Vector3(0, 1.0, -34.1),
        prompt: '[E] Open Chest: LIES (Single Digit Key)',
        maxDist: 2.5,
      });
      targets.push({
        id: 'CHEST_UNKNOWN',
        pos: new THREE.Vector3(2.4, 1.0, -34.1),
        prompt: '[E] Open Chest: UNKNOWN (Alphabet Cipher)',
        maxDist: 2.5,
      });
      targets.push({
        id: 'SYMBOL_WALL',
        pos: new THREE.Vector3(0, 1.3, -38.2),
        prompt: '[E] Transcribe Glyph to Cryptic Wall',
        maxDist: 3.2,
      });
    }

    let closest: InteractTarget | null = null;
    let minDistance = Infinity;

    for (const t of targets) {
      const dist = this.playerPos.distanceTo(t.pos);
      if (dist < t.maxDist && dist < minDistance) {
        const toTarget = t.pos.clone().sub(this.playerPos).normalize();
        const lookDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
        const dot = lookDir.dot(new THREE.Vector3(toTarget.x, 0, toTarget.z).normalize());

        if (dot > 0.22) {
          minDistance = dist;
          closest = {
            id: t.id,
            prompt: t.prompt,
            distance: dist,
          };
        }
      }
    }

    if (
      (!this.currentActiveTarget && closest) ||
      (this.currentActiveTarget && !closest) ||
      (this.currentActiveTarget && closest && this.currentActiveTarget.id !== closest.id)
    ) {
      this.currentActiveTarget = closest;
      if (this.onTargetChangeCallback) {
        this.onTargetChangeCallback(closest);
      }
    }
  }

  // --- Mutators ---

  public pickupMap(): void {
    this.hasMap = true;
    soundManager.playPickup();
    if (this.mapItemMesh) {
      this.scene.remove(this.mapItemMesh);
    }
  }

  public unlockBox(): void {
    this.boxOpened = true;
    soundManager.playKeypadSuccess();
    if (this.keyItemInsideBox) {
      this.keyItemInsideBox.visible = true;
    }
  }

  public pickupKey(): void {
    this.hasKey = true;
    soundManager.playPickup();
    if (this.keyItemInsideBox) {
      this.keyItemInsideBox.visible = false;
    }
  }

  public unlockDoor1(): void {
    this.door1Opened = true;
    soundManager.playDoorUnlock();
    if (this.door1StatusLed) {
      (this.door1StatusLed.material as THREE.MeshStandardMaterial).color.setHex(0x22c55e);
      (this.door1StatusLed.material as THREE.MeshStandardMaterial).emissive.setHex(0x22c55e);
    }
  }

  public openRoom2Door(letter: DoorLetter): void {
    const d = this.doorsRoom2[letter];
    if (d) {
      d.opened = true;
      soundManager.playDoorUnlock();
      (d.led.material as THREE.MeshStandardMaterial).color.setHex(0x22c55e);
      (d.led.material as THREE.MeshStandardMaterial).emissive.setHex(0x22c55e);
    }
  }

  public unlockDoor3(): void {
    this.door3Opened = true;
    soundManager.playDoorUnlock();
    if (this.door3StatusLed) {
      (this.door3StatusLed.material as THREE.MeshStandardMaterial).color.setHex(0x22c55e);
      (this.door3StatusLed.material as THREE.MeshStandardMaterial).emissive.setHex(0x22c55e);
    }
  }

  public unlockSafe(): void {
    this.safeOpened = true;
    if (this.safeStatusLed) {
      (this.safeStatusLed.material as THREE.MeshStandardMaterial).color.setHex(0x22c55e);
      (this.safeStatusLed.material as THREE.MeshStandardMaterial).emissive.setHex(0x22c55e);
    }
  }

  public unlockChest(type: 'TRUTH' | 'LIES' | 'UNKNOWN'): void {
    this.chestStatus[type].opened = true;
    if (this.chestGlowLights[type]) {
      this.chestGlowLights[type].intensity = 2.5;
    }
  }

  public revealHiddenDoor(): void {
    this.hiddenDoorOpened = true;
    this.wallShakeTime = 1.4;
    if (this.seamStripMesh) this.seamStripMesh.visible = true;
    this.renderSymbolWallCanvas(true);
    if (this.symbolWallTex) {
      this.symbolWallTex.needsUpdate = true;
    }
    if (this.portalVortexLight) {
      this.portalVortexLight.intensity = 3.5;
    }
  }

  // --- Animation Loop ---

  private startLoop(): void {
    const tick = () => {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const time = this.clock.getElapsedTime();

      this.updateMovement(delta);
      this.checkInteractables();

      if (this.sirenPivot) {
        this.sirenPivot.rotation.y += delta * 2.5;
      }
      if (this.redSirenLight) {
        this.redSirenLight.intensity = 2.0 + Math.sin(time * 5) * 0.8;
      }

      if (this.ceilingFlickerLight) {
        this.ceilingFlickerLight.intensity = Math.random() < 0.04 ? 0.3 + Math.random() * 0.9 : 1.2;
      }

      if (this.mapBeaconLight && !this.hasMap) {
        this.mapBeaconLight.intensity = 0.8 + Math.sin(time * 4) * 0.4;
      }

      if (this.boxOpened && this.boxLid && this.boxLid.rotation.x > -Math.PI * 0.55) {
        this.boxLid.rotation.x -= delta * 2.5;
      }

      // Door 1 slide
      if (this.door1Opened && !this.door1Slammed && this.door1Progress < 1.0) {
        this.door1Progress = Math.min(1.0, this.door1Progress + delta * 0.8);
        this.door1Panel.position.x = this.door1Progress * 2.0;
      }

      // Room 2 Doors slide
      for (const key of ['A', 'B', 'C', 'D'] as DoorLetter[]) {
        const d = this.doorsRoom2[key];
        if (d && d.opened && d.progress < 1.0) {
          d.progress = Math.min(1.0, d.progress + delta * 0.8);
          d.panel.position.x = d.progress * 1.8;
        }
      }

      // Door 3 slide (Debug Room into Vault)
      if (this.door3Opened && this.door3Progress < 1.0) {
        this.door3Progress = Math.min(1.0, this.door3Progress + delta * 0.8);
        this.door3Panel.position.x = this.door3Progress * 2.0;
      }

      // Room 4 Safe door swing
      if (this.safeOpened && this.safeProgress < 1.0) {
        this.safeProgress = Math.min(1.0, this.safeProgress + delta * 1.5);
        this.safeDoor.rotation.y = this.safeProgress * Math.PI * 0.65;
      }

      // Room 4 Chest Lids opening animation
      for (const t of ['TRUTH', 'LIES', 'UNKNOWN'] as const) {
        const c = this.chestStatus[t];
        if (c.opened && c.progress < 1.0) {
          c.progress = Math.min(1.0, c.progress + delta * 2.0);
          if (this.chestLids[t]) {
            this.chestLids[t].rotation.x = -c.progress * Math.PI * 0.55;
          }
        }
      }

      // Room 4 Monolithic Seamless Hidden Door parting
      if (this.hiddenDoorOpened && this.hiddenDoorProgress < 1.0) {
        this.hiddenDoorProgress = Math.min(1.0, this.hiddenDoorProgress + delta * 0.65);
        if (this.wallHiddenDoorLeft) {
          this.wallHiddenDoorLeft.position.x = -0.75 - this.hiddenDoorProgress * 1.6;
        }
        if (this.wallHiddenDoorRight) {
          this.wallHiddenDoorRight.position.x = 0.75 + this.hiddenDoorProgress * 1.6;
        }
      }

      // Portal vortex rotation
      if (this.portalVortexMesh) {
        this.portalVortexMesh.rotation.z += delta * 1.8;
      }

      // Room 3 Server LED blinking
      for (let i = 0; i < this.serverLeds.length; i++) {
        const item = this.serverLeds[i];
        const val = Math.sin(time * item.blinkRate + item.phase);
        const mat = item.mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = val > 0.1 ? 1.8 : 0.05;
      }

      if (this.terminalLight) {
        this.terminalLight.intensity = 1.8 + Math.sin(time * 2.5) * 0.4;
      }

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public dispose(): void {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);

    this.texturesToDispose.forEach((t) => t.dispose());
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
