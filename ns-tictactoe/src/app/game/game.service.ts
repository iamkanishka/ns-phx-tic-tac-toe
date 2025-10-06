import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export enum Player {
  X = 'X',
  O = 'O'
}

export enum GameState {
  Playing = 'playing',
  Won = 'won',
  Draw = 'draw'
}

export interface GameBoard {
  cells: string[];
  state: GameState;
  currentPlayer: Player;
  winner: Player | null;
  winningLine: number[] | null;
  scores: { X: number; O: number; draws: number };
}

export interface GameSettings {
  animationSpeed: 'fast' | 'normal' | 'slow';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GameService implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  private defaultSettings: GameSettings = {
    animationSpeed: 'normal',
    soundEnabled: true,
    vibrationEnabled: true
  };

  private initialBoard: GameBoard = {
    cells: Array(9).fill(''),
    state: GameState.Playing,
    currentPlayer: Player.X,
    winner: null,
    winningLine: null,
    scores: { X: 0, O: 0, draws: 0 }
  };

  private boardSubject = new BehaviorSubject<GameBoard>(this.initialBoard);
  private settingsSubject = new BehaviorSubject<GameSettings>(this.defaultSettings);
  
  public board$: Observable<GameBoard> = this.boardSubject.asObservable();
  public settings$: Observable<GameSettings> = this.settingsSubject.asObservable();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get gameBoard(): GameBoard {
    return this.boardSubject.value;
  }

  get cells(): string[] {
    return this.gameBoard.cells;
  }

  get gameState(): GameState {
    return this.gameBoard.state;
  }

  get currentPlayer(): Player {
    return this.gameBoard.currentPlayer;
  }

  get winner(): Player | null {
    return this.gameBoard.winner;
  }

  get winningLine(): number[] | null {
    return this.gameBoard.winningLine;
  }

  get scores(): { X: number; O: number; draws: number } {
    return this.gameBoard.scores;
  }

  get settings(): GameSettings {
    return this.settingsSubject.value;
  }

// In game.service.ts, update the makeMove method:
makeMove(index: number): void {
  const board = this.gameBoard;
  
  // Validate move
  if (board.state !== GameState.Playing || board.cells[index] !== '') {
    this.triggerHapticFeedback('error');
    return;
  }

  // Make the move
  const newCells = [...board.cells];
  newCells[index] = board.currentPlayer;

  // Check game state
  const winningLine = this.checkWin(newCells);
  const isDraw = !winningLine && newCells.every(cell => cell !== '');

  // Update scores
  const newScores = { ...board.scores };
  if (winningLine) {
    newScores[board.currentPlayer]++;
    this.triggerHapticFeedback('success');
  } else if (isDraw) {
    newScores.draws++;
    this.triggerHapticFeedback('medium');
  } else {
    this.triggerHapticFeedback('light');
  }

  const newBoard: GameBoard = {
    cells: newCells,
    currentPlayer: board.currentPlayer === Player.X ? Player.O : Player.X,
    state: winningLine ? GameState.Won : isDraw ? GameState.Draw : GameState.Playing,
    winner: winningLine ? board.currentPlayer : null,
    winningLine: winningLine || null,
    scores: newScores
  };

  this.boardSubject.next(newBoard);
}

  private checkWin(cells: string[]): number[] | null {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return pattern;
      }
    }

    return null;
  }

  resetGame(): void {
    this.triggerHapticFeedback('light');
    this.boardSubject.next({ 
      ...this.initialBoard, 
      scores: this.gameBoard.scores 
    });
  }

  resetScores(): void {
    this.triggerHapticFeedback('medium');
    this.boardSubject.next({ ...this.initialBoard });
  }

  updateSettings(newSettings: Partial<GameSettings>): void {
    this.settingsSubject.next({
      ...this.settings,
      ...newSettings
    });
  }

  private triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void {
    if (!this.settings.vibrationEnabled) return;

    // NativeScript haptic feedback implementation would go here
    console.log(`Haptic feedback: ${type}`);
  }
}