import { Component, ElementRef, ViewChild, Input } from "@angular/core";
import {
  GridLayout,
  Label,
  Screen,
  Animation,
  AnimationDefinition,
  Color,
} from "@nativescript/core";

@Component({
  standalone: false,
  selector: "Confetti",
  template: `
    <GridLayout #confettiContainer
                height="100%"
                width="100%"
                verticalAlignment="stretch"
                horizontalAlignment="stretch"
                backgroundColor="transparent"
                [isUserInteractionEnabled]="false">
    </GridLayout>
  `,
})
export class ConfettiComponent {
  @ViewChild("confettiContainer", { static: false })
  confettiContainer!: ElementRef<GridLayout>;

  // 🌈 Configurable Inputs
  @Input() particleCount = 5000;
  @Input() duration = 2500;
  @Input() burstCount = 3;
  @Input() burstInterval = 300;
  @Input() colors: string[] = [
     "#FF0066",  // Neon Pink
    "#00FFFF",  // Cyan Glow
    "#FFFF00",  // Electric Yellow
    "#00FF00",  // Neon Green
    "#FF00FF",  // Magenta Glow
    "#FF6600",  // Bright Orange
    "#0099FF",  // Electric Blue
    "#FF0099",  // Hot Pink
    "#66FF00",  // Lime Glow
    "#9933FF",  // Purple Neon
  ];

  async trigger(): Promise<void> {
    const container = this.confettiContainer?.nativeElement;
    if (!container) {
      console.log("⚠️ Confetti container not found");
      return;
    }

    console.log("🎉 Starting confetti animation");

    for (let i = 0; i < this.burstCount; i++) {
      this.emitConfetti(container);
      await this.delay(this.burstInterval);
    }

    // Clean up after all bursts complete
    setTimeout(() => {
      container.removeChildren();
      console.log("🧹 Confetti cleaned up");
    }, this.duration * 3);
  }

  // 🎉 Single Burst
  private emitConfetti(container: GridLayout): void {

    const screenWidth = Screen.mainScreen.widthDIPs;
    const screenHeight = Screen.mainScreen.heightDIPs;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 3;

    const animations: AnimationDefinition[] = [];

    for (let i = 0; i < this.particleCount; i++) {
      const particle = new Label();

      // Random shape + color
      particle.text = this.randomShape();
      particle.color = new Color(this.randomColor());
      particle.fontSize = Math.random() * 16 + 12;

      // ✅ CRITICAL: Positioning properties
      particle.horizontalAlignment = "left";
      particle.verticalAlignment = "top";
      particle.width = 40;
      particle.height = 40;
      particle.textAlignment = "center";

      // Start position (center of screen)
      particle.translateX = centerX - 20; // offset by half width
      particle.translateY = centerY - 20; // offset by half height
      particle.opacity = 1;

      container.addChild(particle);

      // Random trajectory
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 0.5 + 0.5; // 0.5 to 1
      const distanceX = Math.cos(angle) * screenWidth * velocity;
      const distanceY = Math.sin(angle) * screenHeight * velocity + screenHeight * 0.3; // gravity effect
      const rotate = Math.random() * 1080 - 540; // multiple spins

      animations.push({
        target: particle,
        translate: {
          x: centerX + distanceX - 20,
          y: centerY + distanceY - 20,
        },
        rotate,
        opacity: 0,
        duration: this.duration + Math.random() * 1000,
        curve: "easeInOut",
      });
    }

    const animationSet = new Animation(animations, false);
    animationSet.play().catch((err) => {
      console.log("Animation error:", err);
    });
  }

  // 🕒 Helper Delay
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private randomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  private randomShape(): string {
    const shapes = ["●", "▲", "■", "★", "◆", "♦", "✦", "✶", "✷", "✸", "✹", "✺",
      "❋", "❊", "❉", "⬟", "⬢",
      "⬣", "⬡", "◉", "◈", "⭐"];
    return shapes[Math.floor(Math.random() * shapes.length)];
  }
}