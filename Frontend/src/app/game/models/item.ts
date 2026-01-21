export type ItemType = 'sensor-a' | 'sensor-b' | 'sensor-c';

export interface Item {
    id: number;           // Eindeutige ID
    x: number;            // X-Position
    y: number;            // Y-Position
    width: number;        // Breite
    height: number;       // Höhe
    type: ItemType;       // Typ des Items
    points: number;       // Punktewert des Items
    color: string;      // Farbe (für Anfang)
    collected: boolean; // Ob das Item bereits eingesammelt wurde
    pulseOffset?: number; // Für Puls-Effekt
}