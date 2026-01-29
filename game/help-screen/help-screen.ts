import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';

@Component({
  selector: 'app-help-screen',
  standalone: true,
  templateUrl: './help-screen.html',
  styleUrls: ['./help-screen.css'],
})
export class HelpScreen implements AfterViewInit {
  @Output() confirm = new EventEmitter<void>();

  @ViewChild('confirmBtn') confirmBtn!: ElementRef<HTMLButtonElement>;

  ngAfterViewInit() {
    // Automatically focus the confirm button
    if (this.confirmBtn) {
      this.confirmBtn.nativeElement.focus();
    }
  }

  onConfirm() {
    this.confirm.emit();
  }
}
