export interface Hazard {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string; // Für Anfang "red"
    type: 'cord'  | 'faultySensor'; // Typ des Hazards
}