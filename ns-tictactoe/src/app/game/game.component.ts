import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { GameService, GameState, Player, GameSettings } from './game.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface CellPosition {
  row: number;
  col: number;
  index: number;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Animation states
  public cellStates: boolean[] = Array(9).fill(false);
  public showSettings = false;
  public isAnimating = false;
  public cellPositions: CellPosition[] = [];

  constructor(
    public gameService: GameService,
    private cdRef: ChangeDetectorRef
  ) {
    // Pre-calculate cell positions to avoid Math in template
    this.initializeCellPositions();
  }

  ngOnInit() {
    this.gameService.board$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeCellPositions(): void {
    this.cellPositions = [];
    for (let i = 0; i < 9; i++) {
      this.cellPositions.push({
        row: Math.floor(i / 3),
        col: i % 3,
        index: i
      });
    }
  }

  async makeMove(index: number): Promise<void> {
    if (this.isAnimating || this.gameService.gameState !== GameState.Playing) {
      return;
    }

    this.isAnimating = true;
    this.cellStates[index] = true;

    // Add slight delay for better UX
    await this.delay(this.getAnimationSpeed());
    
    this.gameService.makeMove(index);
    this.isAnimating = false;
  }

  resetGame(): void {
    this.isAnimating = true;
    this.cellStates = Array(9).fill(false);
    
    setTimeout(() => {
      this.gameService.resetGame();
      this.isAnimating = false;
    }, 300);
  }

  resetScores(): void {
    this.gameService.resetScores();
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  getCellClass(cell: string, index: number): string[] {
    const classes = ['cell'];
    
    if (cell) {
      classes.push(`cell-${cell.toLowerCase()}`);
    } else {
      classes.push('cell-empty');
    }

    if (this.gameService.winningLine?.includes(index)) {
      classes.push('winning-cell');
    }

    if (this.cellStates[index]) {
      classes.push('cell-pop');
    }

    return classes;
  }

  getStatusMessage(): string {
    const state = this.gameService.gameState;
    const currentPlayer = this.gameService.currentPlayer;
    
    switch (state) {
      case GameState.Playing:
        return `Player ${currentPlayer}'s Turn`;
      case GameState.Won:
        return `🎉 Player ${this.gameService.winner} Wins! 🎉`;
      case GameState.Draw:
        return "🤝 It's a Draw!";
      default:
        return 'Game Over';
    }
  }

  getStatusSubtitle(): string {
    const state = this.gameService.gameState;
    
    if (state !== GameState.Playing) {
      return 'Tap "New Game" to play again';
    }
    
    return 'Tap an empty cell to make your move';
  }

  getRowArray(): number[] {
    return [0, 1, 2];
  }

  getColArray(): number[] {
    return [0, 1, 2];
  }

  getCellIndex(row: number, col: number): number {
    return row * 3 + col;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getAnimationSpeed(): number {
    const speeds = {
      fast: 100,
      normal: 200,
      slow: 400
    };
    return speeds[this.gameService.settings.animationSpeed];
  }

  // Accessibility helpers
  getCellAriaLabel(index: number): string {
    const cell = this.gameService.cells[index];
    const row = Math.floor(index / 3) + 1;
    const col = (index % 3) + 1;
    
    if (cell) {
      return `Cell ${row},${col} contains ${cell}`;
    }
    return `Empty cell at position ${row},${col}. Tap to place ${this.gameService.currentPlayer}`;
  }

  getBoardAriaLabel(): string {
    const state = this.gameService.gameState;
    
    switch (state) {
      case GameState.Playing:
        return `Tic Tac Toe game in progress. Current player: ${this.gameService.currentPlayer}`;
      case GameState.Won:
        return `Tic Tac Toe game completed. Player ${this.gameService.winner} wins!`;
      case GameState.Draw:
        return 'Tic Tac Toe game completed. The game is a draw.';
      default:
        return 'Tic Tac Toe game board';
    }
  }
}