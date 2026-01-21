import { Component, EventEmitter, Input, Output, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-arcade-name-entry',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arcade-name-entry.component.html',
  styleUrl: './arcade-name-entry.component.css',
})
export class ArcadeNameEntryComponent implements OnInit {
  @Input() initialName: string = 'AAA';
  @Output() nameChanged = new EventEmitter<string>();
  @Output() nameConfirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  // Available characters for selection
  characters = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
  ];

  // Current character positions (0-35 for A-Z, 0-9)
  charPositions: number[] = [0, 0, 0]; // 3 slots, all start at 'A'
  currentSlot: number = 0; // Which slot is currently selected (0-2)

  ngOnInit() {
    this.initializeFromName();
  }

  private initializeFromName() {
    // Parse the initial name and set character positions
    const name = this.initialName.toUpperCase().padEnd(3, 'A').substring(0, 3);
    for (let i = 0; i < 3; i++) {
      const char = name[i];
      const index = this.characters.indexOf(char);
      this.charPositions[i] = index >= 0 ? index : 0;
    }
  }

  getCurrentName(): string {
    return this.charPositions.map(pos => this.characters[pos]).join('');
  }

  moveSlot(direction: number) {
    this.currentSlot = Math.max(0, Math.min(2, this.currentSlot + direction));
  }

  scrollChar(direction: number) {
    const newPos = this.charPositions[this.currentSlot] + direction;
    if (newPos < 0) {
      this.charPositions[this.currentSlot] = this.characters.length - 1;
    } else if (newPos >= this.characters.length) {
      this.charPositions[this.currentSlot] = 0;
    } else {
      this.charPositions[this.currentSlot] = newPos;
    }
    this.nameChanged.emit(this.getCurrentName());
  }

  confirmName() {
    this.nameConfirmed.emit(this.getCurrentName());
  }

  cancel() {
    this.cancelled.emit();
  }

  // Keyboard controls
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.moveSlot(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.moveSlot(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.scrollChar(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.scrollChar(1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.confirmName();
        break;
      case 'Escape':
        event.preventDefault();
        this.cancel();
        break;
    }
  }

  // Mouse/Touch controls
  onSlotClick(slotIndex: number) {
    this.currentSlot = slotIndex;
  }

  onCharScroll(slotIndex: number, direction: number) {
    this.currentSlot = slotIndex;
    this.scrollChar(direction);
  }
}