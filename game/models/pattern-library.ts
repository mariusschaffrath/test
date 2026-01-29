import { LevelPattern } from './pattern';

// ====================================================================
// GRID REFERENZ (Values = Surface Y)
// TOP = 80, MID = 170, LOW = 260
// ====================================================================

export const PATTERN_LIBRARY: LevelPattern[] = [
  
  // P0: TUTORIAL (EASY)
  {
    id: 'p0', difficulty: 'EASY', totalWidth: 800, tags: [], 
    platforms: [
        { xOffset: 0, yOffset: 260, width: 800, route: 'LOW' }
    ],
    sockets: [
        { xOffset: 300, yOffset: 260, type: 'HAZARD', subtype: 'faultySensor', probability: 1.0 },
        { xOffset: 600, yOffset: 260, type: 'HAZARD', subtype: 'faultySensor', probability: 1.0 },
        { xOffset: 450, yOffset: 260, type: 'ITEM', subtype: 'sensor-a', probability: 1.0 },
        { xOffset: 150, yOffset: 260, type: 'ITEM', subtype: 'sensor-a', probability: 0.5 },
        { xOffset: 700, yOffset: 260, type: 'ITEM', subtype: 'sensor-a', probability: 0.5 }
        
    ]
  },

  // P1: THE STAIRS UP
  {
    id: 'p1', difficulty: 'EASY', totalWidth: 800,
    platforms: [
      { xOffset: 0, yOffset: 260, width: 200, route: 'LOW' },
      { xOffset: 250, yOffset: 170, width: 200, route: 'MID' },
      { xOffset: 500, yOffset: 80, width: 200, route: 'TOP' },
      // Filler Mid
      { xOffset: 750, yOffset: 170, width: 100, route: 'MID', probability: 0.5 }
    ],
    sockets: [
        { xOffset: 340, yOffset: 170, type: 'ITEM', subtype: 'sensor-b', probability: 1.0 },
        { xOffset: 590, yOffset: 80, type: 'ITEM', subtype: 'sensor-c', probability: 1.0 },
        { xOffset: 300, yOffset: 350, type: 'HAZARD', subtype: 'faultySensor', probability: 0.8 },
        // Cord an Low Platform (0-200)
        { xOffset: 100, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 }
    ]
  },

  // P2: THE TUNNEL
  {
    id: 'p2', difficulty: 'MEDIUM', totalWidth: 800,
    platforms: [
      { xOffset: 0, yOffset: 260, width: 100, route: 'LOW' },
      { xOffset: 100, yOffset: 170, width: 600, route: 'MID' }, 
      { xOffset: 700, yOffset: 260, width: 100, route: 'LOW' }
    ],
    sockets: [
        // Cords hängen an MID (100-700)
        { xOffset: 250, yOffset: 170, type: 'HAZARD', subtype: 'cord', probability: 0.9 }, 
        { xOffset: 550, yOffset: 170, type: 'HAZARD', subtype: 'cord', probability: 0.9 },
        { xOffset: 400, yOffset: 170, type: 'ITEM', subtype: 'sensor-b', probability: 1.0 },
        { xOffset: 400, yOffset: 350, type: 'HAZARD', subtype: 'faultySensor', probability: 0.7 }
    ]
  },

  // P3: THE MIX 
  {
    id: 'p3', difficulty: 'MEDIUM', totalWidth: 900,
    platforms: [
      { xOffset: 0, yOffset: 260, width: 150, route: 'LOW' },
      { xOffset: 150, yOffset: 170, width: 200, route: 'MID' },
      { xOffset: 350, yOffset: 80, width: 200, route: 'TOP' },
      { xOffset: 550, yOffset: 170, width: 350, route: 'MID' },
      // Filler Low
      { xOffset: 400, yOffset: 260, width: 100, route: 'LOW', probability: 0.5 }
    ],
    sockets: [
        { xOffset: 440, yOffset: 80, type: 'ITEM', subtype: 'sensor-c', probability: 0.8 }, 
        { xOffset: 700, yOffset: 170, type: 'HAZARD', subtype: 'faultySensor', probability: 0.6 },
        { xOffset: 450, yOffset: 80, type: 'HAZARD', subtype: 'cord', probability: 0.5 }, 
        
        // Cord an Low Start (0-150)
        { xOffset: 50, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 }
    ]
  },

  // P4: ISLAND HOP
  {
    id: 'p4', difficulty: 'HARD', totalWidth: 900,
    platforms: [
      { xOffset: 0, yOffset: 260, width: 100, route: 'LOW' },
      { xOffset: 150, yOffset: 170, width: 100, route: 'MID' }, 
      { xOffset: 300, yOffset: 80, width: 100, route: 'TOP' },  
      { xOffset: 450, yOffset: 170, width: 100, route: 'MID' }, 
      { xOffset: 600, yOffset: 260, width: 100, route: 'LOW' },
      { xOffset: 750, yOffset: 260, width: 150, route: 'LOW' },
      // Filler Top
      { xOffset: 550, yOffset: 80, width: 80, route: 'TOP', probability: 0.4 }
    ],
    sockets: [
        { xOffset: 190, yOffset: 170, type: 'ITEM', subtype: 'sensor-b', probability: 1.0 }, 
        { xOffset: 340, yOffset: 80, type: 'ITEM', subtype: 'sensor-c', probability: 1.0 },
        { xOffset: 490, yOffset: 170, type: 'ITEM', subtype: 'sensor-b', probability: 1.0 },
        { xOffset: 225, yOffset: 350, type: 'HAZARD', subtype: 'faultySensor', probability: 1.0 }, 
        { xOffset: 525, yOffset: 350, type: 'HAZARD', subtype: 'faultySensor', probability: 1.0 },
        // Low Cords
        { xOffset: 50, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 },
        { xOffset: 650, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 }
    ]
  },

  // P5: THE WALL
  {
    id: 'p5', difficulty: 'HARD', totalWidth: 800,
    platforms: [
      { xOffset: 0, yOffset: 260, width: 150, route: 'LOW' },
      { xOffset: 150, yOffset: 170, width: 100, route: 'MID' }, 
      { xOffset: 250, yOffset: 80, width: 400, route: 'TOP' },
      { xOffset: 650, yOffset: 170, width: 150, route: 'MID' }
    ],
    sockets: [
        { xOffset: 450, yOffset: 80, type: 'HAZARD', subtype: 'faultySensor', probability: 0.9 }, 
        { xOffset: 350, yOffset: 80, type: 'ITEM', subtype: 'sensor-c', probability: 1.0 },
        { xOffset: 450, yOffset: 350, type: 'HAZARD', subtype: 'faultySensor', probability: 0.9 }, 
        // Cord an Low Start (0-150)
        { xOffset: 75, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 },
        { xOffset: 700, yOffset: 170, type: 'ITEM', subtype: 'sensor-a', probability: 0.7 }
    ]
  },

  // P6: DOUBLE DECKER
  {
    id: 'p6', difficulty: 'HARD', totalWidth: 900,
    platforms: [
      { xOffset: 0, yOffset: 260, width: 100, route: 'LOW' },
      { xOffset: 100, yOffset: 260, width: 700, route: 'LOW' }, 
      { xOffset: 100, yOffset: 80, width: 700, route: 'TOP' },  
      { xOffset: 800, yOffset: 260, width: 100, route: 'LOW' }
    ],
    sockets: [
        // Top Cords (100-800)
        { xOffset: 300, yOffset: 80, type: 'HAZARD', subtype: 'cord', probability: 0.8 }, 
        { xOffset: 600, yOffset: 80, type: 'HAZARD', subtype: 'cord', probability: 0.8 },
        // Low Cords (100-800)
        { xOffset: 250, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 },
        { xOffset: 550, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 },
        
        { xOffset: 450, yOffset: 260, type: 'HAZARD', subtype: 'faultySensor', probability: 0.7 }, 
        { xOffset: 450, yOffset: 80, type: 'ITEM', subtype: 'sensor-c', probability: 0.9 }
    ]
  },

  // P7: ZIG ZAG
  {
    id: 'p7', difficulty: 'MEDIUM', totalWidth: 800,
    platforms: [
      { xOffset: 0, yOffset: 260, width: 200, route: 'LOW' },
      { xOffset: 200, yOffset: 170, width: 400, route: 'MID' },
      { xOffset: 600, yOffset: 260, width: 200, route: 'LOW' },
      // Filler Top
      { xOffset: 350, yOffset: 80, width: 100, route: 'TOP', probability: 0.4 }
    ],
    sockets: [
        { xOffset: 400, yOffset: 170, type: 'HAZARD', subtype: 'faultySensor', probability: 0.6 },
        { xOffset: 400, yOffset: 350, type: 'ITEM', subtype: 'sensor-a', probability: 0.5 }, 
        { xOffset: 250, yOffset: 260, type: 'ITEM', subtype: 'sensor-b', probability: 0.5 },
        // Low Cords
        { xOffset: 100, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 },
        { xOffset: 700, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 }
    ]
  },

  // P8: THE DIP
  {
    id: 'p8', difficulty: 'MEDIUM', totalWidth: 800,
    platforms: [
      { xOffset: 0, yOffset: 260, width: 100, route: 'LOW' },
      { xOffset: 100, yOffset: 170, width: 150, route: 'MID' },
      { xOffset: 250, yOffset: 260, width: 300, route: 'LOW' }, // Dip
      { xOffset: 550, yOffset: 170, width: 150, route: 'MID' },
      { xOffset: 700, yOffset: 260, width: 100, route: 'LOW' }
    ],
    sockets: [
        { xOffset: 400, yOffset: 260, type: 'HAZARD', subtype: 'faultySensor', probability: 0.7 },
        // Low Cords in Dip
        { xOffset: 300, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 },
        { xOffset: 500, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 },
        { xOffset: 165, yOffset: 170, type: 'ITEM', subtype: 'sensor-b', probability: 0.9 },
        { xOffset: 615, yOffset: 170, type: 'ITEM', subtype: 'sensor-b', probability: 0.9 }
    ]
  },

  // P9: THE CLIMAX
  {
    id: 'p9', difficulty: 'HARD', totalWidth: 1000,
    platforms: [
      { xOffset: 0, yOffset: 260, width: 150, route: 'LOW' },
      { xOffset: 150, yOffset: 170, width: 150, route: 'MID' },
      { xOffset: 300, yOffset: 80, width: 400, route: 'TOP' },
      { xOffset: 700, yOffset: 170, width: 150, route: 'MID' },
      { xOffset: 850, yOffset: 260, width: 150, route: 'LOW' },
      // Filler Low
      { xOffset: 400, yOffset: 260, width: 200, route: 'LOW', probability: 0.3 }
    ],
    sockets: [
        { xOffset: 500, yOffset: 80, type: 'HAZARD', subtype: 'faultySensor', probability: 0.7 },
        { xOffset: 350, yOffset: 80, type: 'ITEM', subtype: 'sensor-c', probability: 0.8 },
        { xOffset: 650, yOffset: 80, type: 'ITEM', subtype: 'sensor-c', probability: 0.8 },
        // Mid Cords
        { xOffset: 225, yOffset: 170, type: 'HAZARD', subtype: 'cord', probability: 0.5 },
        { xOffset: 775, yOffset: 170, type: 'HAZARD', subtype: 'cord', probability: 0.5 },
        // Low Cord
        { xOffset: 75, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 }
    ]
  },

  // P10: THE GAP FILLER
  {
    id: 'p10', difficulty: 'EASY', totalWidth: 800,
    platforms: [
      { xOffset: 0, yOffset: 260, width: 250, route: 'LOW' },
      { xOffset: 250, yOffset: 170, width: 300, route: 'MID' },
      { xOffset: 550, yOffset: 260, width: 250, route: 'LOW' },
      // Filler Top
      { xOffset: 350, yOffset: 80, width: 100, route: 'TOP', probability: 0.4 }
    ],
    sockets: [
        { xOffset: 400, yOffset: 170, type: 'ITEM', subtype: 'sensor-a', probability: 1.0 }, 
        { xOffset: 125, yOffset: 260, type: 'HAZARD', subtype: 'faultySensor', probability: 0.6 },
        { xOffset: 675, yOffset: 260, type: 'HAZARD', subtype: 'faultySensor', probability: 0.6 },
        // Low Cords
        { xOffset: 200, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 },
        { xOffset: 600, yOffset: 260, type: 'HAZARD', subtype: 'cord', probability: 0.5 }
    ]
  }
];