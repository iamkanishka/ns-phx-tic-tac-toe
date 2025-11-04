import {
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  OnInit,
} from "@angular/core";
import { GameService, GameState } from "./game.service";
import { GameSocketService, ConnectionStatus } from "./game-socket.service";

@Component({
  selector: "game-header",
  template: `
    <StackLayout marginBottom="24" horizontalAlignment="center">
      <Label
        #statusLabel
        [text]="getStatusMessage()"
        class="status-message"
        color="white"
      ></Label>
    </StackLayout>
  `,
})
export class GameHeaderComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild("statusLabel", { static: true }) statusLabel!: ElementRef;

  private pulseRunning = false;
  private isAnimating = false;
  private connectionSub: any;

  constructor(
    public gameService: GameService,
    private gameSocketService: GameSocketService
  ) {}

  // =========================
  // 🌐 INIT
  // =========================
  ngOnInit() {
    // Listen for online/offline or connection status changes
    this.connectionSub = this.gameSocketService.connectionStatus$.subscribe(
      (status) => {
        if (status === ConnectionStatus.Connected) {
          this.stopAllAnimations();
          this.playStateAnimation();
        } else {
          this.stopAllAnimations(); // stop animations if disconnected
        }
      }
    );
  }

  ngAfterViewInit() {
    this.playStateAnimation();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["gameService"]) {
      this.playStateAnimation();
    }
  }

  ngOnDestroy() {
    this.stopAllAnimations();
    if (this.connectionSub) this.connectionSub.unsubscribe();
  }

  // =========================
  // 🧩 MESSAGE
  // =========================
  getStatusMessage(): string {
    switch (this.gameService.gameState) {
      case GameState.Playing:
        return this.isOnlineMode()
          ? "Online Match in Progress"
          : "Game in Progress";
      case GameState.Won:
        return "You Won!";
      case GameState.Draw:
        return "It's a Draw!";
      default:
        return "";
    }
  }

  private isOnlineMode(): boolean {
    return this.gameSocketService.isConnected();
  }

  // =========================
  // 🎬 MAIN ANIMATION CONTROLLER
  // =========================
  private playStateAnimation() {
    const label = this.statusLabel?.nativeElement;
    if (!label) return;

    this.stopAllAnimations();

    switch (this.gameService.gameState) {
      case GameState.Playing:
        this.startPulseAnimation(label);
        break;
      case GameState.Won:
        this.playCelebrateAnimation(label);
        break;
      case GameState.Draw:
        this.playBounceAnimation(label);
        break;
    }
  }

  // =========================
  // 🧹 STOP & RESET
  // =========================
  private stopAllAnimations() {
    this.pulseRunning = false;
    this.isAnimating = false;
    const label = this.statusLabel?.nativeElement;
    if (label) {
      label.cancelAllAnimation();
      label.scaleX = 1;
      label.scaleY = 1;
      label.opacity = 1;
      label.translateY = 0;
      label.rotate = 0;
    }
  }

  // =========================
  // 🔵 PLAYING → Pulse Loop
  // =========================
  private startPulseAnimation(view) {
    this.pulseRunning = true;

    const animatePulse = async () => {
      if (!this.pulseRunning || this.gameService.gameState !== GameState.Playing)
        return;

      try {
        await view.animate({
          scale: { x: 1.2, y: 1.2 },
          opacity: 0.85,
          duration: 700,
          curve: "easeInOut",
        });

        await view.animate({
          scale: { x: 1, y: 1 },
          opacity: 1,
          duration: 700,
          curve: "easeInOut",
        });

        requestAnimationFrame(animatePulse);
      } catch {
        // Animation interrupted — safe to ignore
      }
    };

    animatePulse();
  }

  // =========================
  // 🟢 WON → Celebrate
  // =========================
  private playCelebrateAnimation(view) {
    this.isAnimating = true;
    view
      .animate({
        scale: { x: 1.4, y: 1.4 },
        rotate: 15,
        duration: 300,
        curve: "easeInOut",
      })
      .then(() =>
        view.animate({
          scale: { x: 1, y: 1 },
          rotate: -15,
          duration: 300,
          curve: "easeInOut",
        })
      )
      .then(() =>
        view.animate({
          rotate: 0,
          duration: 200,
        })
      )
      .finally(() => (this.isAnimating = false));
  }

  // =========================
  // 🟡 DRAW → Bounce
  // =========================
  private playBounceAnimation(view) {
    this.isAnimating = true;
    view
      .animate({
        translate: { x: 0, y: -15 },
        duration: 200,
        curve: "easeOut",
      })
      .then(() =>
        view.animate({
          translate: { x: 0, y: 0 },
          duration: 200,
          curve: "easeIn",
        })
      )
      .then(() =>
        view.animate({
          translate: { x: 0, y: -8 },
          duration: 150,
          curve: "easeOut",
        })
      )
      .then(() =>
        view.animate({
          translate: { x: 0, y: 0 },
          duration: 150,
          curve: "easeIn",
        })
      )
      .finally(() => (this.isAnimating = false));
  }
}
