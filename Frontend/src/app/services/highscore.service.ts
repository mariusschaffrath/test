import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interface matching the backend HighscoreEntry model
 */
export interface HighscoreEntry {
  id: number;
  playerName: string;
  score: number;
  createdAt: string;
}

/**
 * Service for managing highscores via the backend API
 * Backend API must be running on http://localhost:5089
 */
@Injectable({
  providedIn: 'root'
})
export class HighscoreService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5089/api/highscores';

  /**
   * Get all highscores from the backend
   * Returns top 20 highscores ordered by score descending
   */
  getHighscores(): Observable<HighscoreEntry[]> {
    return this.http.get<HighscoreEntry[]>(this.apiUrl);
  }

  /**
   * Add a new highscore entry
   * @param playerName - Name of the player (max 30 characters)
   * @param score - Score achieved (0 to 2,147,483,647)
   */
  addHighscore(playerName: string, score: number): Observable<HighscoreEntry> {
    return this.http.post<HighscoreEntry>(this.apiUrl, { 
      playerName, 
      score 
    });
  }

  /**
   * Delete a highscore entry by ID
   * @param id - The ID of the highscore entry to delete
   */
  deleteHighscore(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
