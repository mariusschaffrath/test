export interface Platform {
id: number;       // Eindeutige ID
x: number;        // X-Position
y: number;        // Y-Position
width: number;    // Breite
height: number;   // Höhe
color: string;    // Farbe (oder später Textur-Typ)
type?: 'floor' | 'platform'; // Um Boden von Plattformen zu unterscheiden
textureType: 'standard' | 'ifm';
}

