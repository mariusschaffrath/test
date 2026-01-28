// src/app/game/player.ts

export interface CollisionPlatform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Player {
  // Position
  x: number;
  y: number;

  // Das Bild
  image: HTMLImageElement = new Image(); // 👈 Hier direkt initialisieren
  
  // Größe der Hitbox (Physik)
  width: number = 40;
  height: number = 60;
  
  // Geschwindigkeit
  velocityX: number = 0;
  velocityY: number = 0;
  
  // Bewegungskonstanten
  moveSpeed: number = 5;
  jumpPower: number = 14;
  gravity: number = 0.6;      
  maxFallSpeed: number = 14;  
  
  // Zustand
  isJumping: boolean = false;
  isOnGround: boolean = false;
  
  // Canvas-Grenzen
  canvasWidth: number;
  canvasHeight: number;
  
  // Plattformen
  platforms: CollisionPlatform[] = [];
  
  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number) {
    this.x = x;
    this.y = y;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // 👇 WICHTIG: Hier laden wir das Bild direkt!
    // Achte genau auf die Endung (.png oder .PNG) wie sie in deinem Ordner ist
    this.image.src = 'assets/images/player.PNG'; 
  }

  // Die Methode setImage brauchen wir nicht mehr, da der Player es selbst macht.

  setPlatforms(platforms: CollisionPlatform[]): void {
    this.platforms = platforms;
  }
  
  jump(): void {
    if (this.isOnGround) {
      this.velocityY = -this.jumpPower;
      this.isJumping = true;
      this.isOnGround = false;
    }
  }
  
  moveLeft(): void { this.velocityX = -this.moveSpeed; }
  moveRight(): void { this.velocityX = this.moveSpeed; }
  stopMoving(): void { this.velocityX = 0; }

  private checkPlatformCollision(): void {
    this.isOnGround = false;

    if (this.velocityY < 0) {
      return;
    }

    for (const platform of this.platforms) {
      if (
        this.x + this.width > platform.x &&
        this.x < platform.x + platform.width
      ) {
        
        const playerBottom = this.y + this.height;
        const platformTop = platform.y;
        const threshold = 20; 

        if (
             playerBottom >= platformTop && 
             playerBottom <= platformTop + threshold
           ) {
          this.y = platform.y - this.height; 
          this.velocityY = 0;
          this.isOnGround = true;
          this.isJumping = false;
          return;
        }
      }
    }
  }
  
  update(timeScale: number = 1): void {
    const dt = timeScale; 

    this.velocityY += this.gravity * dt;
    if (this.velocityY > this.maxFallSpeed) {
      this.velocityY = this.maxFallSpeed;
    }

    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    this.checkPlatformCollision();

    if (this.y + this.height >= this.canvasHeight) {
      this.y = this.canvasHeight - this.height;
      this.velocityY = 0;
      this.isOnGround = true;
      this.isJumping = false;
    }

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > this.canvasWidth) {
      this.x = this.canvasWidth - this.width;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Check ob Bild geladen ist
    if (this.image && this.image.complete && this.image.naturalHeight !== 0) {
      const spriteWidth = 64; 
      const spriteHeight = this.height; 

      const drawX = this.x - (spriteWidth - this.width) / 2;
      const drawY = this.y;

      ctx.drawImage(this.image, drawX, drawY, spriteWidth, spriteHeight);
    } else {
      // Fallback
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  
  reset(): void {
    this.x = 50;
    this.y = 200; 
    this.velocityX = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isOnGround = false;
  }
}