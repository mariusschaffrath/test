import { Component, EventEmitter, OnInit, OnDestroy, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HighscoreService, HighscoreEntry } from '../../services/highscore.service';

@Component({
  selector: 'app-start-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './start-screen.html',
  styleUrl: './start-screen.css',
})
export class StartScreen implements OnInit, OnDestroy {
  @Output() start = new EventEmitter<void>();
  @Output() twoPlayer = new EventEmitter<void>();
  
  private refreshInterval?: ReturnType<typeof setInterval>;
  private highscoreSubscription?: Subscription;
  private loadTrigger$ = new Subject<void>();

  highscoreEntries: HighscoreEntry[] = [];
  isLoading = true;
  hasError = false;

  private highscoreService = inject(HighscoreService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // Set up subscription with switchMap to handle automatic cleanup
    this.highscoreSubscription = this.loadTrigger$.pipe(
      switchMap(() => {
        this.isLoading = true;
        this.hasError = false;
        return this.highscoreService.getHighscores();
      })
    ).subscribe({
      next: (scores) => {
        this.highscoreEntries = scores.slice(0, 10); // Top 10 scores
        this.isLoading = false;
        this.hasError = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading highscores:', error);
        this.hasError = true;
        this.isLoading = false;
      }
    });
    
    // Initial load
    this.loadHighscores();
    
    // Auto-refresh every 30 seconds to get latest scores
    this.refreshInterval = setInterval(() => {
      this.loadHighscores();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.highscoreSubscription) {
      this.highscoreSubscription.unsubscribe();
    }
    this.loadTrigger$.complete();
  }

  // Manual refresh method that can be called externally
  refreshLeaderboard() {
    this.loadHighscores();
  }

  loadHighscores() {
    // Trigger a new load via the Subject, switchMap will handle canceling previous requests
    this.loadTrigger$.next();
  }

}
