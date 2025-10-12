import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { Socket } from "phoenix";
import { Http, HttpResponse, HttpRequestOptions } from "@nativescript/core";
 
export interface MultiplayerGameState {
  id: string;
  cells: string[];
  status: "waiting" | "playing" | "won" | "draw";
  current_player: "X" | "O";
  winner: "X" | "O" | null;
  winning_line: number[] | null;
  player_x: { id: string; name: string } | null;
  player_o: { id: string; name: string } | null;
  moves_count: number;
}

export interface WaitingGame {
  id: string;
  player_x_name: string;
  status: string;
  created_at: string;
}

export enum ConnectionStatus {
  Disconnected = "disconnected",
  Connecting = "connecting",
  Connected = "connected",
  Error = "error",
}

@Injectable({
  providedIn: "root",
})
export class GameSocketService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private socket: Socket | null = null;
  private channel: any = null;

  // Configuration
  private readonly BASE_URL = "https://lk3fddm2-4000.inc1.devtunnels.ms";
  private readonly WS_URL = "wss://lk3fddm2-4000.inc1.devtunnels.ms/socket";

  // Observables
  private gameStateSubject = new BehaviorSubject<MultiplayerGameState | null>(
    null
  );
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>(
    ConnectionStatus.Disconnected
  );
  private errorSubject = new BehaviorSubject<string | null>(null);
  private myPlayerSymbolSubject = new BehaviorSubject<"X" | "O" | null>(null);
  private opponentConnectedSubject = new BehaviorSubject<boolean>(false);

  public gameState$ = this.gameStateSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public myPlayerSymbol$ = this.myPlayerSymbolSubject.asObservable();
  public opponentConnected$ = this.opponentConnectedSubject.asObservable();

  constructor() {}

  ngOnDestroy(): void {
    this.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================================
  // Centralized HTTP handler
  // ========================================================
  private async handleRequest<T>(options: HttpRequestOptions): Promise<T> {
    try {
      const response: HttpResponse = await Http.request(options);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(
          `HTTP ${response.statusCode}: ${response.content?.toString()}`
        );
      }

      return response.content.toJSON() as T;
    } catch (error: any) {
      console.error("HTTP Request failed:", error);
      this.errorSubject.next(error.message || "Network request failed");
      throw error;
    }
  }

  // ========================================================
  // CREATE GAME
  // ========================================================
  async createGame(playerId: string, playerName: string): Promise<string> {
    const payload = { player_id: playerId, player_name: playerName };

    const data = await this.handleRequest<{ id: string }>({
      url: `${this.BASE_URL}/api/games`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      content: JSON.stringify(payload),
    });

    console.log(data);

    await this.connectToGame(data.id, playerId, playerName);
    this.myPlayerSymbolSubject.next("X");
    return data.id;
  }

  // ========================================================
  // GET WAITING GAMES
  // ========================================================
  async getWaitingGames(): Promise<WaitingGame[]> {
    return await this.handleRequest<WaitingGame[]>({
      url: `${this.BASE_URL}/api/games/waiting`,
      method: "GET",
      headers: { Accept: "application/json" },
    });
  }

  // ========================================================
  // JOIN GAME
  // ========================================================
  async joinGame(
    gameId: string,
    playerId: string,
    playerName: string
  ): Promise<void> {
    await this.connectToGame(gameId, playerId, playerName);
    this.myPlayerSymbolSubject.next("O");

    if (this.channel) {
      this.channel
        .push("join_game", {})
        .receive("ok", (response: any) => {
          console.log("Joined game successfully:", response);
          this.updateGameState(response);
        })
        .receive("error", (error: any) => {
          console.error("Failed to join game:", error);
          this.errorSubject.next(`Failed to join: ${error.reason}`);
        });
    }
  }

  // ========================================================
  // SOCKET CONNECTION
  // ========================================================
  private async connectToGame(
    gameId: string,
    playerId: string,
    playerName: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.connectionStatusSubject.next(ConnectionStatus.Connecting);
        this.disconnect();

        this.socket = new Socket(this.WS_URL, {
          transport: globalThis.WebSocket, // 👈 Force WebSocket, skip longpoll
          params: { player_id: playerId, player_name: playerName },
        });

        this.socket.connect();

        this.channel = this.socket.channel(`game:${gameId}`, {});
        this.setupChannelListeners();

        this.channel
          .join()
          .receive("ok", (response: any) => {
            console.log("Joined game channel successfully:", response);
            this.connectionStatusSubject.next(ConnectionStatus.Connected);
            this.updateGameState(response);
            resolve();
          })
          .receive("error", (error: any) => {
            console.error("Failed to join channel:", error);
            this.connectionStatusSubject.next(ConnectionStatus.Error);
            this.errorSubject.next("Failed to join game channel");
            reject(error);
          });
      } catch (error) {
        this.connectionStatusSubject.next(ConnectionStatus.Error);
        reject(error);
      }
    });
  }

  private setupChannelListeners(): void {
    if (!this.channel) return;

    this.channel.on("game_state", (game: MultiplayerGameState) => {
      console.log("Received game state:", game);
      this.updateGameState(game);
    });

    this.channel.on("game_started", (game: MultiplayerGameState) => {
      console.log("Game started:", game);
      this.opponentConnectedSubject.next(true);
      this.updateGameState(game);
    });

    this.channel.on("move_made", (response: any) => {
      console.log("Move made:", response);
      this.updateGameState(response);
    });
  }

  private updateGameState(data: any): void {
    const game: MultiplayerGameState = data;
    this.gameStateSubject.next(game);
    if (game.player_o) {
      this.opponentConnectedSubject.next(true);
    }
  }

  // ========================================================
  // GAME MOVES
  // ========================================================
  makeMove(position: number): void {
    if (!this.channel) {
      this.errorSubject.next("Not connected to game");
      return;
    }

    const currentGame = this.gameStateSubject.value;
    if (!currentGame) {
      this.errorSubject.next("No active game");
      return;
    }

    if (!this.isMyTurn()) {
      this.errorSubject.next("Not your turn");
      return;
    }

    if (currentGame.cells[position] !== "") {
      this.errorSubject.next("Position already taken");
      return;
    }

    this.channel
      .push("make_move", { index: position })
      .receive("ok", (response: any) => {
        console.log("Move accepted:", response);
        this.errorSubject.next(null);
      })
      .receive("error", (error: any) => {
        console.error("Move rejected:", error);
        this.errorSubject.next(error.reason || "Move failed");
      });
  }

  // ========================================================
  // HELPERS
  // ========================================================
  isMyTurn(): boolean {
    const game = this.gameStateSubject.value;
    const mySymbol = this.myPlayerSymbolSubject.value;
    return !!(
      game &&
      mySymbol &&
      game.status === "playing" &&
      game.current_player === mySymbol
    );
  }

  getCurrentGameState(): MultiplayerGameState | null {
    return this.gameStateSubject.value;
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.leave();
      this.channel = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionStatusSubject.next(ConnectionStatus.Disconnected);
    this.opponentConnectedSubject.next(false);
    this.gameStateSubject.next(null);
    this.myPlayerSymbolSubject.next(null);
    this.errorSubject.next(null);
  }

  isConnected(): boolean {
    return this.connectionStatusSubject.value === ConnectionStatus.Connected;
  }

  generatePlayerId(): string {
    return (
      "player_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now()
    );
  }
}
