import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { GameService, GameState, Player, GameSettings } from './game.service';
import { GameSocketService, GameState as SocketGameState } from './game-socket.service';
import { GameApiService, CompletedGame } from './game-api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface CellPosition {
  row: number;
  col: number;
  index: number;
}

export interface OnlineGameState {
  id: string;
  board: { [key: string]: string | null };
  status: 'waiting' | 'playing' | 'finished';
  current_player: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  winning_line: number[] | null;
  player_x: string | null;
  player_o: string | null;
  turn_count: number;
  players: { [key: string]: string };
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameCopyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Animation states
  public cellStates: boolean[] = Array(9).fill(false);
  public showSettings = false;
  public isAnimating = false;
  public cellPositions: CellPosition[] = [];

  // Online game states
  public gameMode: 'local' | 'online' = 'local';
  public onlineGameState: OnlineGameState | null = null;
  public isConnected = false;
  public gameId: string | null = null;
  public playerRole: 'X' | 'O' | null = null;
  public showGameHistory = false;
  public completedGames: CompletedGame[] = [];
  public gameStats: any = null;

  constructor(
    public gameService: GameService,
    private gameSocketService: GameSocketService,
    private gameApiService: GameApiService,
    private cdRef: ChangeDetectorRef
  ) {
    this.initializeCellPositions();
  }

  ngOnInit() {
    // Subscribe to local game state
    this.gameService.board$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdRef.detectChanges();
      });

    // Subscribe to online game state
    this.gameSocketService.gameState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: OnlineGameState | null) => {
        this.onlineGameState = state;
        this.isConnected = !!state;
        this.cdRef.detectChanges();
      });

    // Load game stats
    this.loadGameStats();
  }

  ngOnDestroy(): void {
    this.leaveOnlineGame();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== LOCAL GAME METHODS ==========
  
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
    if (this.isAnimating) {
      return;
    }

    if (this.gameMode === 'local') {
      await this.makeLocalMove(index);
    } else {
      await this.makeOnlineMove(index);
    }
  }

  private async makeLocalMove(index: number): Promise<void> {
    if (this.gameService.gameState !== GameState.Playing) {
      return;
    }

    this.isAnimating = true;
    this.cellStates[index] = true;

    await this.delay(this.getAnimationSpeed());
    
    this.gameService.makeMove(index);
    this.isAnimating = false;
  }

  private async makeOnlineMove(index: number): Promise<void> {
    if (!this.onlineGameState || this.onlineGameState.status !== 'playing') {
      return;
    }

    // Check if it's this player's turn
    if (this.playerRole !== this.onlineGameState.current_player) {
      console.log("It's not your turn!");
      return;
    }

    this.isAnimating = true;
    this.cellStates[index] = true;

    await this.delay(this.getAnimationSpeed());
    
    this.gameSocketService.makeMove(index);
    this.isAnimating = false;
  }

  resetGame(): void {
    this.isAnimating = true;
    this.cellStates = Array(9).fill(false);
    
    setTimeout(() => {
      if (this.gameMode === 'local') {
        this.gameService.resetGame();
      } else {
        this.gameSocketService.resetGame();
      }
      this.isAnimating = false;
    }, 300);
  }

  resetScores(): void {
    this.gameService.resetScores();
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  // ========== ONLINE GAME METHODS ==========

  switchGameMode(mode: 'local' | 'online'): void {
    if (this.gameMode === mode) return;

    if (mode === 'online') {
      this.initializeOnlineGame();
    } else {
      this.leaveOnlineGame();
    }

    this.gameMode = mode;
    this.resetGame();
  }

  initializeOnlineGame(): void {
    const userToken = this.generateUserToken();
    this.gameSocketService.connect(userToken);
    
    // Generate or use existing game ID
    this.gameId = this.gameId || this.gameSocketService.generateGameId();
    this.gameSocketService.createOrJoinGame(this.gameId);
  }

  joinAsPlayer(player: 'X' | 'O'): void {
    this.playerRole = player;
    this.gameSocketService.joinAsPlayer(player);
  }

  leaveOnlineGame(): void {
    this.gameSocketService.leaveGame();
    this.onlineGameState = null;
    this.isConnected = false;
    this.playerRole = null;
    this.gameId = null;
  }

  shareGame(): void {
    if (this.gameId) {
      // In a real app, you might copy to clipboard or share via social media
      const gameUrl = `${window.location.origin}/game/${this.gameId}`;
      console.log('Share this game URL:', gameUrl);
      // You could implement a proper share dialog here
    }
  }

  loadGameHistory(): void {
    this.gameApiService.getCompletedGames()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (games) => {
          this.completedGames = games;
          this.showGameHistory = true;
          this.cdRef.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load game history:', error);
        }
      });
  }

  loadGameStats(): void {
    this.gameApiService.getGameStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.gameStats = stats;
          this.cdRef.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load game stats:', error);
        }
      });
  }

  // ========== UTILITY METHODS ==========

  getCellClass(cell: string, index: number): string[] {
    const classes = ['cell'];
    
    const currentCell = this.getCurrentCellValue(index);
    
    if (currentCell) {
      classes.push(`cell-${currentCell.toLowerCase()}`);
    } else {
      classes.push('cell-empty');
    }

    if (this.isWinningCell(index)) {
      classes.push('winning-cell');
    }

    if (this.cellStates[index]) {
      classes.push('cell-pop');
    }

    return classes;
  }

  private getCurrentCellValue(index: number): string | null {
    if (this.gameMode === 'local') {
      return this.gameService.cells[index];
    } else {
      return this.onlineGameState?.board[index.toString()] || null;
    }
  }

  private isWinningCell(index: number): boolean {
    if (this.gameMode === 'local') {
      return this.gameService.winningLine?.includes(index) || false;
    } else {
      return this.onlineGameState?.winning_line?.includes(index) || false;
    }
  }

  getStatusMessage(): string {
    if (this.gameMode === 'local') {
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
    } else {
      if (!this.onlineGameState) {
        return 'Connecting...';
      }

      const state = this.onlineGameState.status;
      const currentPlayer = this.onlineGameState.current_player;
      
      switch (state) {
        case 'waiting':
          return '⏳ Waiting for players...';
        case 'playing':
          const isMyTurn = this.playerRole === currentPlayer;
          return isMyTurn ? '🎯 Your Turn!' : `Player ${currentPlayer}'s Turn`;
        case 'finished':
          if (this.onlineGameState.winner === 'draw') {
            return "🤝 It's a Draw!";
          } else {
            const isWinner = this.playerRole === this.onlineGameState.winner;
            return isWinner ? '🎉 You Win! 🎉' : `Player ${this.onlineGameState.winner} Wins!`;
          }
        default:
          return 'Game Over';
      }
    }
  }

  getStatusSubtitle(): string {
    if (this.gameMode === 'local') {
      const state = this.gameService.gameState;
      
      if (state !== GameState.Playing) {
        return 'Tap "New Game" to play again';
      }
      
      return 'Tap an empty cell to make your move';
    } else {
      if (!this.onlineGameState) {
        return 'Establishing connection...';
      }

      const state = this.onlineGameState.status;
      
      switch (state) {
        case 'waiting':
          if (!this.playerRole) {
            return 'Choose your player role (X or O)';
          } else if (!this.onlineGameState.player_x || !this.onlineGameState.player_o) {
            return 'Waiting for another player to join...';
          } else {
            return 'Game will start automatically';
          }
        case 'playing':
          return this.playerRole === this.onlineGameState.current_player 
            ? 'Make your move!' 
            : 'Waiting for opponent...';
        case 'finished':
          return 'Tap "New Game" to play again or "Share" to invite friends';
        default:
          return '';
      }
    }
  }

  canMakeMove(index: number): boolean {
    if (this.isAnimating) return false;

    if (this.gameMode === 'local') {
      return this.gameService.gameState === GameState.Playing && 
             this.gameService.cells[index] === '';
    } else {
      return this.onlineGameState?.status === 'playing' &&
             this.playerRole === this.onlineGameState.current_player &&
             this.onlineGameState.board[index.toString()] === null;
    }
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

  private generateUserToken(): string {
    // Generate a simple user token - in production, use proper authentication
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========== ACCESSIBILITY HELPERS ==========

  getCellAriaLabel(index: number): string {
    const cell = this.getCurrentCellValue(index);
    const row = Math.floor(index / 3) + 1;
    const col = (index % 3) + 1;
    
    if (cell) {
      return `Cell ${row},${col} contains ${cell}`;
    }
    
    const currentPlayer = this.gameMode === 'local' 
      ? this.gameService.currentPlayer 
      : this.onlineGameState?.current_player || 'X';
      
    return `Empty cell at position ${row},${col}. Tap to place ${currentPlayer}`;
  }

  getBoardAriaLabel(): string {
    if (this.gameMode === 'local') {
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
    } else {
      if (!this.onlineGameState) {
        return 'Online Tic Tac Toe game - Connecting...';
      }

      const state = this.onlineGameState.status;
      
      switch (state) {
        case 'waiting':
          return 'Online Tic Tac Toe game - Waiting for players to join';
        case 'playing':
          return `Online Tic Tac Toe game in progress. Current player: ${this.onlineGameState.current_player}`;
        case 'finished':
          if (this.onlineGameState.winner === 'draw') {
            return 'Online Tic Tac Toe game completed - The game is a draw';
          } else {
            return `Online Tic Tac Toe game completed - Player ${this.onlineGameState.winner} wins!`;
          }
        default:
          return 'Online Tic Tac Toe game board';
      }
    }
  }
}