import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Level } from './services/level';
import { StartScreen } from './start-screen/start-screen';
import { PauseScreen } from './pause-screen/pause-screen';
import { GameoverScreen } from './gameover-screen/gameover-screen';
import { ItemBarComponent } from '../item-bar/item-bar';
import { HighscoreService } from '../services/highscore.service';
import { HelpScreen } from './help-screen/help-screen';
import { Player } from './player';

// === TYPES ===
type SpecialItemType =
  | 'heart'
  | 'slowmotion'
  | 'scoreBonus'
  | 'boost'
  | 'chip'
  | 'toolbox'
  | 'scanner'
  | 'multiplier'
  | 'turbo'; // ⚡ NEU


const SPECIAL_ITEM_IMAGE_MAP: Record<SpecialItemType, string> = {
  heart: 'assets/images/Item-Herz.PNG',
  chip: 'assets/images/Item-Zahnrad.PNG',
  toolbox: 'assets/images/Item-Box.PNG',
  scoreBonus: 'assets/images/Item-Batterie.PNG',
  boost: 'assets/images/Item-Antenne.PNG',
  slowmotion: 'assets/images/Item-Schraube.PNG',
  scanner: 'assets/images/Item-Scanner.PNG',
  multiplier: 'assets/images/Item-Timer.PNG',
  turbo: 'assets/images/Item-Blitz.PNG',
};

// Arcade Mapping
const ARCADE_MAP = {
  AXIS_X: 0,
  AXIS_Y: 1,
  BTN_A: 1,
  BTN_B: 2,
  BTN_X: 0,
  BTN_Y: 3,
  BTN_L: 4,
  BTN_R: 5,
  BTN_SELECT: 8,
  BTN_START: 9,
};

interface SpecialItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: SpecialItemType;
  image: string;
  collected?: boolean;
}

type GameState = 'menu' | 'help' | 'running' | 'paused' | 'gameover';
type GameMode = 'single' | 'twoPlayer';

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  isHeart?: boolean;
  color?: string;
  isBold?: boolean;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, StartScreen, PauseScreen, GameoverScreen, ItemBarComponent, HelpScreen],
  templateUrl: './game.html',
  styleUrls: ['./game.css'],
})
export class GameComponent implements AfterViewInit, OnDestroy {
    // === MISSING PROPERTIES FOR TEMPLATE BINDINGS ===
    menuSelection: number = 0; // Used for menu navigation and activeSelection binding
    nameCharIndex: number = 0; // Used for highlighting active character in name entry
    nameChars: string[] = ['A', 'A', 'A']; // Used for displaying entered name characters
  // === MISSING PROPERTIES FOR MENU HANDLING ===
  menuPollingInterval: any = null;
  isNewHighscore: boolean = false;

  // === MISSING METHODS FOR MENU HANDLING ===
  handleNameEntryInput(): void {
    // TODO: Implement logic for handling name entry input on gameover screen
  }

  handleMenuInput(): void {
    // TODO: Implement logic for handling menu navigation/input
  }

  private itemImages: Partial<Record<SpecialItemType, HTMLImageElement>> = {};



private turboActive = false;
private turboStart = 0;
private readonly TURBO_DURATION = 10000; // 10 Sekunden
private readonly TURBO_FACTOR = 2.0;

// === MULTIPLIER SYSTEM ===
private scoreMultiplierActive = false;
private scoreMultiplierStart = 0;
private readonly MULTIPLIER_DURATION = 10000; // 10 Sekunden
private readonly SCORE_MULTIPLIER = 2;  // Faktor x2


 // =========================================================
// RENDER HELPERS
// =========================================================

private drawItemLikeSensor(
  ctx: CanvasRenderingContext2D,
  item: SpecialItem,
  img: HTMLImageElement,
  glowColor: string
): void {

  // 🔥 GLOW – exakt wie Sensoren
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 22;
  ctx.globalCompositeOperation = 'lighter';

  // 2x zeichnen = echtes Licht
  this.drawImageProp(ctx, img, item.x, item.y, item.width, item.height, 1.0, 'bottom');
  this.drawImageProp(ctx, img, item.x, item.y, item.width, item.height, 1.0, 'bottom');

  ctx.restore();

  // 🔹 Normales Bild darüber
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  this.drawImageProp(ctx, img, item.x, item.y, item.width, item.height, 1.0, 'bottom');
  ctx.restore();
}

  // === HIT FLASH EFFECT ===
private hitFlashStart = 0;
private readonly HIT_FLASH_DURATION = 300; // ms

  // === GLOBAL TIME SCALE ===
  private hasSeenHelp = false;

private readonly BASE_WORLD_TIME_SCALE = 1.3;
private worldTimeScale = this.BASE_WORLD_TIME_SCALE;

  private playerTimeScale = 1;  
  private slowMotionActive = false;
  private slowMotionStart = 0;
  private readonly SLOW_MOTION_DURATION = 6000; 
  private readonly SLOW_MOTION_FACTOR = 0.5;    



  // === HAZARD LANES ===
  private readonly HAZARD_LANES = [60, 140, 220];

  // === ASSETS FOR NEW RENDERING ===
  private sensorAImg = new Image();
  private sensorBImg = new Image();
  private sensorCImg = new Image();
  private hazardGroundImg = new Image(); 
  private hazardCeilingImg = new Image(); 
  private assetLoaded = false;

  floatingTexts: FloatingText[] = [];

  // === CONFIG ===
  public readonly CANVAS_WIDTH: number = 960;  
  public readonly CANVAS_HEIGHT: number = 360; 
  
  // === REFERENCES ===
  @ViewChild('gameLayer') gameLayerRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // === PLAYER SYSTEM ===
  private player!: Player;
  private keys: { [key: string]: boolean } = {}; 

  // === SERVICES & STATE ===
  private level = inject(Level);
  private highscoreService = inject(HighscoreService); 
  
  showDebugHitbox: boolean = false;
  isCollisionActive: boolean = true;
  
  gameState: GameState = 'menu';
  gameMode: GameMode = 'single';        // aktueller Modus
  private pendingMode: GameMode = 'single'; // welcher Modus nach Help starten soll
  private animationFrameId: number | null = null;

  // === PLAYER DATA (HUD) ===
  score = 0;          
  lives = 3;
  maxLives = 3;
  dots = Array(6).fill(0);

  // === DAMAGE & COLLISION ===
  private isInvulnerable = false;      
  private lastHitTime = 0;             
  private readonly INVULNERABILITY_DURATION = 1500; 

  // === SCANNER SHIELD ===
  private scannerActive = false;
  private scannerStartTime = 0;
  private readonly SCANNER_DURATION = 10000;

  // === DATA FOR HTML ===
  highScores: number[] = []; 
  xTimes: string[]  = []; 

  // === SPECIAL ITEMS ===
  specialItems: SpecialItem[] = [];
  private nextSpecialId = 1;
  private specialSpawnTimer: any;
  private readonly SPECIAL_ITEM_SIZE = 30;

  // Visuals
  private chartBgOffset = 0;
  private readonly CHART_BG_WIDTH = 790;
  private chartBgImage: HTMLImageElement | null = null;
  public xAxisOffset = 0;
  private readonly X_AXIS_SCROLL_STEP = 2.0;

  // Audio
  isMusicOn = false;
  private bgAudio: HTMLAudioElement | null = null;
  private itemSound!: HTMLAudioElement;
  private hitSound!: HTMLAudioElement;
  
  private lastItemSoundTime = 0;
  private lastHitSoundTime = 0;
  private readonly ITEM_SOUND_COOLDOWN = 150; 
  private readonly HIT_SOUND_COOLDOWN  = 300; 

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    const times: string[] = [];
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0');
      times.push(`${hour}:00`);
      times.push(`${hour}:30`);
    }
    this.xTimes = [...times, ...times];
    
    // Initialize Sounds
    this.itemSound = new Audio('/assets/images/item-collect.wav');
    this.itemSound.volume = 0.6;
    this.hitSound = new Audio('/assets/images/hit.wav');
    this.hitSound.volume = 0.7;
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.gameLayerRef) {
      const canvas = this.gameLayerRef.nativeElement;
      this.ctx = canvas.getContext('2d')!;
      this.ctx.imageSmoothingEnabled = false;
    }



    // Preload new assets
    this.preloadImages();
    Object.entries(SPECIAL_ITEM_IMAGE_MAP).forEach(([type, src]) => {
      const img = new Image();
      img.src = src;
      this.itemImages[type as SpecialItemType] = img;
    });
    
    // Load Level Assets
    try {
        await this.level.initAssets();
        console.log("Level Assets loaded.");
    } catch (e) {
      console.warn('Assets fallback.');
    }

    this.level.initLevel(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // PLAYER INIT
    this.player = new Player(50, this.CANVAS_HEIGHT - 60, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Load Highscores
    this.loadHighscores();

    if (this.ctx) this.render();

    this.ngZone.runOutsideAngular(() => {
      this.menuPollingInterval = setInterval(() => {
        if (this.gameState === 'gameover' && this.isNewHighscore) {
          this.handleNameEntryInput();
        } else if (this.gameState !== 'running') {
          this.handleMenuInput();
        }
      }, 50);
    });
  }

  ngOnDestroy(): void {
    this.stopGameLoop();
    this.stopMusic();
    this.stopSpecialItemSpawning();
    if (this.menuPollingInterval) clearInterval(this.menuPollingInterval);
  }

  // =========================================================
  // INPUT HANDLING
  // =========================================================
  private preloadImages() {
    const assets = [
      { img: this.sensorAImg, src: '/assets/images/sensor_a.png' }, 
      { img: this.sensorBImg, src: '/assets/images/sensor_b.png' },
      { img: this.sensorCImg, src: '/assets/images/sensor_c.png' },
      { img: this.hazardGroundImg, src: '/assets/images/hazard_boden.png' },
      { img: this.hazardCeilingImg, src: '/assets/images/hazard_decke.png' },
      
    ];
    let loadedCount = 0;
    assets.forEach(asset => {
        asset.img.onload = () => { loadedCount++; this.checkLoadStatus(loadedCount, assets.length); };
        asset.img.onerror = () => { loadedCount++; this.checkLoadStatus(loadedCount, assets.length); };
        asset.img.src = asset.src;
    });
  }

  private checkLoadStatus(count: number, total: number) {
      if (count === total) {
          this.assetLoaded = true;
          if (this.ctx && this.gameState !== 'running') this.render();
      }
  }

  // =========================================================
  // GETTER
  // =========================================================
  get items() { return this.specialItems; }
  get showGameScene(): boolean { return this.gameState === 'running' || this.gameState === 'paused'; }
  trackByFn(index: number, item: SpecialItem): number { return item.id; }
  get formattedScore(): string { return this.score.toString().padStart(4, '0'); }
  getLivesArray(): number[] { return Array(Math.max(0, this.lives)).fill(0); }
  get isTwoPlayer(): boolean { return this.gameMode === 'twoPlayer'; }


  // =========================================================
  // GAME LOOP
  // =========================================================
private startGameLoop = (): void => {

  // SPECIAL ITEMS MIT DER WELT MITBEWEGEN
const moveStep = 2.0 * this.worldTimeScale; // exakt wie im Level

this.specialItems.forEach(item => {
  item.x -= moveStep;
});

  if (this.gameState !== 'running') return;

 
// === SLOW MOTION TIMER ===
if (this.slowMotionActive) {
  if (Date.now() - this.slowMotionStart > this.SLOW_MOTION_DURATION) {
    this.slowMotionActive = false;
  }
}

// === TURBO TIMER ===
if (this.turboActive) {
  if (Date.now() - this.turboStart > this.TURBO_DURATION) {
    this.turboActive = false;
  }
}

// === MULTIPLIER TIMER ===
if (this.scoreMultiplierActive) {
  if (Date.now() - this.scoreMultiplierStart > this.MULTIPLIER_DURATION) {
    this.scoreMultiplierActive = false;
  }
}

if (this.turboActive) {
  this.worldTimeScale = this.TURBO_FACTOR;
} else if (this.slowMotionActive) {
  this.worldTimeScale = this.SLOW_MOTION_FACTOR;
} else {
  this.worldTimeScale = this.BASE_WORLD_TIME_SCALE;
}

// 🔒 Spieler IMMER normal
this.playerTimeScale = 1;


  // INPUT (KEYBOARD + GAMEPAD)
  this.handleInput();

  // PLAYER
  this.player.setPlatforms(this.level.getPlatforms());
  this.player.update(this.playerTimeScale);

  // SCANNER SHIELD TIMER
  if (this.scannerActive) {
    if (Date.now() - this.scannerStartTime > this.SCANNER_DURATION) {
      this.scannerActive = false;
    }
  }

  // INVULNERABILITY RESET
  if (this.isInvulnerable) {
    if (Date.now() - this.lastHitTime > this.INVULNERABILITY_DURATION) {
      this.isInvulnerable = false;
    }
  }

 // LEVEL
this.level.update(
  this.CANVAS_WIDTH,
  this.CANVAS_HEIGHT,
  this.worldTimeScale
);



  this.updateSpecialItems();
  this.updateFloatingTexts();

  // COLLISIONS
  this.checkSpecialItemCollisions();
  this.checkHazardCollisions();
  this.checkItemCollisions();

  // RENDER
  this.render();

  this.cdr.detectChanges();
  this.animationFrameId = requestAnimationFrame(this.startGameLoop);
};


  // =========================================================
  // HELPER METHODS (Die vorher fehlten!)
  // =========================================================
  private handleInput(): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0]; 

    let joystickLeft = false;
    let joystickRight = false;
    let jumpButton = false;

    if (gp) {
        if (gp.axes[0] < -0.5) joystickLeft = true;
        if (gp.axes[0] > 0.5) joystickRight = true;
        for (let i = 0; i < 16; i++) { 
            if (gp.buttons[i] && gp.buttons[i].pressed) {
                jumpButton = true;
                break;
            }
        }
    }

    // Combine Keyboard and Gamepad
    const keyLeft = this.keys['ArrowLeft'] || this.keys['a'] || joystickLeft;
    const keyRight = this.keys['ArrowRight'] || this.keys['d'] || joystickRight;
    const keyJump = this.keys[' '] || this.keys['ArrowUp'] || this.keys['w'] || 
                    this.keys['Control'] || this.keys['Alt'] || 
                    this.keys['Enter'] || this.keys['z'] || this.keys['x'] || jumpButton;

    if (keyLeft) {
      this.player.moveLeft();
    } else if (keyRight) {
      this.player.moveRight();
    } else {
      this.player.stopMoving();
    }

    if (keyJump) {
        this.player.jump();
    }
  }

  // =========================================================
  // MAIN GAME LOOP & RENDER
  // =========================================================
private render(): void {
  if (!this.ctx) return;

  this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

  // 1. HAZARDS (GLOWING)
  const hazards = this.level.getHazards();
  for (const h of hazards) { 
    this.drawHazardImage(this.ctx, h); 
  }

  // 2. LEVEL PLATFORMS
  this.level.draw(this.ctx);

  // 3. LEVEL ITEMS (SENSORS)
  const sensors = this.level.getItems();
  sensors.forEach(item => {
    if (item.collected) return; 
    this.drawTechSensor(this.ctx, item);
  });

 // === SPECIAL ITEMS (wie Sensoren, aber korrekt) ===
this.specialItems.forEach(item => {
  if (item.collected) return;

  const img = this.itemImages[item.type];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  let glow = '#FFA500'; // Default
  if (item.type === 'turbo') glow = '#FFD700';
  if (item.type === 'scanner') glow = '#00FFFF';
  if (item.type === 'multiplier') glow = '#FFFFFF';
  if (item.type === 'heart') glow = '#FF4444';

  this.drawItemLikeSensor(this.ctx, item, img, glow);
});


  // 4. PLAYER
  if (this.player) {
    this.player.draw(this.ctx);
  }

  // 🔴 5. HIT FLASH (GENAU HIER!)
  this.renderHitFlash();

  // 6. DEBUG
  if (this.showDebugHitbox) {
    this.drawDebugInfo();
  }

  // 7. FLOATING TEXTS
  this.drawFloatingTexts(this.ctx);
}

private renderHitFlash(): void {
  const elapsed = Date.now() - this.hitFlashStart;
  if (elapsed > this.HIT_FLASH_DURATION) return;

  const t = elapsed / this.HIT_FLASH_DURATION;
  const alpha = Math.sin(t * Math.PI); // echtes Pulsieren

  this.ctx.save();
  this.ctx.globalCompositeOperation = 'source-over';
  this.ctx.fillStyle = `rgba(255, 0, 0, ${0.4 * alpha})`;
  this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
  this.ctx.restore();
}



  private drawHazardImage(ctx: CanvasRenderingContext2D, h: any) {
      if (!this.assetLoaded) return;
      let img: HTMLImageElement;
      const overlap = 8; 
      let drawY = h.y;
      
      if (h.type === 'cord') { 
          img = this.hazardCeilingImg; 
          drawY = h.y - overlap; 
      } else { 
          img = this.hazardGroundImg; 
          drawY = h.y + overlap; 
      }

      if (img && img.complete && img.naturalHeight !== 0) {
          ctx.save(); 
          ctx.shadowColor = '#FF0000'; 
          ctx.shadowBlur = 30; 
          ctx.globalCompositeOperation = 'lighter'; 
          for(let i = 0; i < 3; i++) {
              this.drawImageProp(ctx, img, h.x, drawY, h.width, h.height, 5.5, h.type === 'cord' ? 'top' : 'bottom');
          }
          ctx.restore(); 
      } else {
           ctx.fillStyle = h.color;
           ctx.fillRect(h.x, h.y, h.width, h.height);
      }
  }

  private drawTechSensor(ctx: CanvasRenderingContext2D, item: any) {
    if (this.assetLoaded) {
        let img = null;
        if (item.type === 'sensor-a') img = this.sensorAImg;
        if (item.type === 'sensor-b') img = this.sensorBImg;
        if (item.type === 'sensor-c') img = this.sensorCImg;
        
        if (img && img.complete && img.naturalHeight !== 0) {
            ctx.save();
            ctx.shadowColor = item.color || '#FFFFFF'; 
            ctx.shadowBlur = 20; 
            ctx.globalCompositeOperation = 'lighter'; 
            this.drawImageProp(ctx, img, item.x, item.y, item.width, item.height, 2.0, 'bottom');
            this.drawImageProp(ctx, img, item.x, item.y, item.width, item.height, 2.0, 'bottom');
            ctx.restore();
            
            ctx.save();
            ctx.shadowColor = 'transparent'; 
            ctx.globalCompositeOperation = 'source-over'; 
            this.drawImageProp(ctx, img, item.x, item.y, item.width, item.height, 2.0, 'bottom');
            ctx.restore();
            return;
        }
    }
    // Fallback
    const centerX = item.x + item.width / 2; 
    const centerY = item.y + item.height / 2;
    ctx.save(); 
    ctx.fillStyle = item.color || '#00FFFF';
    ctx.beginPath(); 
    ctx.arc(centerX, centerY, item.width / 2, 0, Math.PI * 2); 
    ctx.fill(); 
    ctx.restore();
  }

  private drawImageProp(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, scale: number, align: string) {
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const targetRatio = w / h;
      let baseDrawW, baseDrawH;
      
      if (imgRatio > targetRatio) { 
          baseDrawW = w; 
          baseDrawH = w / imgRatio; 
      } else { 
          baseDrawH = h; 
          baseDrawW = h * imgRatio; 
      }
      
      const finalW = baseDrawW * scale; 
      const finalH = baseDrawH * scale;
      const oX = (w - finalW) / 2; 
      let oY = 0;
      
      if (align === 'top') oY = 0; 
      else if (align === 'bottom') oY = h - finalH; 
      else oY = (h - finalH) / 2;
      
      ctx.drawImage(img, Math.floor(x + oX), Math.floor(y + oY), Math.floor(finalW), Math.floor(finalH));
  }

  // 👇 HIER IST DIE FEHLENDE METHODE (wieder eingefügt)
  private drawFloatingTexts(ctx: CanvasRenderingContext2D) {
    ctx.save();
    this.floatingTexts.forEach(t => {
      ctx.globalAlpha = Math.max(0, t.life / 60); 
      ctx.fillStyle = t.color || '#FFA500';
      ctx.font = t.isBold ? 'bold 24px Arial' : 'bold 16px Arial'; 
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.restore();
  }

  // =========================================================
  // LOGIC & COLLISIONS
  // =========================================================
  
  private checkItemCollisions(): void {
    this.level.getItems().forEach((item) => {
      if (!item.collected && this.checkRectCollision(this.player, item)) {
        item.collected = true;
        this.playItemSound();
        
        let pointsToAdd = 10;
        if (item.type === 'sensor-b') pointsToAdd = 25;
        if (item.type === 'sensor-c') pointsToAdd = 50;
        
        this.addScore(pointsToAdd);
        this.spawnFloatingText(item.x, item.y, `+${pointsToAdd}`, '#00FFFF', false);
      }
    });
  }

  private checkSpecialItemCollisions(): void {
    this.specialItems = this.specialItems.filter((item) => {
      if (item.collected) return true;
      if (this.checkRectCollision(this.player, item)) {
        item.collected = true;
        this.applySpecialItem(item);
        this.playItemSound();
        return false;
      }
      return true;
    });
  }

  private checkHazardCollisions(): void {
    if (!this.isCollisionActive) return;
    if (this.isInvulnerable) return;
    if (this.scannerActive) return; 

    const hazards = this.level.getHazards();
    for (const h of hazards) {
      if (this.checkRectCollision(this.player, h, 3)) {
        this.applyDamage();
        break;
      }
    }
  }

  private checkRectCollision(a: any, b: any, padding: number = 0): boolean {
    return (
      a.x < b.x + b.width - padding &&
      a.x + a.width > b.x + padding &&
      a.y < b.y + b.height - padding &&
      a.y + a.height > b.y + padding
    );
  }

 private applySpecialItem(item: SpecialItem): void {
  switch (item.type) {

    // ❤️ HEART
    case 'heart':
      if (this.lives < this.maxLives) {
        this.lives++;
        this.spawnFloatingText(item.x, item.y, '❤', '#FF0000', true);
      } else {
        this.spawnFloatingText(item.x, item.y, 'MAX', '#FF0000', false);
      }
      break;

    // 🔩 SCHRAUBE → SCORE
    case 'slowmotion':
      this.addScore(50);
      this.spawnFloatingText(item.x, item.y, '+50', '#FFA500', true);
      break;

    // ⚙️ CHIP
    case 'chip':
      this.addScore(100);
      this.spawnFloatingText(item.x, item.y, '+100');
      break;

    // 🔋 BATTERIE
    case 'scoreBonus':
      this.addScore(150);
      this.spawnFloatingText(item.x, item.y, '+150');
      break;

    // 📦 TOOLBOX - +1 Leben & Verdoppelt zukünftige Punkte für 10 Sekunden
    case 'toolbox':
      if (this.lives < this.maxLives) {
        this.lives++;
      }
      this.scoreMultiplierActive = true;
      this.scoreMultiplierStart = Date.now();
      this.spawnFloatingText(item.x, item.y, '❤ +X2', '#FFD700', true);
      break;

    // 📡 BOOST - Verdoppelt zukünftige Punkte für 10 Sekunden
    case 'boost':
      this.scoreMultiplierActive = true;
      this.scoreMultiplierStart = Date.now();
      this.spawnFloatingText(item.x, item.y, 'X2 BONUS', '#00FF00', true);
      break;

    // 🛡️ SCANNER
    case 'scanner':
      this.scannerActive = true;
      this.scannerStartTime = Date.now();
      this.spawnFloatingText(item.x, item.y, 'SHIELD', '#00FFFF', true);
      break;

    // ⏱️ TIMER → SLOW MOTION (HIER IST ES RICHTIG)
    case 'multiplier':
      this.slowMotionActive = true;
      this.slowMotionStart = Date.now();
      this.spawnFloatingText(item.x, item.y, 'SLOW ⏱', '#FFFFFF', true);
      break;


      // ⚡ TURBO
case 'turbo':
  this.turboActive = true;
  this.turboStart = Date.now();
  this.slowMotionActive = false; // Sicherheit
  this.spawnFloatingText(item.x, item.y, 'TURBO ⚡', '#FFD700', true);
  break;

  }

  // End of applySpecialItem

  private spawnFloatingText(x: number, y: number, text: string, color: string = '#FFA500', isBold: boolean = false): void {
    this.floatingTexts.push({
      x,
      y,
      text,
      life: 60,
      color,
      isBold
    });
  }

  private updateFloatingTexts(): void {
    this.floatingTexts.forEach((t) => {
      t.y -= 1;
      t.life--;
    });
    this.floatingTexts = this.floatingTexts.filter((t) => t.life > 0);
  }

  private addScore(points: number): void {
    // Prüfe ob Multiplier aktiv ist
    if (this.scoreMultiplierActive) {
      if (Date.now() - this.scoreMultiplierStart > this.MULTIPLIER_DURATION) {
        this.scoreMultiplierActive = false;
      }
    }
    
    // Multipliziere die hinzukommenden Punkte, falls aktiv
    const multipliedPoints = this.scoreMultiplierActive ? points * this.SCORE_MULTIPLIER : points;
    this.score += multipliedPoints;
  }

  private applyDamage(): void {
    this.hitFlashStart = Date.now();
    if (this.isInvulnerable) return;
    const now = Date.now();
    if (now - this.lastHitSoundTime > this.HIT_SOUND_COOLDOWN) {
      this.lastHitSoundTime = now;
      this.ensureAudio();
      this.hitSound.currentTime = 0;
      this.hitSound.play().catch(() => {});
    }
    this.lives--;
    this.isInvulnerable = true;
    this.lastHitTime = Date.now();
    this.spawnFloatingText(this.player.x, this.player.y, '-1 ❤', '#FF0000', true);
    if (this.lives <= 0) {
      this.lives = 0;
      this.triggerGameOver();
    }
  }

  // =========================================================
  // HELPER & CONTROLS
  // =========================================================
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    this.keys[event.key] = true;
    if ([' ', 'ArrowUp', 'w'].includes(event.key)) {
      event.preventDefault();
    }
    if (['r', 'R'].includes(event.key)) {
      if (this.player) this.player.reset();
    }
    if (['d', 'D'].includes(event.key)) {
      this.showDebugHitbox = !this.showDebugHitbox;
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent): void {
    this.keys[event.key] = false;
  }
  
  // Menü: Start Game
  startSingleFromMenu(): void {
  this.pendingMode = 'single';
  this.gameState = 'help';
  }

  // Menü: Two Player
  startTwoPlayerFromMenu(): void {
  this.pendingMode = 'twoPlayer';
  this.gameState = 'help';
  }

  // Help bestätigt → startet wirklich das Spiel
  onHelpConfirmed(): void {
  this.gameMode = this.pendingMode;       // Modus übernehmen
  this.startGame(true);                   // startet running
  }

  startGame(fromMenu: boolean = false) {
    this.gameState = 'running';
    this.worldTimeScale = 1.3;
    this.playerTimeScale = 1.0;
    this.level.initLevel(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    if (this.player) this.player.reset();
    this.specialItems = []; 
    this.floatingTexts = [];
    this.score = 0;
    this.lives = 3;
    if (this.isMusicOn) this.playMusic();
    
    setTimeout(() => {
        if (this.gameLayerRef) {
             this.ctx = this.gameLayerRef.nativeElement.getContext('2d')!;
             this.ctx.imageSmoothingEnabled = false; 
             this.startSpecialItemSpawning(); 
             this.ngZone.runOutsideAngular(() => {
                 this.startGameLoop();
             });
        }
    }, 50);
  }

  pauseGame() { this.gameState = 'paused'; this.stopGameLoop(); this.stopMusic(); }
  resumeGame() { if (this.gameState === 'paused') { this.gameState = 'running'; if (this.isMusicOn) this.playMusic(); this.ngZone.runOutsideAngular(() => { this.startGameLoop(); }); } }
  restartGame() { this.stopGameLoop(); this.stopSpecialItemSpawning(); this.startGame(); }
  backToMenu() { this.gameState = 'menu'; this.stopGameLoop(); this.stopSpecialItemSpawning(); this.stopMusic(); this.hasSeenHelp = false; }
  onTwoPlayer() { console.log("2-Player not implemented."); }
  
  triggerGameOver() { 
      this.gameState = 'gameover'; 
      this.stopGameLoop(); 
      this.stopSpecialItemSpawning(); 
  }

  private stopGameLoop(): void { if (this.animationFrameId !== null) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; } }
  
  private startSpecialItemSpawning(): void {
    const spawnEveryMs = 2000; 
    this.specialSpawnTimer = setInterval(() => {
      if (this.gameState !== 'running') return;
      if (Math.random() > 0.4) { this.spawnRandomSpecialItem(); }
    }, spawnEveryMs);
  }

  private stopSpecialItemSpawning(): void {
    if (this.specialSpawnTimer) {
      clearInterval(this.specialSpawnTimer);
      this.specialSpawnTimer = null;
    }
  }
  
  private spawnRandomSpecialItem(): void {
    const lanes = [50, 140, 230]; 
    const laneY = lanes[Math.floor(Math.random() * lanes.length)]; 
    const startX = this.CANVAS_WIDTH + 50; 
    const type = this.pickRandomItemType(); 
    const newItem: SpecialItem = {
      id: this.nextSpecialId++,
      x: startX,
      y: laneY,
      width: this.SPECIAL_ITEM_SIZE,
      height: this.SPECIAL_ITEM_SIZE,
      type,
      image: SPECIAL_ITEM_IMAGE_MAP[type]
    }

    this.specialItems.push(newItem);
  }

  private pickRandomItemType(): SpecialItemType { 
      const weighted: SpecialItemType[] = [ 'scoreBonus', 'scoreBonus', 'boost', 'boost', 'chip', 'heart', 'slowmotion', 'toolbox', 'scanner', 'multiplier' , 'turbo' ]; 
      return weighted[Math.floor(Math.random() * weighted.length)]; 
  }
  
  private updateSpecialItems(): void {
  // NUR Cleanup – Bewegung kommt von der Welt
  this.specialItems = this.specialItems.filter(i => i.x > -50);
}

  // === AUDIO ===
  private ensureAudio() {
    if (!this.bgAudio) {
      this.bgAudio = new Audio('/assets/images/background.mp3');
      this.bgAudio.loop = true;
      this.bgAudio.volume = 0.2;
    }
  }

  private playItemSound() {
      const now = Date.now();
      if (now - this.lastItemSoundTime > this.ITEM_SOUND_COOLDOWN) {
        this.lastItemSoundTime = now;
        this.itemSound.pause();
        this.itemSound.currentTime = 0;
        this.itemSound.play().catch(() => {});
      }
  }

  playMusic() { this.ensureAudio(); this.bgAudio!.play().catch(() => {}); }
  stopMusic() { if (this.bgAudio) this.bgAudio.pause(); }
  toggleMusic() { this.isMusicOn = !this.isMusicOn; if (this.isMusicOn) this.playMusic(); else this.stopMusic(); }
  
  // === HIGHSCORE INTEGRATION ===
  private loadHighscores() {
      this.highscoreService.getHighscores().subscribe(scores => {
          this.highScores = scores.map(s => s.score);
      });
  }
  
  // Method called by Gameover Screen to save score
  saveScore(playerName: string) {
      this.highscoreService.addHighscore(playerName, this.score).subscribe(() => {
          this.loadHighscores(); 
      });
  }

  // === DEBUG RENDERING ===
  private drawDebugInfo() {
      this.ctx.save(); 
      if (this.isInvulnerable) {
          // Blinken, wenn unverwundbar
          const blinkPhase = Math.floor(Date.now() / 100) % 2 === 0;
          this.ctx.strokeStyle = blinkPhase ? 'red' : 'transparent';
      } else {
          this.ctx.strokeStyle = '#00FF00'; 
      }
      this.ctx.lineWidth = 2;
      if (this.player) {
          this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
      }
      this.ctx.restore(); 
  }
}