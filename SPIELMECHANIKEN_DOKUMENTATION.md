# 🎮 Autoscroller Game - Ausführliche Dokumentation

## 📋 Übersicht

Dies ist ein **2D Autoscroller Platformer Spiel** entwickelt mit **Angular + TypeScript**. Der Spieler steuert eine Roboter-Figur (Spielfigur), die nach rechts scrollende Level automatisch durchquert und dabei Hindernisse meidet sowie Items sammelt.

---

## 🏗️ Architektur

### **Hauptkomponenten:**

```
Frontend/
├── src/app/game/
│   ├── game.ts              ⭐ Hauptspiel-Komponente
│   ├── player.ts            ⭐ Spielfigur-Klasse
│   ├── services/
│   │   └── level.ts         ⭐ Level-Management
│   ├── models/
│   │   ├── platform.ts      Plattform-Definition
│   │   ├── hazard.ts        Hindernis-Definition
│   │   ├── item.ts          Item-Definition
│   │   └── pattern-library.ts  Vordefinierte Level-Muster
│   └── [andere Komponenten]
```

---

## 🎮 Kern-Klassen & deren Methoden

### 1️⃣ **GameComponent** (game.ts)
**Hauptverantwortung:** Koordiniert das gesamte Spiel, Input, Render-Loop, Kollisionen

#### 📊 Wichtigste Eigenschaften:

```typescript
// Canvas & Rendering
CANVAS_WIDTH: 960px
CANVAS_HEIGHT: 360px
private ctx: CanvasRenderingContext2D  // 2D-Zeichenfläche

// Spieler-Verwaltung
private player: Player                  // Die Roboter-Figur
private keys: {[key]: boolean}          // Tastatur-Status

// Level-System
private level: Level                    // Level-Service
private platforms: Platform[]           // Laufbare Plattformen
private hazards: Hazard[]              // Hindernisse/Gefahren
private items: Item[]                   // Sammelbare Items

// Spiel-Status
gameState: 'menu' | 'running' | 'paused' | 'gameover'
score: number                           // Punkte
lives: number                           // Verbleibende Leben
maxLives: number = 3                    // Max. Leben

// Spezial-Items
specialItems: SpecialItem[]             // Power-Ups (Herzen, Boosts, etc.)

// Collision & Damage
isCollisionActive: boolean = true       // Hindernisse treffen = Schaden
isInvulnerable: boolean                 // Unverwundbar nach Hit (1,5s)
INVULNERABILITY_DURATION: 1500ms        // Wie lange unverwundbar
```

#### 🔧 Wichtigste Methoden:

| Methode | Zweck |
|---------|-------|
| `ngAfterViewInit()` | **Initialisiert** Canvas, Player, Level bei Komponenten-Start |
| `startGameLoop()` | **Game-Loop** - wird 60x pro Sekunde aufgerufen |
| `update()` | **Update-Phase** - Player bewegt sich, Items spawnen |
| `render()` | **Render-Phase** - alles zeichnen auf Canvas |
| `checkItemCollisions()` | **Sensor-Items prüfen** - wenn Player trifft → +Punkte |
| `checkSpecialItemCollisions()` | **Power-Ups prüfen** - Herzen, Boosts, etc. |
| `checkHazardCollisions()` | **Hindernisse prüfen** - wenn Player trifft → -Leben |
| `applyDamage()` | **Schaden anwenden** - Leben -1, Unverwundbarkeit aktivieren |
| `addScore(points)` | **Punkte hinzufügen** und in Console loggen |
| `startGame()` | **Spiel starten** - neuer Level, Score reset, Audio abspielen |
| `pauseGame()` | **Pause** - Game-Loop stoppen |
| `restartGame()` | **Neustarten** - Level neu initialisieren |
| `triggerGameOver()` | **Game-Over auslösen** - wenn Leben = 0 |

#### ⌨️ Tastatur-Events:

| Taste | Aktion |
|-------|--------|
| **← / A** | Nach links laufen |
| **→ / D** | Nach rechts laufen |
| **Space / ↑ / W** | Springen |
| **R** | Spielfigur zurücksetzen |
| **D** | Debug-Hitbox anzeigen/ausblenden |
| **C** | Kollisionen an/aus schalten |
| **L** | Leben testen (-1) |

---

### 2️⃣ **Player-Klasse** (player.ts)
**Hauptverantwortung:** Verwaltet Spielfigur-Position, Physik, Bewegung, Zeichnung

#### 📊 Wichtigste Eigenschaften:

```typescript
// Position & Größe
x: number                    // X-Position auf Canvas
y: number                    // Y-Position auf Canvas
width: 40px                  // Breite der Figur
height: 60px                 // Höhe der Figur

// Physik
velocityX: number            // Geschwindigkeit horizontal
velocityY: number            // Geschwindigkeit vertikal (Gravitation)
gravity: 0.6                 // Gravitations-Kraft
maxFallSpeed: 20             // Max. Fallgeschwindigkeit
jumpPower: 15                // Sprung-Kraft
moveSpeed: 5                 // Lauf-Geschwindigkeit

// Zustand
isJumping: boolean           // Gerade am springen?
isOnGround: boolean          // Steht auf Plattform/Boden?
platforms: Platform[]        // Bekannte Plattformen für Kollisionen

// Canvas-Grenzen
canvasWidth: number          // Canvas-Breite
canvasHeight: number         // Canvas-Höhe
```

#### 🔧 Wichtigste Methoden:

| Methode | Zweck |
|---------|-------|
| `constructor(x, y, w, h)` | **Initialisierung** - Position und Größe setzen |
| `setPlatforms(platforms)` | **Plattformen registrieren** für Kollisionserkennung |
| `jump()` | **Springen** - wenn auf Boden: velocityY = -jumpPower |
| `moveLeft()` | **Nach links** - velocityX = -moveSpeed |
| `moveRight()` | **Nach rechts** - velocityX = moveSpeed |
| `stopMoving()` | **Stoppen** - velocityX = 0 |
| `update()` | **Physik-Update** - Gravitation, Position, Plattform-Kollisionen |
| `checkPlatformCollision()` | **Plattform-Hits prüfen** - oben/unten/links/rechts |
| `draw(ctx)` | **Roboter zeichnen** - detaillierte Grafik mit Farben |
| `reset()` | **Zurücksetzen** auf Startposition |
| `getPosition()` | **Position abrufen** - {x, y} |
| `setPosition(x, y)` | **Position setzen** - manuell |

#### 🤖 Spielfigur-Design:

Die Roboter-Figur besteht aus:
- **Antenne** oben mit rotem Punkt
- **Kopf** - dunkelgrauer Helm mit blauen Augen & Highlights
- **Hals** - braun
- **Körper** - orange mit Details & Brust-Quadrate
- **Arme** - braun, an den Seiten
- **Hände** - dunkelbraune Kreise
- **Beine** - braun, proportional
- **Füße** - dunkelgraue Ellipsen

---

### 3️⃣ **Level-Service** (level.ts)
**Hauptverantwortung:** Generiert Level dynamisch, verwaltet Plattformen, Items, Hindernisse

#### 📊 Wichtigste Eigenschaften:

```typescript
// Level-Objekte
private platforms: Platform[]           // Alle Plattformen
private hazards: Hazard[]              // Alle Hindernisse/Gefahren
private items: Item[]                   // Alle sammelbar Items (Sensoren)

// Level-Generierung
private patterns: LevelPattern[]        // Vordefinierte Level-Muster
private lastPatternEndX: number         // Wo ist das letzte Muster geendet
private totalFrames: number             // Wie viele Frames gespielt

// Konstanten
CANVAS_WIDTH: 960px
CANVAS_HEIGHT: 360px
SCROLL_SPEED: 790/7.4 = ~107 px/s     // Wie schnell scrollt der Level
FRAME_RATE: 60 FPS                     // Zielframe-Rate

// Höhen-Grid (wo sind die 3 Plattform-Ebenen?)
GRID_Y_TOP: 80px    // Obere Ebene
GRID_Y_MID: 170px   // Mittlere Ebene
GRID_Y_LOW: 260px   // Untere Ebene
GRID_Y_FLOOR: 350px // Boden
```

#### 🔧 Wichtigste Methoden:

| Methode | Zweck |
|---------|-------|
| `initLevel()` | **Neue Stufe starten** - Arrays löschen, erstes Muster laden |
| `update(w, h)` | **Jede Frame** - Level scrollen, neue Muster generieren wenn nötig |
| `getPlatforms()` | **Alle Plattformen abrufen** für Kollisionen |
| `getHazards()` | **Alle Hindernisse abrufen** für Schaden-Prüfung |
| `getItems()` | **Alle Sensor-Items abrufen** zum Sammeln |
| `generateLevel()` | **Level-Muster laden** - Plattformen, Items, Hindernisse setzen |
| `scrollLevel()` | **Nach links scrollen** - Welt bewegt sich |
| `removeOffscreenElements()` | **Aufräumen** - Objekte links vom Screen löschen |

---

## 🎯 Spiel-Mechaniken

### **1. Bewegung & Physik**

```
Tastendruck → keys[key] = true
  ↓
Game-Loop prüft keys[]
  ↓
Ruft player.moveLeft/Right() auf
  ↓
player.velocityX = ±moveSpeed
  ↓
player.update() addiert velocityX zu x
  ↓
Gravitation wird angewandt: velocityY += gravity
  ↓
Plattform-Kollisionen prüfen
  ↓
Player wird neu gezeichnet
```

### **2. Springen-Mechanik**

```
Taste Space/W/↑ gedrückt
  ↓
handleKeyDown() → player.jump()
  ↓
Prüfe: isOnGround && !isJumping?
  ↓
JA: velocityY = -jumpPower (nach oben)
     isJumping = true
     isOnGround = false
  ↓
update(): Gravitation zieht nach unten
  ↓
Spieler fällt nach unten
  ↓
Plattform-Kollision → isOnGround = true → kann wieder springen
```

### **3. Plattform-Kollisionen** (4 Richtungen)

```
checkPlatformCollision() wird in player.update() aufgerufen

A) VON OBEN (landen auf Plattform):
   - velocityY >= 0 (fällt nach unten)
   - y + height war über Plattform.y
   - Jetzt: y + height + velocityY >= platform.y
   → Spieler auf Plattform setzen
   → velocityY = 0
   → isOnGround = true

B) VON UNTEN (gegen Plattform springen):
   - velocityY < 0 (springt nach oben)
   - y war unter Plattform
   - Jetzt: y + velocityY <= platform.y + height
   → Spieler unter Plattform platzieren
   → velocityY = 0
   → Sprung stoppt

C) VON LINKS (gegen Plattform laufen):
   - velocityX > 0 (läuft rechts)
   - Trifft rechten Rand von Plattform
   → Player.x = platform.x - width
   → velocityX = 0

D) VON RECHTS (gegen Plattform laufen):
   - velocityX < 0 (läuft links)
   - Trifft linken Rand von Plattform
   → Player.x = platform.x + width
   → velocityX = 0
```

### **4. Item-Sammeln**

```
checkItemCollisions() wird in Game-Loop aufgerufen

Für jedes Item in level.getItems():
  Prüfe Hitbox-Kollision:
    player.x < item.x + width &&
    player.x + width > item.x &&
    player.y < item.y + height &&
    player.y + height > item.y

  JA:
    item.collected = true           // Markieren als gesammelt
    addScore(item.points)            // +10-50 Punkte
    log("Sensor eingesammelt")        // Debug-Ausgabe
  
  NEIN:
    Weiter zum nächsten Item
```

### **5. Hazard-Kollisionen (Hindernisse)**

```
checkHazardCollisions() wird in Game-Loop aufgerufen

Prüfe isCollisionActive == true?
  NEIN: Überspringen (Hindernisse tun nichts)

Prüfe isInvulnerable == true?
  JA: Prüfe ob 1,5 Sekunden vorbei
      - NEIN: Überspringen (bleib unverwundbar)
      - JA: isInvulnerable = false → normal weitermachen

Für jedes Hindernis in level.getHazards():
  Prüfe Hitbox-Kollision mit player:
    player.x < hazard.x + width &&
    player.x + width > hazard.x &&
    player.y < hazard.y + height &&
    player.y + height > hazard.y

  JA:
    applyDamage()                    // Schaden anwenden!
    break                            // Nur 1x pro Frame
  
  NEIN:
    Nächstes Hindernis

applyDamage():
  lives--                            // Leben -1
  isInvulnerable = true              // Unverwundbar für 1,5s
  
  Visuell:
    Spieler blinkt rot (Farbe wechselt alle 100ms)
    Text "INVULNERABLE" erscheint

  if (lives == 0):
    triggerGameOver()                // Spiel vorbei!
```

### **6. Special Items (Power-Ups)**

```
checkSpecialItemCollisions() wird in Game-Loop aufgerufen

Für jedes Special Item:
  Prüfe Hitbox-Kollision
  JA:
    applySpecialItem(item)
    Item aus Array entfernen
```

**Special Item Effekte:**

| Item | Effekt | Code |
|------|--------|------|
| 💚 **heart** | +1 Leben (max 3) | `lives = min(lives+1, 3)` |
| 💰 **scoreBonus** | +100 Punkte sofort | `addScore(100)` |
| 🚀 **boost** | 3 Sekunden moveSpeed=10 statt 5 | `setTimeout()` |
| 🔴 **chip** | +50 Punkte | `addScore(50)` |
| 🧰 **toolbox** | +200 Punkte | `addScore(200)` |
| 🔵 **scanner** | Hazard-Kollisionen aktivieren | `isCollisionActive = true` |
| ⏰ **slowmotion** | [noch nicht implementiert] | - |
| 📡 **multiplier** | [noch nicht implementiert] | - |

---

## 📊 Game-Loop (60 FPS)

```typescript
// Pro Frame (~16ms):

1. INPUT PHASE
   keys[key] Status aktualisieren
   Falls Tastendruck: jump(), moveLeft/Right()

2. UPDATE PHASE
   Player Bewegung basierend auf keys[]
   player.update()  // Physik
   level.update()   // Level scrollen, neue Muster
   updateSpecialItems()  // Power-Ups bewegen

3. COLLISION PHASE
   checkItemCollisions()        // Sensoren sammeln
   checkSpecialItemCollisions() // Power-Ups sammeln
   checkHazardCollisions()      // Hindernisse prüfen

4. RENDER PHASE
   ctx.clearRect()  // Canvas löschen
   render()  // Alles zeichnen:
     - Plattformen
     - Hindernisse
     - Items
     - Special Items
     - Player
     - Debug-Infos

5. NÄCHSTER FRAME
   requestAnimationFrame() → Zurück zu Schritt 1
```

---

## 🎨 Rendering-Reihenfolge

```
Canvas (960x360)
├── Hintergrund (Farbe: schwarz)
├── Plattformen (textured oder schwarz)
│   ├── Boden (unten)
│   ├── Mittlere Plattformen
│   └── Obere Plattformen
├── Hindernisse (rot, Kabel dünner)
├── Sensor-Items (blaue/grüne/rote Kreise)
├── Special Items (farbig, mit Rahmen)
├── 🤖 Spielfigur (Roboter-Design)
└── Debug-Infos (grüne/rote Hitbox wenn aktiviert)
```

---

## 📈 Punkte-System

```
Item sammeln:
  - Sensor-A: +10 Punkte
  - Sensor-B: +10 Punkte
  - Sensor-C: +10 Punkte

Special Items:
  - Schraube (scoreBonus): +100
  - Batterie (chip): +50
  - Toolbox: +200
  - Herz: +0 (nur Leben)
  - Rad (boost): +0 (nur Effekt)
  - Antenne (multiplier): +0 (zukünftig)
  - Scanner: +0 (Funktion)
  - Sanduhr (slowmotion): +0 (nicht implementiert)

Total mögliche Punkte pro Spiel:
  → Abhängig von Items im Level
  → Hindernisse bringen KEINE Punkte
  → Hindernisse kosten nur LEBEN
```

---

## 🛡️ Unverwundbarkeit-Mechanik

```
Nach Hindernisschlag:

isInvulnerable = true
lastHitTime = Date.now()

For next 1500ms (1.5 Sekunden):
  - Spieler blinkt rot/transparent
  - Neue Hindernisschläge ignorieren
  - Weitere Hits zählen nicht

Nach 1500ms:
  if (Date.now() - lastHitTime > 1500):
    isInvulnerable = false
    Spieler wieder normal (nicht blinkend)
    Hindernisse treffen wieder
```

---

## 🔌 Verbindungen zwischen Komponenten

```
GameComponent
├── nutzt: Level-Service
│   ├── liefert: platforms[], hazards[], items[]
│   └── updatet: Scrolling, neue Muster
├── steuert: Player
│   ├── Input: player.moveLeft/Right/jump()
│   ├── Input: player.setPlatforms()
│   ├── Output: player.x, player.y, player.width, player.height
│   └── Output: player.isOnGround, player.isJumping
├── verwaltet: specialItems[]
│   ├── spawnRandomSpecialItem() alle 2 Sekunden
│   ├── Bewegung: item.x -= speed
│   └── Kollision prüfen
├── verwaltet: score, lives, gameState
│   ├── +Punkte bei Item-Sammlung
│   ├── -Leben bei Hindernisschlag
│   └── Game Over bei lives == 0
└── rendert: alles auf Canvas
```

---

## 🔊 Audio

```
isMusicOn: boolean = false

Methods:
  playMusic()     → Hintergrund-Musik abspielen
  stopMusic()     → Musik stoppen
  toggleMusic()   → An/Aus wechseln

Datei: /assets/images/background.mp3
Volume: 0.2 (20%)
Loop: true (wiederholt)
```

---

## 🐛 Debug-Features

| Taste | Funktion |
|-------|----------|
| **D** | Hitbox anzeigen (grün normal, rot unverwundbar) |
| **C** | Kollisionen an/aus |
| **L** | Leben testen (-1) |
| **R** | Spieler reset |

**Console-Ausgaben:**
```
[ITEM] Collected sensor-a: +10 points
[DAMAGE] -1 Leben. Unverwundbar für 1,5 Sekunden
[HIT] Lives: 2/3
[SPECIAL ITEM] Collected heart
[HEALTH] +1 Leben -> 3/3
[BOOST] Aktiviert für 3 Sekunden
```

---

## 📱 Responsivität

Canvas: **960x360px** (feste Größe)
- Breit genug für 3 Plattformen nebeneinander
- Hoch genug für 4 vertikale Ebenen

Spieler-Größe: **40x60px**
- Etwa 4% Breite, 16% Höhe

Platform-Höhe: **15px**
Hindernis-Größe: **15x15px**

---

## 🎯 Ziele des Spiels

1. **Überleben** - Möglichst lange nicht die 3 Leben verlieren
2. **Sammeln** - Möglichst viele Items sammeln = Punkte
3. **Effizient laufen** - Mit Boost schneller vorankommen
4. **Hindernisse meiden** - Geschick bei Plattformen-Sprüngen

---

## 🔮 Mögliche Erweiterungen

- [ ] Multiplier-Effekt (2x Punkte für 5 Sekunden)
- [ ] Slow-Motion (Level verlangsamt sich)
- [ ] Highscore-Speicherung (LocalStorage/Backend)
- [ ] Sound-Effekte (Sprung, Item, Schaden)
- [ ] Level-Schwierigkeit (Easy/Normal/Hard)
- [ ] Gegner-AI
- [ ] Mehrere Leben-Anzeige Animation
- [ ] Combo-System

---

## ✅ Status: PRODUKTIV ✅

Das Spiel ist **vollständig funktional** und alle Kern-Mechaniken sind implementiert:

✅ Spielfigur-Steuerung
✅ Physik & Plattform-Kollisionen
✅ Item-Sammlung & Punkte
✅ Hindernisse & Schaden-System
✅ Special Items & Power-Ups
✅ Game-Over Logik
✅ Unverwundbarkeits-Phasen
✅ Audio-System
✅ Debug-Features
