// ============================================
// game.component.ts - COMPLETE WITH MULTIPLAYER
// ============================================
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { GameService, GameState, Player, GameSettings } from "./game.service";
import { GameSocketService, ConnectionStatus } from "./game-socket.service";
import { GameApiService } from "./game-api.service";
import { AnimationService } from "./animation.service";
import { ClipboardService } from "./nativeclipboard.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { View } from "@nativescript/core";
import { Dialogs } from "@nativescript/core";
import { GoogleSignin, User } from "@nativescript/google-signin";
import { RouterExtensions } from "@nativescript/angular";
import { AuthenticatedUserResponse, AuthService, GoogleUser } from "../auth/service/auth/auth.service";


interface CellPosition {
  row: number;
  col: number;
  index: number;
}

export enum GameMode {
  Offline = "offline",
  Online = "online",
}

interface WaitingGame {
  id: string;
  player_x_name: string;
  status: string;
  created_at: string;
}

@Component({
  standalone: false,
  selector: "app-game",
  templateUrl: "./game.component.html",
  styleUrls: ["./game.component.css"],
})
export class GameComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Enums for template
  GameState = GameState;
  Player = Player;
  GameMode = GameMode;
  ConnectionStatus = ConnectionStatus;

  // Animation states
  public cellStates: boolean[] = Array(9).fill(false);
  public showSettings = false;
  public showStats = false;
  public showHint = false;
  public isAnimating = false;
  public cellPositions: CellPosition[] = [];
  public suggestedMove: number | null = null;

  // Game stats
  public gamesPlayed = 0;
  public xWinRate = 0;
  public oWinRate = 0;
  public drawRate = 0;
  public currentStreak = 0;
  public longestStreak = 0;

  // Settings
  public settings: GameSettings;

  // Multiplayer state
  public currentMode: GameMode = GameMode.Offline;
  public showLobby = false;
  public showCreateGame = false;
  public showJoinGame = false;
  public playerName = "";
  public playerId = "";
  public gameIdToJoin = "";
  public currentGameId: string | null = null;
  public mySymbol: "X" | "O" | null = null;
  public opponentConnected = false;
  public connectionStatus: ConnectionStatus = ConnectionStatus.Disconnected;
  public waitingGames: WaitingGame[] = [];
  public errorMessage: string | null = null;
  public isLoadingGames = false;

  // user info
  userInfo: AuthenticatedUserResponse | null = null;
  
  constructor(
    public gameService: GameService,
    public gameSocketService: GameSocketService,
    public gameApiService: GameApiService,
    private animationService: AnimationService,
    private cdRef: ChangeDetectorRef,
    private clipboardService: ClipboardService,
     private router: RouterExtensions,
     private authService: AuthService,
      private routerExtensions: RouterExtensions
  ) {
    this.settings = this.gameService.settings;
    this.playerId = this.gameSocketService.generatePlayerId();
    this.initializeCellPositions();
    this.loadStats();
  }

  ngOnInit() {
     // Start by loading Google user info
     this.loadGoogleUserInfo();

    // Subscribe to local game state
    this.gameService.board$
      .pipe(takeUntil(this.destroy$))
      .subscribe((board) => {
      
        this.updateStats(board);
        this.cdRef.detectChanges();
      });

    this.gameService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe((settings) => {
        this.settings = settings;
        this.cdRef.detectChanges();
      });

    // Subscribe to multiplayer game state
    this.gameSocketService.gameState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((game) => {
        if (game && this.currentMode === GameMode.Online) {
          // Update local game service with server state
          this.gameService.updateBoardFromServer(
            game.cells,
            game.state,
            game.winner,
            game.winning_line,
            game.current_player
          );
        }
      });

    // Subscribe to connection status
    this.gameSocketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        this.connectionStatus = status;
        this.cdRef.detectChanges();
      });

    // Subscribe to opponent connection
    this.gameSocketService.opponentConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected) => {
        this.opponentConnected = connected;
        if (connected && this.currentMode === GameMode.Online) {
          this.showToast("Opponent joined! Game starting...", "success");
        }
        this.cdRef.detectChanges();
      });

    // Subscribe to player symbol
    this.gameSocketService.myPlayerSymbol$
      .pipe(takeUntil(this.destroy$))
      .subscribe((symbol) => {
        this.mySymbol = symbol;
      });

    // Subscribe to errors
    this.gameSocketService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        console.log(error);

        if (error) {
          this.showToast(error, "error");
        }
      });

    

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.gameSocketService.disconnect();
  }

  getCellIndex(row: number, col: number): number {
    return row * 3 + col;
  }

  private initializeCellPositions(): void {
    this.cellPositions = [];
    for (let i = 0; i < 9; i++) {
      this.cellPositions.push({
        row: Math.floor(i / 3),
        col: i % 3,
        index: i,
      });
    }
  }

  // ============================================
  // GAME ACTIONS
  // ============================================

  async makeMove(index: number, view?: View): Promise<void> {
    if (this.isAnimating) return;

    if (this.currentMode === GameMode.Online) {
      // Online mode - check if it's player's turn
      if (!this.gameSocketService.isMyTurn()) {
        this.showToast("Not your turn!", "error");
        return;
      }
 

      if (this.gameService.cells[index] !== "" && this.gameService.cells[index] !== "-" ) {
        return;
      }

      this.gameSocketService.makeMove(index);
    } else {
      // Offline mode
      if (this.gameService.gameState !== GameState.Playing) {
        return;
      }

      this.isAnimating = true;
      this.cellStates[index] = true;
      this.suggestedMove = null;

      if (view) {
        await this.animationService.cellPop(view);
      } else {
        await this.delay(this.getAnimationSpeed());
      }

      const success = this.gameService.makeMove(index);

      if (success && this.gameService.gameState !== GameState.Playing) {
        await this.delay(300);
        // Trigger celebration
      }

      this.isAnimating = false;
    }
  }

  async resetGame(): Promise<void> {
    if (this.currentMode === GameMode.Online) {
      // Leave online game
      const confirmed = await Dialogs.confirm({
        title: "Leave Game",
        message: "Are you sure you want to leave this game?",
        okButtonText: "Yes",
        cancelButtonText: "No",
      });

      if (confirmed) {
        this.gameSocketService.disconnect();
        this.currentGameId = null;
        this.showLobby = true;
      }
    } else {
      // Reset local game
      this.isAnimating = true;
      this.cellStates = Array(9).fill(false);
      this.suggestedMove = null;

      await this.delay(300);
      this.gameService.resetGame();
      this.isAnimating = false;
    }
  }

  async resetScores(): Promise<void> {
    const confirmed = await Dialogs.confirm({
      title: "Reset Scores",
      message: "Are you sure you want to reset all scores and statistics?",
      okButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (confirmed) {
      this.gameService.resetScores();
      this.gamesPlayed = 0;
      this.currentStreak = 0;
      this.longestStreak = 0;
      this.saveStats();
    }
  }

  // ============================================
  // MODE SWITCHING
  // ============================================

  switchToOnlineMode(): void {
    this.currentMode = GameMode.Online;
    this.showLobby = true;
    this.loadWaitingGames();
 
  }

  switchToOfflineMode(): void {
    this.currentMode = GameMode.Offline;
    this.showLobby = false;
    this.gameSocketService.disconnect();
    this.gameService.resetGame();
  }

  // ============================================
  // ONLINE MULTIPLAYER
  // ============================================

  async loadWaitingGames(): Promise<void> {
    this.isLoadingGames = true;
    try {
      this.waitingGames = await this.gameSocketService.getWaitingGames(this.userInfo?.user.id);
    } catch (error: any) {
      this.showToast("Failed to load games", "error");
    } finally {
      this.isLoadingGames = false;
    }
  }

  showCreateGameForm(): void {
    this.showCreateGame = true;
    this.showJoinGame = false;
  }

  showJoinGameForm(): void {
    this.showJoinGame = true;
    this.showCreateGame = false;
  }

  cancelCreateGame(): void {
    this.showCreateGame = false;
    this.playerName = "";
  }

  cancelJoinGame(): void {
    this.showJoinGame = false;
    this.playerName = "";
    this.gameIdToJoin = "";
  }

  async createOnlineGame(): Promise<void> {
   
   
   try {
      this.currentGameId = await this.gameSocketService.createGame(
        this.userInfo.user.id,
        this.userInfo.user.name
      );

      console.log(this.currentGameId + "Game Created");

      this.showLobby = false;
      this.showCreateGame = false;

      this.showToast("Game created! Share the ID with your friend.", "success");
    } catch (error: any) {
      console.log(error + "Error Checking");

      this.showToast("Failed to create game", "error");
    }
  }

  async joinOnlineGame(gameId: string): Promise<void> {
    // if (!this.playerName.trim()) {
    //   const result = await Dialogs.prompt({
    //     title: "Enter Your Name",
    //     message: "What's your name?",
    //     okButtonText: "Join",
    //     cancelButtonText: "Cancel",
    //     defaultText: "Player 2",
    //   });

    //   if (!result.result) return;
    //   this.playerName = result.text || "Player 2";
    // }

    try {
      await this.gameSocketService.joinGame(
        gameId,
        this.userInfo.user.id,
        this.userInfo.user.name
      );
      this.currentGameId = gameId;
      this.showLobby = false;
      this.showJoinGame = false;

      this.showToast("Joined game successfully!", "success");
    } catch (error: any) {
      this.showToast("Failed to join game", "error");
    }
  }

  async joinGameById(): Promise<void> {
    if (!this.gameIdToJoin.trim()) {
      this.showToast("Please enter a Game ID", "error");
      return;
    }

    await this.joinOnlineGame(this.gameIdToJoin);
  }

  async copyGameId(): Promise<void> {
    if (this.currentGameId) {
      this.clipboardService.copyToClipboard(this.currentGameId);
      this.showToast("Game ID copied to clipboard!", "success");
    }
  }

  async shareGameId(): Promise<void> {
    if (this.currentGameId) {
      const message = `Join my Tic Tac Toe game!\n\nGame ID: ${this.currentGameId}\n\nCopy this ID and paste it in the Join Game screen.`;

      // You can use native share dialog here
      this.clipboardService.copyToClipboard(this.currentGameId);

      await Dialogs.alert({
        title: "Share Game",
        message: message,
        okButtonText: "OK",
      });
    }
  }

  // ============================================
  // UI HELPERS
  // ============================================

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
    this.showStats = false;
  }

  toggleStats(): void {
    this.showStats = !this.showStats;
    this.showSettings = false;
  }

  showHintMove(): void {
    if (
      !this.settings.showHints ||
      this.gameService.gameState !== GameState.Playing
    ) {
      return;
    }

    if (this.currentMode === GameMode.Online) {
      this.showToast("Hints not available in online mode", "info");
      return;
    }

    this.suggestedMove = this.gameService.getSuggestedMove();
    this.showHint = true;

    setTimeout(() => {
      this.showHint = false;
      this.suggestedMove = null;
    }, 2000);
  }

  onAnimationSpeedChange(args: any): void {
    const speeds = ["fast", "normal", "slow"];
    this.gameService.updateSettings({
      animationSpeed: speeds[args.newIndex] as "fast" | "normal" | "slow",
    });
  }

  onSoundToggle(args: any): void {
    this.gameService.updateSettings({ soundEnabled: args.value });
  }

  onHapticToggle(args: any): void {
    this.gameService.updateSettings({ vibrationEnabled: args.value });
  }

  onVolumeChange(args: any): void {
    this.gameService.updateSettings({ soundVolume: args.value / 100 });
  }

  onHintsToggle(args: any): void {
    this.gameService.updateSettings({ showHints: args.value });
  }

  getCellClass(cell: string, index: number): string[] {
    const classes = ["cell"];

    if (cell) {
      classes.push(`cell-${cell.toLowerCase()}`);
    } else {
      classes.push("cell-empty");
    }

    if (this.gameService.winningLine?.includes(index)) {
      classes.push("winning-cell");
    }

    if (this.cellStates[index]) {
      classes.push("cell-pop");
    }

    if (this.suggestedMove === index && this.showHint) {
      classes.push("cell-hint");
    }

    // Disable cell if not player's turn in online mode
    if (
      this.currentMode === GameMode.Online &&
      !this.gameSocketService.isMyTurn()
    ) {
      classes.push("cell-disabled");
    }

    return classes;
  }

  getStatusMessage(): string {
    if (this.currentMode === GameMode.Online) {
      if (!this.opponentConnected) {
        return "Waiting for opponent...";
      }

      if (this.gameService.gameState === GameState.Playing) {
        return this.gameSocketService.isMyTurn()
          ? `Your turn (${this.mySymbol})`
          : `Opponent's turn`;
      }
    }

    const state = this.gameService.gameState;
    const currentPlayer = this.gameService.currentPlayer;

    switch (state) {
      case GameState.Playing:
        return `Player ${currentPlayer}'s Turn`;
      case GameState.Won:
        if (this.currentMode === GameMode.Online) {
          return this.gameService.winner === this.mySymbol
            ? "🎉 You Won! 🎉"
            : "😢 You Lost";
        }
        return `🎉 Player ${this.gameService.winner} Wins! 🎉`;
      case GameState.Draw:
        return "🤝 It's a Draw!";
      default:
        return "Game Over";
    }
  }

  getStatusSubtitle(): string {
    if (this.currentMode === GameMode.Online) {
      if (!this.opponentConnected && this.currentGameId) {
        return `Game ID: ${this.currentGameId}`;
      }
    }

    const state = this.gameService.gameState;

    if (state !== GameState.Playing) {
      return 'Tap "New Game" to play again';
    }

    if (this.currentStreak > 2) {
      return `🔥 ${this.currentStreak} game streak!`;
    }

    return "Tap an empty cell to make your move";
  }

  getConnectionStatusText(): string {
    switch (this.connectionStatus) {
      case ConnectionStatus.Connected:
        return "Connected";
      case ConnectionStatus.Connecting:
        return "Connecting...";
      case ConnectionStatus.Error:
        return "Connection Error";
      default:
        return "Disconnected";
    }
  }

  getConnectionStatusClass(): string {
    switch (this.connectionStatus) {
      case ConnectionStatus.Connected:
        return "status-connected";
      case ConnectionStatus.Connecting:
        return "status-connecting";
      case ConnectionStatus.Error:
        return "status-error";
      default:
        return "status-disconnected";
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  private updateStats(board: any): void {
    if (board.state === GameState.Won || board.state === GameState.Draw) {
      this.gamesPlayed++;

      if (board.state === GameState.Won) {
        if (board.winner === Player.X) {
          this.currentStreak++;
          this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
        } else {
          this.currentStreak = 0;
        }
      }

      this.calculateWinRates();
      this.saveStats();
    }
  }

  private calculateWinRates(): void {
    const total = this.gamesPlayed || 1;
    this.xWinRate = Math.round((this.gameService.scores.X / total) * 100);
    this.oWinRate = Math.round((this.gameService.scores.O / total) * 100);
    this.drawRate = Math.round((this.gameService.scores.draws / total) * 100);
  }

  private loadStats(): void {
    // Implement ApplicationSettings loading
    this.gamesPlayed = 0;
    this.currentStreak = 0;
    this.longestStreak = 0;
  }

  private saveStats(): void {
    // Implement ApplicationSettings saving
    console.log("Saving stats");
  }

  private showToast(
    message: string,
    type: "success" | "error" | "info" = "info"
  ): void {
    // Implement toast notification
    console.log(`[${type.toUpperCase()}] ${message}`);

    // You can use a toast library or native dialog
    if (type === "error") {
      Dialogs.alert({
        title: "Error",
        message: message,
        okButtonText: "OK",
      });
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getAnimationSpeed(): number {
    const speeds = {
      fast: 100,
      normal: 200,
      slow: 400,
    };
    return speeds[this.settings.animationSpeed];
  }

  getCellAriaLabel(index: number): string {
    const cell = this.gameService.cells[index];
    const row = Math.floor(index / 3) + 1;
    const col = (index % 3) + 1;

    if (cell) {
      return `Cell ${row},${col} contains ${cell}`;
    }

    if (this.suggestedMove === index && this.showHint) {
      return `Suggested move: Cell ${row},${col}`;
    }

    return `Empty cell at position ${row},${col}`;
  }

  getBoardAriaLabel(): string {
    const state = this.gameService.gameState;

    switch (state) {
      case GameState.Playing:
        return `Tic Tac Toe game in progress. Current player: ${this.gameService.currentPlayer}`;
      case GameState.Won:
        return `Tic Tac Toe game completed. Player ${this.gameService.winner} wins!`;
      case GameState.Draw:
        return "Tic Tac Toe game completed. The game is a draw.";
      default:
        return "Tic Tac Toe game board";
    }
  }

   
  logOut() {
    console.log("Signing out");
    GoogleSignin.signOut();
   this.router.navigate(["signin"]);
    
  }

   private loadGoogleUserInfo(): void {
    try {
      this.authService.user$.subscribe({
        next: (data: AuthenticatedUserResponse) => {
          console.log("✅ Google user info:", data);
          this.userInfo = data;
        },
        error: (err: unknown) => {
          console.error("❌ Error fetching Google user info:", err);
        },
      });
    } catch (error: unknown) {
      console.error("⚠️ Unable to get Google user info:", error);
    }
  }
 
  goBack() {
    this.routerExtensions.back();
  }



}
