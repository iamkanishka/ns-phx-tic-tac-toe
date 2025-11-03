import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { SoundService, SoundType } from "./sound.service";
import { HapticService, HapticIntensity } from "./haptics.service";

export enum Player {
  X = "X",
  O = "O",
}

export enum GameState {
  Playing = "playing",
  Won = "won",
  Draw = "draw",
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
  animationSpeed: "fast" | "normal" | "slow";
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundVolume: number;
  showHints: boolean;
  darkMode: boolean;
}

@Injectable({
  providedIn: "root",
})
export class GameService implements OnDestroy {
  private destroy$ = new Subject<void>();

  private defaultSettings: GameSettings = {
    animationSpeed: "normal",
    soundEnabled: true,
    vibrationEnabled: true,
    soundVolume: 0.7,
    showHints: true,
    darkMode: false,
  };

  private initialBoard: GameBoard = {
    cells: Array(9).fill(""),
    state: GameState.Playing,
    currentPlayer: Player.X,
    winner: null,
    winningLine: null,
    scores: { X: 0, O: 0, draws: 0 },
  };

  private boardSubject = new BehaviorSubject<GameBoard>(this.initialBoard);
  private settingsSubject = new BehaviorSubject<GameSettings>(
    this.defaultSettings
  );

  public board$: Observable<GameBoard> = this.boardSubject.asObservable();
  public settings$: Observable<GameSettings> =
    this.settingsSubject.asObservable();

  constructor(
    private soundService: SoundService,
    private hapticService: HapticService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.soundService.dispose();
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

  makeMove(index: number): boolean {
    const board = this.gameBoard;

    // Validate move
    if (board.state !== GameState.Playing || board.cells[index] !== "") {
      this.soundService.play(SoundType.Invalid, this.settings.soundVolume);
      this.hapticService.trigger(HapticIntensity.Error);
      return false;
    }

    // Make the move
    const newCells = [...board.cells];
    newCells[index] = board.currentPlayer;

    // Check game state
    const winningLine = this.checkWin(newCells);
    const isDraw = !winningLine && newCells.every((cell) => cell !== "");

    // Update scores
    const newScores = { ...board.scores };

    if (winningLine) {
      newScores[board.currentPlayer]++;
      this.soundService.play(SoundType.Win, this.settings.soundVolume);
      
      this.hapticService.trigger(HapticIntensity.Success);
    } else if (isDraw) {
      newScores.draws++;
      this.soundService.play(SoundType.Draw, this.settings.soundVolume);
      this.hapticService.trigger(HapticIntensity.Warning);
    } else {
      this.soundService.play(SoundType.Move, this.settings.soundVolume);
      this.hapticService.trigger(HapticIntensity.Light);
    }

    const newBoard: GameBoard = {
      cells: newCells,
      currentPlayer: board.currentPlayer === Player.X ? Player.O : Player.X,
      state: winningLine
        ? GameState.Won
        : isDraw
        ? GameState.Draw
        : GameState.Playing,
      winner: winningLine ? board.currentPlayer : null,
      winningLine: winningLine || null,
      scores: newScores,
    };

    this.boardSubject.next(newBoard);
    return true;
  }

  private checkWin(cells: string[]): number[] | null {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (
        cells[a] &&
        cells[a] !== "-" &&
        cells[a] === cells[b] &&
        cells[a] === cells[c]
      ) {
        return pattern;
      }
    }

    return null;
  }

  resetGame(): void {
    this.soundService.play(SoundType.Reset, this.settings.soundVolume);
    this.hapticService.trigger(HapticIntensity.Medium);
    this.boardSubject.next({
      ...this.initialBoard,
      scores: this.gameBoard.scores,
    });
  }

  resetScores(): void {
    this.soundService.play(SoundType.Click, this.settings.soundVolume);
    this.hapticService.trigger(HapticIntensity.Medium);
    this.boardSubject.next({ ...this.initialBoard });
  }

  updateSettings(newSettings: Partial<GameSettings>): void {
    const updated = {
      ...this.settings,
      ...newSettings,
    };

    this.settingsSubject.next(updated);
    this.soundService.setEnabled(updated.soundEnabled);
    this.hapticService.setEnabled(updated.vibrationEnabled);

    // Save to local storage
    this.saveSettings(updated);
  }

  private saveSettings(settings: GameSettings): void {
    // Implement local storage saving
    console.log("Saving settings:", settings);
  }

  // AI Helper - Suggest best move
  getSuggestedMove(): number | null {
    const cells = this.cells;
    const player = this.currentPlayer;
    const opponent = player === Player.X ? Player.O : Player.X;

    // 1. Check if we can win
    const winMove = this.findWinningMove(cells, player);
    if (winMove !== null) return winMove;

    // 2. Block opponent from winning
    const blockMove = this.findWinningMove(cells, opponent);
    if (blockMove !== null) return blockMove;

    // 3. Take center if available
    if (cells[4] === "") return 4;

    // 4. Take corners
    const corners = [0, 2, 6, 8];
    for (const corner of corners) {
      if (cells[corner] === "") return corner;
    }

    // 5. Take any available spot
    return cells.findIndex((cell) => cell === "");
  }

  private findWinningMove(cells: string[], player: string): number | null {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      const line = [cells[a], cells[b], cells[c]];
      const playerCount = line.filter((cell) => cell === player).length;
      const emptyCount = line.filter((cell) => cell === "").length;

      if (playerCount === 2 && emptyCount === 1) {
        if (cells[a] === "") return a;
        if (cells[b] === "") return b;
        if (cells[c] === "") return c;
      }
    }

    return null;
  }

  updateBoardFromServer(
    cells: string[],
    status: string,
    winner: string | null,
    winningLine: number[] | null,
    currentPlayer: string
  ): void {
    let gameState: GameState;

    switch (status) {
      case "won":
        gameState = GameState.Won;
        this.soundService.play(SoundType.Win, this.settings.soundVolume);
        break;
      case "draw":
        gameState = GameState.Draw;
        this.soundService.play(SoundType.Draw, this.settings.soundVolume);
        break;
      default:
        gameState = GameState.Playing;
    }

    const currentBoard = this.gameBoard;

    this.boardSubject.next({
      cells: cells,
      state: gameState,
      currentPlayer: currentPlayer === "X" ? Player.X : Player.O,
      winner: winner ? (winner === "X" ? Player.X : Player.O) : null,
      winningLine: winningLine,
      scores: currentBoard.scores,
    });
  }


  confettiCelebrate(): void {    
    this.soundService.play(SoundType.Confetti, this.settings.soundVolume);
   }
}
