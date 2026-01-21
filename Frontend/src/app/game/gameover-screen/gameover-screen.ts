import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HighscoreService, HighscoreEntry } from '../../services/highscore.service';
import { ArcadeNameEntryComponent } from '../arcade-name-entry/arcade-name-entry.component';

@Component({
  selector: 'app-gameover-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, ArcadeNameEntryComponent],
  templateUrl: './gameover-screen.html',
  styleUrl: './gameover-screen.css',
})
export class GameoverScreen implements OnInit, OnDestroy {
  @Input() score: number = 0;
  @Input() highScores: number[] = []; // Keep for backward compatibility

  @Output() restart = new EventEmitter<void>();
  @Output() backToMenu = new EventEmitter<void>();

  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private highscoreSubscription?: Subscription;
  private loadTrigger$ = new Subject<void>();
  highscoreEntries: HighscoreEntry[] = [];
  isLoading = true;
  hasError = false;
  private visibilityChangeHandler = this.handleVisibilityChange.bind(this);

  // Name input form properties
  playerName: string = 'AAA'; // Default 3-character arcade name
  showNameEntry: boolean = false; // Controls when to show name entry
  isSaving = false;
  saveError = false;
  saveSuccess = false;
  scoreSaved = false;

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
    this.startRefreshInterval();
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  ngOnDestroy() {
    this.clearRefreshInterval();
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    if (this.highscoreSubscription) {
      this.highscoreSubscription.unsubscribe();
    }
    this.loadTrigger$.complete();
  }

  private startRefreshInterval() {
    this.clearRefreshInterval();
    this.refreshInterval = setInterval(() => {
      this.loadHighscores();
    }, 30000);
  }

  private clearRefreshInterval() {
  if (this.refreshInterval !== null) {
    clearInterval(this.refreshInterval);
    this.refreshInterval = null;
  }
}

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.loadHighscores();
      this.startRefreshInterval();
    } else {
      this.clearRefreshInterval();
    }
  }
  // Manual refresh method
  refreshLeaderboard() {
    this.loadHighscores();
  }

  loadHighscores() {
    // Trigger a new load via the Subject, switchMap will handle canceling previous requests
    this.loadTrigger$.next();
  }

  /**
   * Show the arcade name entry screen
   */
  showArcadeNameEntry() {
    this.showNameEntry = true;
  }

  /**
   * Handle name confirmation from arcade entry
   */
  onNameConfirmed(name: string) {
    this.playerName = name;
    this.showNameEntry = false;
    this.saveScore();
  }

  /**
   * Handle name entry cancellation
   */
  onNameEntryCancelled() {
    this.showNameEntry = false;
  }

  /**
   * Save the player's score with their name
   */
  saveScore() {
    if (!this.playerName.trim() || this.scoreSaved) {
      return;
    }

    this.isSaving = true;
    this.saveError = false;
    this.saveSuccess = false;

    this.highscoreService.addHighscore(this.playerName.trim(), this.score)
      .subscribe({
        next: (savedEntry) => {
          console.log('Score saved successfully:', savedEntry);
          this.saveSuccess = true;
          this.scoreSaved = true;
          this.isSaving = false;
          // Refresh the leaderboard to show the new score
          this.loadHighscores();
        },
        error: (error) => {
          console.error('Error saving score:', error);
          this.saveError = true;
          this.isSaving = false;
        }
      });
  }

  /**
   * Check if the save button should be enabled
   */
  canSave(): boolean {
    return this.playerName.trim().length === 3 && !this.isSaving && !this.scoreSaved;
  }
}
