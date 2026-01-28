import { Injectable } from '@angular/core';
import { Platform } from '../models/platform';
import { Hazard } from '../models/hazard';
import { PATTERN_LIBRARY } from '../models/pattern-library';
import { LevelPattern, PlatformDef, SocketDef, SocketType, Difficulty, HazardType} from '../models/pattern';
import { Item, ItemType } from '../models/item';

@Injectable({
  providedIn: 'root'
})
export class Level {


  // === State ===
  private platforms: Platform[] = [];
  private hazards: Hazard[] = [];
  private items: Item[] = [];

  // == Rendering der Assets == 
  private imgStandard: HTMLImageElement = new Image();
  private imgLogo: HTMLImageElement = new Image();
  public assetsLoaded: boolean = false;
  private readonly TEXTURE_SLICE_WIDTH = 24; 

  // Debug + Settings 
  public readonly DEBUG_SHOW_PLAYER_SIZE = false; 
  public debugPlayerBoxes: {x: number, y: number, w: number, h: number}[] = [];

  private nextId: number = 1; 
  private totalFrames: number = 0; 
  private lastPatternEndX: number = 200; 
  private isFirstPattern: boolean = true; 

  private patterns: LevelPattern[] = PATTERN_LIBRARY; 
  
  // === GOLDEN FIX: INTEGER SPEED ===
  // Wir setzen den Speed auf exakt 120px/s.
  // Das sind genau 2.0 Pixel pro Frame bei 60FPS.
  private readonly SCROLL_SPEED_PX_PER_SEC: number = 120; 
  private readonly FRAME_RATE: number = 60; 
  private gameSpeed: number = this.SCROLL_SPEED_PX_PER_SEC / this.FRAME_RATE; // = 2.0

  // DIMENSIONS
  public readonly CANVAS_WIDTH: number = 960;
  public readonly CANVAS_HEIGHT: number = 360; 
  
  private platformHeight: number = 15; 
  private floorHeight: number = 10;    
  private readonly HAZARD_SIZE = 15;   

  // GRID (Y-Values for Surfaces)
  private readonly GRID_Y_TOP = 80;   
  private readonly GRID_Y_MID = 170; 
  private readonly GRID_Y_LOW = 260;  
  private readonly GRID_Y_FLOOR = 350; 

  constructor() {}

  // ====================================================================
  // 1. ASSET MANAGEMENT
  // ====================================================================
  
  public initAssets(): Promise<void> {
      const p1 = new Promise((resolve) => {
          this.imgStandard.src = 'assets/images/platform_texture.PNG';
          this.imgStandard.onload = () => resolve(true);
          this.imgStandard.onerror = () => {
              console.warn("LevelService: Fallback für Standard-Textur");
              this.imgStandard.src = this.createFallbackTexture('#E67E22', '#5D4037');
              resolve(true);
          };
      });

      const p2 = new Promise((resolve) => {
          this.imgLogo.src = 'assets/images/platform_texture_ifm.PNG';
          this.imgLogo.onload = () => resolve(true);
          this.imgLogo.onerror = () => {
              console.warn("LevelService: Fallback für Logo-Textur");
              this.imgLogo.src = this.createFallbackTexture('#FFB74D', '#5D4037');
              resolve(true);
          };
      });

      return Promise.all([p1, p2]).then(() => {
          this.assetsLoaded = true;
      });
  }

  private createFallbackTexture(bodyColor: string, borderColor: string): string {
      const c = document.createElement('canvas');
      c.width = 96; c.height = 15; 
      const x = c.getContext('2d')!;
      x.fillStyle = bodyColor; x.fillRect(1, 1, 94, 13);
      x.fillStyle = borderColor; x.strokeRect(0,0,96,15);
      return c.toDataURL();
  }

  public initLevel(canvasWidth: number, canvasHeight: number): void {
    this.platforms = [];
    this.hazards = [];
    this.items = [];
    this.debugPlayerBoxes = []; 
    this.nextId = 1;
    this.totalFrames = 0;
    this.isFirstPattern = true;
    this.lastPatternEndX = canvasWidth; 
    
    const floorY = this.CANVAS_HEIGHT - this.floorHeight;
    this.createFloorSegment(0, this.CANVAS_WIDTH + 400, floorY);
  }

  public update(
  canvasWidth: number,
  canvasHeight: number,
  timeScale: number = 1
): void {

  this.totalFrames++;

  // 🔥 ZENTRALE ZEIT-SKALIERUNG
const moveStep = this.gameSpeed * timeScale;


  this.platforms.forEach(p => p.x -= moveStep);
  this.hazards.forEach(h => h.x -= moveStep);
  this.items.forEach(i => i.x -= moveStep);

  if (this.DEBUG_SHOW_PLAYER_SIZE) {
    this.debugPlayerBoxes.forEach(b => b.x -= moveStep);
    this.debugPlayerBoxes = this.debugPlayerBoxes.filter(b => b.x > -100);
  }

  this.lastPatternEndX -= moveStep;

  this.platforms = this.platforms.filter(p => p.x + p.width > -100);
  this.hazards = this.hazards.filter(h => h.x + h.width > -100);
  this.items = this.items.filter(i => i.x > -100 && !i.collected);

  this.maintainFloor();
  this.maintainPatterns();
}


  // ====================================================================
  // 3. RENDERING
  // ====================================================================

  public draw(ctx: CanvasRenderingContext2D): void {
      if (!this.assetsLoaded) {
          ctx.fillStyle = 'black';
          this.platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));
          return;
      }
      this.platforms.forEach(p => this.draw3SlicePlatform(ctx, p));
  }

  private draw3SlicePlatform(ctx: CanvasRenderingContext2D, p: Platform): void {
      let img = this.imgStandard;
      if (p.textureType === 'ifm') img = this.imgLogo;

      const sliceW = this.TEXTURE_SLICE_WIDTH; 
      const srcH = img.naturalHeight;          
      const srcTotalW = img.naturalWidth;      

      if (srcTotalW === 0) return; 

      // Runden auf ganze Pixel für Schärfe
      const x = Math.round(p.x);
      const y = Math.floor(p.y);
      const h = p.height;
      
      // 1. Links
      ctx.drawImage(img, 0, 0, sliceW, srcH, x, y, sliceW, h);
      
      // 2. Rechts
      ctx.drawImage(img, srcTotalW - sliceW, 0, sliceW, srcH, x + p.width - sliceW, y, sliceW, h);

      // 3. Mitte
      const centerW = p.width - (sliceW * 2);
      if (centerW > 0) {
          ctx.drawImage(
              img, 
              sliceW, 0, srcTotalW - (sliceW * 2), srcH, 
              x + sliceW, y, centerW, h
          );
      }
  }

  // ====================================================================
  // SPAWNING (Rest bleibt gleich)
  // ====================================================================

  private maintainFloor(): void {
    const floorY = this.CANVAS_HEIGHT - this.floorHeight;
    const rightmostFloor = this.platforms
      .filter(p => p.type === 'floor')
      .reduce((prev, curr) => (curr.x > prev.x ? curr : prev), { x: -Infinity, width: 0 } as Platform);

    if (rightmostFloor.x + rightmostFloor.width < this.CANVAS_WIDTH + 50) {
      const startX = rightmostFloor.x === -Infinity ? 0 : rightmostFloor.x + rightmostFloor.width;
      this.createFloorSegment(startX, 600, floorY);
    }
  }

  private createFloorSegment(x: number, width: number, y: number) {
    this.createPlatform(x, y, width, this.floorHeight, 'floor');
    if (this.DEBUG_SHOW_PLAYER_SIZE) {
        for(let i = 0; i < width; i+=300) { this.createDebugPlayerBox(x + i, y); }
    }
  }

  private maintainPatterns(): void {
    if (this.lastPatternEndX < this.CANVAS_WIDTH + 200) {
      this.spawnNextPattern();
    }
  }

  private spawnNextPattern(): void {
    const floorY = this.CANVAS_HEIGHT - this.floorHeight;
    let template: LevelPattern;
    const secondsPlayed = this.totalFrames / this.FRAME_RATE;

    if (this.isFirstPattern) {
        const startPattern = this.patterns.find(p => p.id === 'p0') || this.patterns[0];
        template = startPattern;
        this.isFirstPattern = false;
    } else {
        template = this.selectWeightedPattern(secondsPlayed);
    }

    let minGap = 60; let maxGap = 120; 
    if (secondsPlayed > 60) { minGap = 80; maxGap = 150; } 
    
    const gapSize = this.isFirstPattern ? 0 : Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
    const startX = this.lastPatternEndX + gapSize;

    const hasLowEntry = template.platforms.some(p => p.xOffset < 100 && (p.route === 'LOW'));
    const needConnector = gapSize > 180 || (!hasLowEntry && !this.isFirstPattern);

    if (needConnector) {
        const connectorX = this.lastPatternEndX + (gapSize / 2) - 40;
        const connectorY = this.GRID_Y_LOW; 
        this.createPlatform(connectorX, connectorY, 80, this.platformHeight, 'platform');
    }

    template.platforms.forEach(def => {
      if (def.probability !== undefined && Math.random() > def.probability) return;

      const actualY = this.snapToGrid(def.route, def.yOffset);
      this.createPlatform(startX + def.xOffset, actualY, def.width, this.platformHeight, 'platform');
      
      if (this.DEBUG_SHOW_PLAYER_SIZE) {
          this.createDebugPlayerBox(startX + def.xOffset + def.width/2 - 20, actualY);
      }
    });

    this.processPatternSockets(template, startX, secondsPlayed);
    this.scanFloorForAmbientHazards(startX, template.totalWidth, floorY, template.platforms, secondsPlayed);
    this.lastPatternEndX = startX + template.totalWidth;
  }

  private processPatternSockets(template: LevelPattern, startX: number, secondsPlayed: number): void {
      if (!template.sockets) return;

      const difficulty = this.getCurrentDifficultyLabel(secondsPlayed);
      
      let minElements = 3;
      if (difficulty === 'MEDIUM') minElements = 4;
      if (difficulty === 'HARD') minElements = 6;

      let spawnCount = 0;
      
      template.sockets.forEach(socket => {
          if (socket.reqDifficulty === 'HARD' && difficulty !== 'HARD') return;
          if (socket.reqDifficulty === 'MEDIUM' && difficulty === 'EASY') return;
          
          const shouldSpawn = (socket.probability !== undefined && Math.random() < socket.probability) || spawnCount < minElements;

          if (shouldSpawn) {
              this.spawnSingleSocket(socket, startX);
              spawnCount++;
          }
      });

      if (spawnCount < minElements) {
          this.createHazard(startX + 400, this.GRID_Y_FLOOR - this.HAZARD_SIZE, 'faultySensor');
      }
  }

  private spawnSingleSocket(socket: SocketDef, startX: number) {
      const spawnX = startX + socket.xOffset;
      const surfaceY = socket.yOffset; 
      let finalY = surfaceY;

      if (socket.type === 'HAZARD') {
          if (socket.subtype === 'cord') {
               finalY = surfaceY + this.platformHeight; 
               const overheadPlatform = this.findPlatformAbove(spawnX, surfaceY);
               if (overheadPlatform) {
                   finalY = overheadPlatform.y + overheadPlatform.height;
               }
          } else {
               finalY = surfaceY - this.HAZARD_SIZE;
          }
          this.createHazard(spawnX, finalY, (socket.subtype as HazardType) || 'faultySensor');

      } else if (socket.type === 'ITEM') {
          const itemType = (socket.subtype as ItemType) || 'sensor-a';
          const { w, h } = this.getItemDimensions(itemType);
          finalY = surfaceY - h - 5; 

          if (!this.isPositionBlockedByPlatform(spawnX, finalY, w, h)) {
              this.createItem(spawnX, finalY, itemType);
          }
      }
  }

  private scanFloorForAmbientHazards(startX: number, width: number, floorY: number, activePlatforms: PlatformDef[], secondsPlayed: number) {
      if (secondsPlayed < 5) return; 

      const scanStep = 150; 
      const floorHazardY = 335; 
      
      for (let currentX = startX + 50; currentX < startX + width - 50; currentX += scanStep) {
          if (Math.random() < 0.7) { 
              if (this.isOverheadClearGrid(currentX, startX, activePlatforms)) {
                  if (!this.isAreaBlockedByHazards(currentX, floorHazardY, this.HAZARD_SIZE, this.HAZARD_SIZE)) {
                      this.createHazard(currentX, floorHazardY, 'faultySensor');
                  }
              }
          }
      }
  }
  
  private findPlatformAbove(x: number, y: number): Platform | undefined {
      const checkY = y - 10; 
      return this.platforms.find(p => 
          x >= p.x && x <= p.x + p.width && 
          p.y + p.height <= checkY 
      );
  }

  private getItemDimensions(type: ItemType): { w: number, h: number } {
      if (type === 'sensor-b') return { w: 25, h: 25 };
      if (type === 'sensor-c') return { w: 30, h: 30 };
      return { w: 20, h: 20 };
  }

  private getCurrentDifficultyLabel(secondsPlayed: number): Difficulty {
      if (secondsPlayed < 45) return 'EASY';
      if (secondsPlayed < 120) return 'MEDIUM';
      return 'HARD';
  }

  private getDifficultyWeights(secondsPlayed: number): {EASY: number, MEDIUM: number, HARD: number} {
    if (secondsPlayed < 30) return { EASY: 60, MEDIUM: 30, HARD: 10 };
    else if (secondsPlayed < 90) return { EASY: 30, MEDIUM: 50, HARD: 20 };
    else return { EASY: 20, MEDIUM: 50, HARD: 30 };
  }

  private selectWeightedPattern(secondsPlayed: number): LevelPattern {
    const weights = this.getDifficultyWeights(secondsPlayed);
    const roll = Math.random() * 100;
    let target: Difficulty;
    if (roll < weights.EASY) target = 'EASY';
    else if (roll < weights.EASY + weights.MEDIUM) target = 'MEDIUM';
    else target = 'HARD';
    const pool = this.patterns.filter(p => p.difficulty === target);
    if (pool.length === 0) return this.patterns[Math.floor(Math.random() * this.patterns.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private snapToGrid(route: string | undefined, originalYOffset: number): number {
      if (route === 'FLOOR' || originalYOffset > 300) return this.GRID_Y_FLOOR;
      if (route === 'TOP') return this.GRID_Y_TOP; 
      if (route === 'MID') return this.GRID_Y_MID; 
      if (route === 'LOW') return this.GRID_Y_LOW; 
      return this.GRID_Y_LOW;
  }

  private isPositionBlockedByPlatform(x: number, y: number, w: number, h: number): boolean {
      const padding = 2; 
      const checkX = x + padding; const checkY = y + padding;
      const checkW = w - (padding * 2); const checkH = h - (padding * 2);
      if (checkW <= 0 || checkH <= 0) return false;
      return this.platforms.some(p => {
          const overlapX = (checkX < p.x + p.width) && (checkX + checkW > p.x);
          const overlapY = (checkY < p.y + p.height) && (checkY + checkH > p.y);
          return overlapX && overlapY;
      });
  }

  private isAreaBlockedByHazards(targetX: number, targetY: number, w: number, h: number): boolean {
    const buffer = 20; 
    return this.hazards.some(existing => {
      const overlapX = (targetX < existing.x + existing.width + buffer) && (targetX + w + buffer > existing.x);
      const overlapY = (targetY < existing.y + existing.height + buffer) && (targetY + h + buffer > existing.y);
      return overlapX && overlapY;
    });
  }

private isAreaBlocked(
  x: number,
  y: number,
  w: number,
  height: number
): boolean {

  // ❌ Plattformen
  if (this.platforms.some(p =>
    x < p.x + p.width &&
    x + w > p.x &&
    y < p.y + p.height &&
    y + height > p.y
  )) return true;

  // ❌ Hazards
  if (this.hazards.some(hz =>
    x < hz.x + hz.width &&
    x + w > hz.x &&
    y < hz.y + hz.height &&
    y + height > hz.y
  )) return true;

  // ❌ Items
  if (this.items.some(i =>
    x < i.x + i.width &&
    x + w > i.x &&
    y < i.y + i.height &&
    y + height > i.y
  )) return true;

  return false;
}


  private isOverheadClearGrid(tX: number, sX: number, aP: PlatformDef[]): boolean {
      const rX = tX - sX;
      for (const p of aP) {
          if (rX >= p.xOffset && rX <= p.xOffset + p.width) {
              if (p.route === 'LOW' || p.route === 'MID') return false; 
          }
      }
      return true;
  }

  private createPlatform(x: number, y: number, width: number, height: number, type: 'floor' | 'platform'): void {
    const isBrand = Math.random() < 0.5;
    const tex: 'standard' | 'ifm' = isBrand ? 'ifm' : 'standard';

    this.platforms.push({ 
        id: this.nextId++, 
        x, y, width, height, 
        color: 'black', 
        type, 
        textureType: tex 
    });
  }
  
  private createHazard(x: number, y: number, type: HazardType): Hazard {
    const color = type === 'cord' ? '#FF3333' : '#CC0000'; 
    const hazard = { id: this.nextId++, x, y, width: this.HAZARD_SIZE, height: this.HAZARD_SIZE, color, type };
    this.hazards.push(hazard);
    return hazard;
  }
private createItem(x: number, y: number, type: ItemType): void {

  let points = 10;
  let color = '#4299E1';
  let w = 20;
  let h = 20;

  if (type === 'sensor-b') {
    points = 50;
    color = '#48BB78';
    w = 25;
    h = 25;
  }

  if (type === 'sensor-c') {
    points = 100;
    color = '#ECC94B';
    w = 30;
    h = 30;
  }

  // ❌ EIN EINZIGER CHECK
  if (this.isAreaBlocked(x, y, w, h)) return;

  // ✅ Item erzeugen
  this.items.push({
    id: this.nextId++,
    x,
    y,
    width: w,
    height: h,
    type,
    points,
    color,
    collected: false
  });
}


  private createDebugPlayerBox(x: number, platformY: number) {
      this.debugPlayerBoxes.push({ x: x, y: platformY - 60, w: 40, h: 60 });
  }
  
  public getPlatforms(): Platform[] { return this.platforms; }
  public getHazards(): Hazard[] { return this.hazards; }
  public getItems(): Item[] { return this.items; }
  public getDebugPlayerBoxes() { return this.debugPlayerBoxes; }
}