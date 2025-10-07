import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { filter, takeUntil } from 'rxjs/operators';

export interface GameState {
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

interface ServerMessage {
  event: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class GameSocketService implements OnDestroy {
  private socket$?: WebSocketSubject<ServerMessage>;
  private destroy$ = new Subject<void>();

  private gameState = new BehaviorSubject<GameState | null>(null);
  public gameState$ = this.gameState.asObservable();

  private connected = false;

  constructor() {}

  /** Connect to server and authenticate with token */
  connect(userToken: string): void {
    if (this.connected) return;

    // WebSocket endpoint (Phoenix compatible backend must accept standard JSON)
    this.socket$ = webSocket<ServerMessage>({
      url: `ws://localhost:4000/socket/websocket?token=${userToken}`,
      deserializer: e => JSON.parse(e.data),
      serializer: value => JSON.stringify(value),
      openObserver: { next: () => console.log('✅ WebSocket connected') },
      closeObserver: { next: () => console.log('❌ WebSocket disconnected') }
    });

    // Listen for messages
    this.socket$
      .pipe(
        filter((msg): msg is ServerMessage => !!msg),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (msg) => this.handleServerMessage(msg),
        error: (err) => console.error('WebSocket error:', err),
        complete: () => console.log('WebSocket completed')
      });

    this.connected = true;
  }

  /** Send messages to server */
  private send(event: string, payload?: any) {
    if (!this.socket$) return console.warn('Socket not connected');
    this.socket$.next({ event, payload });
  }

  /** Handle messages from server */
  private handleServerMessage(msg: ServerMessage) {
    switch (msg.event) {
      case 'joined_game':
        console.log('Joined game successfully', msg.payload);
        this.gameState.next(msg.payload.game);
        break;
      case 'game_state':
        this.gameState.next(msg.payload.game);
        break;
      case 'move_result':
        this.gameState.next(msg.payload.game);
        break;
      case 'error':
        console.error('Server error:', msg.payload);
        break;
      case 'reset':
        this.gameState.next(msg.payload.game);
        break;
      default:
        console.warn('Unknown event:', msg);
        break;
    }
  }

  /** Create or join a game by ID */
  createOrJoinGame(gameId: string) {
    this.send('join_game', { game_id: gameId });
  }

  /** Join as player X or O */
  joinAsPlayer(player: 'X' | 'O') {
    this.send('join_as_player', { player });
  }

  /** Make a move on the board */
  makeMove(position: number) {
    this.send('make_move', { position });
  }

  /** Reset the game */
  resetGame() {
    this.send('reset_game');
  }

  /** Leave the game */
  leaveGame() {
    this.send('leave_game');
    this.gameState.next(null);
  }

  /** Generate random game ID for new games */
  generateGameId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socket$?.complete();
  }
}
