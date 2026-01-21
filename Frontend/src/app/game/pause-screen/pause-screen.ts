import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-pause-screen',
  standalone: true,
  templateUrl: './pause-screen.html',
  styleUrl: './pause-screen.css',
})
export class PauseScreen {
  @Output() resume = new EventEmitter<void>();
  @Output() restart = new EventEmitter<void>();
  @Output() backToMenu = new EventEmitter<void>();
}
