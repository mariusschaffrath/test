import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-help-screen',
  standalone: true,
  templateUrl: './help-screen.html',
  styleUrls: ['./help-screen.css'],
})
export class HelpScreen {
  @Output() confirm = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }
}