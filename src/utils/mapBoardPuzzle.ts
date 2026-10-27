export type DoorLetter = 'A' | 'B' | 'C' | 'D';

export interface DoorConfig {
  letter: DoorLetter;
  label: string;
  colorHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  xPos: number; // 3D position X
}

export const DOOR_CONFIGS: Record<DoorLetter, DoorConfig> = {
  A: {
    letter: 'A',
    label: 'SECTOR ALPHA (DOOR A)',
    colorHex: '#38bdf8',
    bgClass: 'bg-cyan-950/60',
    borderClass: 'border-cyan-500',
    textClass: 'text-cyan-400',
    xPos: -4.5,
  },
  B: {
    letter: 'B',
    label: 'SECTOR BETA (DOOR B)',
    colorHex: '#22c55e',
    bgClass: 'bg-green-950/60',
    borderClass: 'border-green-500',
    textClass: 'text-green-400',
    xPos: -1.5,
  },
  C: {
    letter: 'C',
    label: 'SECTOR GAMMA (DOOR C)',
    colorHex: '#f59e0b',
    bgClass: 'bg-amber-950/60',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-400',
    xPos: 1.5,
  },
  D: {
    letter: 'D',
    label: 'SECTOR DELTA (DOOR D)',
    colorHex: '#ef4444',
    bgClass: 'bg-red-950/60',
    borderClass: 'border-red-500',
    textClass: 'text-red-400',
    xPos: 4.5,
  },
};

export interface MapStation {
  id: string;
  name: string;
  status: 'SAFE' | 'BLOCKED' | 'HAZARD' | 'OFFLINE';
  conduitDetails: string;
  leadsTo: DoorLetter | 'TRAP' | 'LOOP';
  note: string;
}

export interface MultiDoorPuzzleData {
  correctDoor: DoorLetter;
  entryStationName: string;
  stations: MapStation[];
  misleadingClues: { from: string; to: string; trapReason: string }[];
  truePathDescription: string;
  generationTimestamp: number;
}

const TRAP_REASONS = [
  'STRUCTURAL COLLAPSE: Hydraulic valves permanently sealed. Reroutes to void chute.',
  'HIGH VOLTAGE FAULT: Main breaker burned out. Line leads to grounding loop.',
  'FIREWALL LOCKOUT: Cyber-quarantine engaged. Door triggers security reset.',
  'GAS OVERPRESSURE: Toxic ventilation backflow detected. Airlock sealed.',
  'DECOMPRESSION FAILURE: Vacuum seal breached. Pathway loop terminates in dead end.',
];

export function generateMultiDoorPuzzle(): MultiDoorPuzzleData {
  const letters: DoorLetter[] = ['A', 'B', 'C', 'D'];
  const correctDoor = letters[Math.floor(Math.random() * letters.length)];

  // Create 4 interconnected sub-stations corresponding to paths
  const stations: MapStation[] = [
    {
      id: 'sub-01',
      name: 'Sub-Station Alpha (Ventilation Hub)',
      status: correctDoor === 'A' ? 'SAFE' : 'HAZARD',
      conduitDetails: 'Main Duct Line 13-A',
      leadsTo: 'A',
      note:
        correctDoor === 'A'
          ? 'AIRFLOW STABLE: Primary escape conduit fully pressurized and operational.'
          : TRAP_REASONS[0],
    },
    {
      id: 'sub-02',
      name: 'Sub-Station Beta (Power Junction)',
      status: correctDoor === 'B' ? 'SAFE' : 'BLOCKED',
      conduitDetails: 'Auxiliary Power Relay 13-B',
      leadsTo: 'B',
      note:
        correctDoor === 'B'
          ? 'POWER NOMINAL: Voltage regulators online. Direct transit line open.'
          : TRAP_REASONS[1],
    },
    {
      id: 'sub-03',
      name: 'Sub-Station Gamma (Fluid Reservoir)',
      status: correctDoor === 'C' ? 'SAFE' : 'OFFLINE',
      conduitDetails: 'Coolant Drainage Conduit 13-C',
      leadsTo: 'C',
      note:
        correctDoor === 'C'
          ? 'VALVES CLEAR: Drainage bypass active. Unobstructed walkway verified.'
          : TRAP_REASONS[2],
    },
    {
      id: 'sub-04',
      name: 'Sub-Station Delta (Service Tunnel)',
      status: correctDoor === 'D' ? 'SAFE' : 'BLOCKED',
      conduitDetails: 'Maintenance Line 13-D',
      leadsTo: 'D',
      note:
        correctDoor === 'D'
          ? 'ACCESS GRANTED: Maintenance override verified. Emergency ladder intact.'
          : TRAP_REASONS[3],
    },
  ];

  // Misleading connections that interconnect the maps to confuse the player
  const wrongDoors = letters.filter((l) => l !== correctDoor);
  const misleadingClues = [
    {
      from: 'Central Entry Point',
      to: `Sub-Station ${wrongDoors[0]}`,
      trapReason: 'Looks promising, but conduit loops back to high-voltage grounding grid.',
    },
    {
      from: `Sub-Station ${wrongDoors[1]}`,
      to: 'Emergency Chute',
      trapReason: 'Interconnected cross-link appears shorter, but ends in an auto-reset airlock.',
    },
    {
      from: 'Cross-Conduit Bridge',
      to: `Door ${wrongDoors[2]}`,
      trapReason: 'Misleading schematic indicator: Bridge was severed during tower isolation.',
    },
  ];

  return {
    correctDoor,
    entryStationName: 'Sector 02 Main Concourse',
    stations,
    misleadingClues,
    truePathDescription: `Follow the uninterrupted green telemetry link from Central Entry -> Sub-Station ${correctDoor} -> Door ${correctDoor}.`,
    generationTimestamp: Date.now(),
  };
}
