import { AfterViewInit, Component, inject, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
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
type SpecialItemType = 'heart' | 'slowmotion' | 'scoreBonus' | 'boost' | 'chip' | 'toolbox'| 'scanner' | 'multiplier';
const SPECIAL_ITEM_IMAGE_MAP: Record<SpecialItemType, string> = {
  heart: 'assets/images/Item-Herz.PNG',
  chip: 'assets/images/Item-Zahnrad.PNG',
  toolbox: 'assets/images/Item-Box.PNG',
  scoreBonus: 'assets/images/Item-Batterie.PNG',
  boost: 'assets/images/Item-Antenne.PNG',
  slowmotion: 'assets/images/Item-Schraube.PNG', 
  scanner: 'assets/images/Item-Scanner.PNG',
  multiplier: 'assets/images/Item-Timer.PNG', 
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
  imports: [
    CommonModule, 
    StartScreen,
    PauseScreen,
    GameoverScreen,
    ItemBarComponent,
    HelpScreen
  ], 
  templateUrl: './game.html',
  styleUrls: ['./game.css'], 
})
export class GameComponent implements AfterViewInit, OnDestroy {
  // === GLOBAL TIME SCALE ===
  private hasSeenHelp = false;

  private worldTimeScale = 1;   
  private playerTimeScale = 1;  
  private slowMotionActive = false;
  private slowMotionStart = 0;
  private readonly SLOW_MOTION_DURATION = 6000; 
  private readonly SLOW_MOTION_FACTOR = 0.5;    

  // === HAZARD LANES ===
  private readonly HAZARD_LANES = [60, 140, 220];

  // === ASSETS FOR NEW RENDERING (Waren vorher vergessen!) ===
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

  // === AUDIO ===
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
    private ngZone: NgZone
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
    
    // Load Level Assets
    try {
        await this.level.initAssets();
        console.log("Level Assets loaded.");
    } catch (e) {
        console.warn("Assets fallback.");
    }

    this.level.initLevel(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // PLAYER INIT
    this.player = new Player(50, this.CANVAS_HEIGHT - 60, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Load Highscores
    this.loadHighscores();

    if (this.ctx) this.render();
  }

  ngOnDestroy(): void {
    this.stopGameLoop();
    this.stopMusic();
    this.stopSpecialItemSpawning();
  }

  // =========================================================
  // PRELOAD IMAGES
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

  // =========================================================
  // GAME LOOP
  // =========================================================
  
  private startGameLoop = (): void => {
    if (this.gameState !== 'running') return;

    // GLOBAL SLOW MOTION TIMER
    if (this.slowMotionActive) {
      if (Date.now() - this.slowMotionStart > this.SLOW_MOTION_DURATION) {
        this.worldTimeScale = 1.3;
        this.slowMotionActive = false;
      }
    }

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
  // INPUT HANDLING
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
  // RENDER
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

    // 4. PLAYER
    if (this.player) {
      this.player.draw(this.ctx);
    }

    // 5. DEBUG
    if (this.showDebugHitbox) {
       this.drawDebugInfo();
    }

    // 6. FLOATING TEXTS
    this.drawFloatingTexts(this.ctx);
  }

  // =========================================================
  // RENDERING METHODS
  // =========================================================

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

  // =========================================================
  // KOLLISIONEN
  // =========================================================
  
  private checkItemCollisions(): void {
    this.level.getItems().forEach(item => {
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
    this.specialItems = this.specialItems.filter(item => {
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
      case 'heart':
        if (this.lives < this.maxLives) {
          this.lives++;
          this.spawnFloatingText(item.x, item.y, '❤', '#FF0000', true);
        } else {
          this.spawnFloatingText(item.x, item.y, 'MAX', '#FF0000', false);
        }
        break;

      case 'slowmotion':
        this.addScore(50);
        this.spawnFloatingText(item.x, item.y, '+50');
        break;

      case 'chip':
        this.addScore(100);
        this.spawnFloatingText(item.x, item.y, '+100');
        break;

      case 'scoreBonus':
        this.addScore(150);
        this.spawnFloatingText(item.x, item.y, '+150');
        break;

      case 'toolbox':
        this.score *= 2;
        if (this.lives < this.maxLives) {
          this.lives++;
        }
        this.spawnFloatingText(item.x, item.y, '♥ x2', '#FFD700', true);
        break;

      case 'boost':
        this.score *= 2;
        this.spawnFloatingText(item.x, item.y, 'X2', '#00FF00', true);
        break;

      case 'scanner':
        this.scannerActive = true;
        this.scannerStartTime = Date.now();
        this.spawnFloatingText(item.x, item.y, 'SHIELD', '#00FFFF', true);
        break;

       case 'multiplier':
        this.worldTimeScale = this.SLOW_MOTION_FACTOR;
        this.slowMotionActive = true;
        this.slowMotionStart = Date.now();
        this.spawnFloatingText(item.x, item.y, 'SLOW ⏱', '#FFFFFF', true);
        break;
    }
  }

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
    this.floatingTexts.forEach(t => {
      t.y -= 1;     
      t.life--;
    });
    this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
  }

  private addScore(points: number): void { this.score += points; }

  private applyDamage(): void {
    if (this.isInvulnerable) return;

    // Sound
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
  
  onHelpConfirmed() {
    this.hasSeenHelp = true;
    this.startGame(true);
  }

  starthelper() {
    if (!this.hasSeenHelp) {
      this.gameState = 'help';
      return;
    }
    this.startGame(true);
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
      const weighted: SpecialItemType[] = [ 'scoreBonus', 'scoreBonus', 'boost', 'boost', 'chip', 'heart', 'slowmotion', 'toolbox', 'scanner', 'multiplier' ]; 
      return weighted[Math.floor(Math.random() * weighted.length)]; 
  }
  
  private updateSpecialItems(): void {
    const baseSpeed = 1.6;
    const speed = baseSpeed * this.worldTimeScale;

    this.specialItems.forEach(item => {
      item.x -= speed;
    });

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