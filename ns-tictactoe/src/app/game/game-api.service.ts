// game-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CompletedGame {
  id: number;
  board: { [key: string]: string | null };
  status: string;
  winner: string | null;
  winning_line: number[] | null;
  player_x: string | null;
  player_o: string | null;
  turn_count: number;
  completed_at: string;
  inserted_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameApiService {
  private apiUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  getCompletedGames(): Observable<CompletedGame[]> {
    return this.http.get<CompletedGame[]>(`${this.apiUrl}/games`);
  }

  getCompletedGame(id: string): Observable<CompletedGame> {
    return this.http.get<CompletedGame>(`${this.apiUrl}/games/${id}`);
  }

  getGameStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/games/stats`);
  }
}