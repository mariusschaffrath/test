import {
  Component,
  EventEmitter,
  OnInit,
  OnDestroy,
  Output,
  inject,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { switchMap } from 'rxjs';
import { HighscoreService, HighscoreEntry } from '../../services/highscore.service';
import { Input } from '@angular/core';

@Component({
  selector: 'app-start-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './start-screen.html',
  styleUrl: './start-screen.css',
})
export class StartScreen implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('menuBtn') menuBtns!: QueryList<ElementRef<HTMLButtonElement>>;
  @Output() start = new EventEmitter<void>();
  @Output() twoPlayer = new EventEmitter<void>();
  @Input() activeSelection: any;

  public refreshInterval?: ReturnType<typeof setInterval>;
  public highscoreSubscription?: Subscription;
  public loadTrigger$ = new Subject<void>();
  public removeKeydownListener?: () => void;

  public highscoreEntries: HighscoreEntry[] = [];
  public isLoading = true;
  public hasError = false;

  public highscoreService = inject(HighscoreService);
  public cdr = inject(ChangeDetectorRef);
  public renderer = inject(Renderer2);

  // 0 = Start Game, 1 = 2 Player
  public selectedIndex = 0;
  public focusTimeout?: any;

  public setSelectedIndex(idx: number): void {
    console.log('setSelectedIndex called with', idx);
    this.selectedIndex = idx;
    this.cdr.detectChanges();
    setTimeout(() => {
      const btns = this.menuBtns?.toArray();
      btns?.forEach((btn: ElementRef<HTMLButtonElement>, i: number) => {
        if (i === idx) {
          console.log('Focusing button', i, btn.nativeElement);
          btn.nativeElement.focus();
        }
      });
    }, 0);
  }

  public keydownHandler = (event: KeyboardEvent): void => {
    console.log('keydownHandler', event.key, 'selectedIndex:', this.selectedIndex);
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      this.setSelectedIndex(0);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.setSelectedIndex(1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.selectedIndex === 0) {
        this.start.emit();
      } else {
        this.twoPlayer.emit();
      }
    }
  };

  ngOnInit(): void {
    console.log('StartScreen ngOnInit');
    // Set up subscription with switchMap to handle automatic cleanup
    this.highscoreSubscription = this.loadTrigger$
      .pipe(
        switchMap(() => {
          this.isLoading = true;
          this.hasError = false;
          return this.highscoreService.getHighscores();
        }),
      )
      .subscribe({
        next: (scores: HighscoreEntry[]) => {
          this.highscoreEntries = scores.slice(0, 10); // Top 10 scores
          this.isLoading = false;
          this.hasError = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading highscores:', error);
          this.hasError = true;
          this.isLoading = false;
        },
      });

    // Initial load
    this.loadHighscores();

    // Auto-refresh every 30 seconds to get latest scores
    this.refreshInterval = setInterval(() => {
      this.loadHighscores();
    }, 30000);

    // Listen for Enter/Space key to start game
    // Use Renderer2 to attach keydown handler for better Angular compatibility
    this.removeKeydownListener = this.renderer.listen('window', 'keydown', this.keydownHandler);
    console.log('keydown handler attached', this.removeKeydownListener);
  }

  ngAfterViewInit(): void {
    // Focus the default button on first render
    setTimeout(() => {
      console.log('ngAfterViewInit: focusing default button', this.selectedIndex);
      this.setSelectedIndex(this.selectedIndex);
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.highscoreSubscription) {
      this.highscoreSubscription.unsubscribe();
    }
    this.loadTrigger$.complete();
    if (this.removeKeydownListener) {
      this.removeKeydownListener();
    }
  }

  // Manual refresh method that can be called externally
  public refreshLeaderboard(): void {
    this.loadHighscores();
  }

  loadHighscores(): void {
    // Trigger a new load via the Subject, switchMap will handle canceling previous requests
    this.loadTrigger$.next();
  }
}
