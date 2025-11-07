import {
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  OnInit,
  Input,
} from "@angular/core";
import { GameService, GameState } from "./game.service";
import { GameSocketService, ConnectionStatus } from "./game-socket.service";
import { AnimationDefinition, Label } from "@nativescript/core";
import { GameMode } from "./game.component";
 


@Component({
  selector: "game-header",
  template: `
   <StackLayout 
  marginBottom="14" 
  horizontalAlignment="center" 
  verticalAlignment="top">
  
  <Label 
    #statusLabel
    [text]="getStatusMessage()" 
    [color]="statusColor"
    [fontSize]="statusFontSize"
    fontWeight="600"
    textAlignment="center"
  
    minHeight="32"
    [accessibilityLabel]="getStatusMessage()"
    (loaded)="onStatusLabelLoaded($event)">
  </Label>
         
 
</StackLayout>
  `,
})
export class GameHeaderComponent implements OnInit, OnDestroy, OnChanges {
  @Input() currentMode: GameMode = GameMode.Offline;
  @Input() opponentConnected: boolean = false;
  @Input() mySymbol: string = 'X';

  @ViewChild('statusLabel', { static: false }) statusLabel?: ElementRef<Label>;

  GameState = GameState;
  
  // Dynamic styling properties
  statusColor: string = '#FFFFFF';
  statusFontSize: number = 20;
  subtitleColor: string = 'rgba(255, 255, 255, 0.85)';
  
  private animationCancellers: Array<() => void> = [];
  private isAnimating: boolean = false;

 

  constructor(
    public gameService: GameService,
    public gameSocketService: GameSocketService
  ) {}

  ngOnInit(): void {
    this.updateStyling();
  }

  ngOnDestroy(): void {
    this.cleanupAnimations();
  }

  ngOnChanges(): void {
    this.updateStyling();
    this.updateAnimations();
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
    // Add your subtitle logic here
    return '';
  }

  onStatusLabelLoaded(args: any): void {
    const label = args.object as Label;
    this.updateStyling();
    this.startAnimation(label);
  }

  private updateStyling(): void {
    const state = this.gameService.gameState;

    switch (state) {
      case GameState.Playing:
         this.statusFontSize = 20;
        break;
      case GameState.Won:
         this.statusFontSize = 22;
        break;
      case GameState.Draw:
         this.statusFontSize = 20;
        break;
      default:
         this.statusFontSize = 20;
    }
  }

  private updateAnimations(): void {
    this.cleanupAnimations();
  }

  private startAnimation(label: Label): void {
    const state = this.gameService.gameState;

    switch (state) {
      case GameState.Playing:
        this.startPulseAnimation(label);
        break;
      case GameState.Won:
        this.startCelebrateAnimation(label);
        break;
      case GameState.Draw:
        this.startBounceAnimation(label);
        break;
    }
  }

  private startPulseAnimation(label: Label): void {
    this.isAnimating = true;
    
    const pulse = () => {
      if (!this.isAnimating || this.gameService.gameState !== GameState.Playing) {
        return;
      }

      label.animate({
        opacity: 0.7,
        scale: { x: 0.98, y: 0.98 },
        duration: 1000,
        curve: 'easeInOut'
      }).then(() => {
        if (!this.isAnimating || this.gameService.gameState !== GameState.Playing) {
          return;
        }

        label.animate({
          opacity: 1,
          scale: { x: 1, y: 1 },
          duration: 1000,
          curve: 'easeInOut'
        }).then(() => {
          pulse();
        }).catch(() => {});
      }).catch(() => {});
    };

    pulse();
  }

  private startCelebrateAnimation(label: Label): void {
    this.isAnimating = true;

    const animations = [
      { scale: { x: 1.2, y: 1.2 }, opacity: 1, duration: 200, curve: 'easeOut' },
      { scale: { x: 0.9, y: 0.9 }, duration: 200, curve: 'easeIn' },
      { scale: { x: 1.1, y: 1.1 }, duration: 200, curve: 'easeOut' },
      { scale: { x: 1, y: 1 }, duration: 200, curve: 'easeInOut' }
    ];

    const playSequence = async (index: number) => {
      if (!this.isAnimating || index >= animations.length) {
        return;
      }

      try {
        await label.animate(animations[index]);
        await playSequence(index + 1);
      } catch (error) {
        // Animation cancelled
      }
    };

    playSequence(0);
  }

  private startBounceAnimation(label: Label): void {
    this.isAnimating = true;

    const animations = [
      { translate: { x: 0, y: -15 }, duration: 150, curve: 'easeOut' },
      { translate: { x: 0, y: 0 }, duration: 150, curve: 'easeOut' },
      { translate: { x: 0, y: -8 }, duration: 100, curve: 'easeOut' },
      { translate: { x: 0, y: 0 }, duration: 100, curve: 'easeIn' }
    ];

    const playSequence = async (index: number) => {
      if (!this.isAnimating || index >= animations.length) {
        return;
      }

      try {
        await label.animate(animations[index]);
        await playSequence(index + 1);
      } catch (error) {
        // Animation cancelled
      }
    };

    playSequence(0);
  }

  private cleanupAnimations(): void {
    this.isAnimating = false;
    
    // Execute all cancellation functions
    this.animationCancellers.forEach(cancel => {
      try {
        cancel();
      } catch (error) {
        // Ignore cancellation errors
      }
    });
    
    // Clear the cancellers array
    this.animationCancellers = [];
  }
}