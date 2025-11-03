import { Injectable } from "@angular/core";
import { View, Color } from "@nativescript/core";
import { AnimationDefinition } from "@nativescript/core/ui/animation/animation-interfaces";

@Injectable({
  providedIn: "root",
})
export class AnimationService {
  // ============================================================
  // ⚙️ Speed Settings
  // ============================================================
  private settings = {
    animationSpeed: "normal" as "fast" | "normal" | "slow",
  };

  setAnimationSpeed(speed: "fast" | "normal" | "slow") {
    this.settings.animationSpeed = speed;
  }

  private getAnimationSpeed(): number {
    const speeds = {
      fast: 100,
      normal: 200,
      slow: 400,
    };
    return speeds[this.settings.animationSpeed];
  }

  // ============================================================
  // 🧩 Utility
  // ============================================================
  private isViewAlive(view: View): boolean {
    return !!view && !!view.nativeViewProtected && view.isLoaded;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================
  // 🟦 Basic Pop Animation (when a move is made)
  // ============================================================
  async cellPop(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    const speed = this.getAnimationSpeed();
    try {
      await view.animate({
        scale: { x: 0.01, y: 0.01 },
        rotate: -180,
        duration: 1,
      });
      await view.animate({
        scale: { x: 1.2, y: 1.2 },
        rotate: 10,
        duration: speed,
        curve: "easeOut",
      });
      await view.animate({
        scale: { x: 1, y: 1 },
        rotate: 0,
        duration: speed * 0.75,
        curve: "easeIn",
      });
    } catch (err) {
      console.error("[AnimationService] cellPop failed:", err);
    }
  }

  // ============================================================
  // ✨ Winning Cell Pulse (soft bounce)
  // ============================================================
  async winningCellAnimation(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    const speed = this.getAnimationSpeed();
    try {
      for (let i = 0; i < 3; i++) {
        await view.animate({
          scale: { x: 1.15, y: 1.15 },
          duration: speed * 1.5,
          curve: "easeInOut",
        });
        await view.animate({
          scale: { x: 1, y: 1 },
          duration: speed * 1.5,
          curve: "easeInOut",
        });
      }
    } catch (err) {
      console.error("[AnimationService] winningCellAnimation failed:", err);
    }
  }

  // ============================================================
  // 💥 Shake Animation
  // ============================================================
  async shakeAnimation(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    const speed = this.getAnimationSpeed() / 4;
    try {
      const positions = [-12, 12, -8, 8, 0];
      for (const x of positions) {
        await view.animate({ translate: { x, y: 0 }, duration: speed });
      }
    } catch (err) {
      console.error("[AnimationService] shakeAnimation failed:", err);
    }
  }

  // ============================================================
  // 🔁 Multi-Cell Ripple / Shake (Winning Line Wave)
  // ============================================================
  async multiCellShake(views: View[], speedSetting?: "fast" | "normal" | "slow"): Promise<void> {
    const speed = speedSetting
      ? { fast: 100, normal: 200, slow: 400 }[speedSetting]
      : this.getAnimationSpeed();

    if (!views || views.length === 0) return;

    try {
      for (let i = 0; i < views.length; i++) {
        const v = views[i];
        if (!this.isViewAlive(v)) continue;
        this.shakeAnimation(v); // run asynchronously
        await this.sleep(speed * 0.3); // staggered delay for wave effect
      }
    } catch (err) {
      console.error("[AnimationService] multiCellShake failed:", err);
    }
  }

  // ============================================================
  // 🎊 Confetti-Like Spin and Glow
  // ============================================================
  async confettiAnimation(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    const speed = this.getAnimationSpeed() * 4;
    try {
      const originalColor = view.backgroundColor;
      view.backgroundColor = new Color("#FFD700"); // gold glow
      await view.animate({
        rotate: 360,
        scale: { x: 1.3, y: 1.3 },
        duration: speed,
        curve: "spring",
      });
      await view.animate({
        rotate: 0,
        scale: { x: 1, y: 1 },
        duration: speed * 0.5,
        curve: "easeOut",
      });
      view.backgroundColor = originalColor;
    } catch (err) {
      console.error("[AnimationService] confettiAnimation failed:", err);
    }
  }

  // ============================================================
  // 🎇 Celebrate Win (shake + glow + confetti)
  // ============================================================
  async celebrateWin(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    try {
      await this.glowPulse(view);
      await this.shakeAnimation(view);
      await this.confettiAnimation(view);
    } catch (err) {
      console.error("[AnimationService] celebrateWin failed:", err);
    }
  }

  // ============================================================
  // 💡 Glow Pulse
  // ============================================================
  private async glowPulse(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    const speed = this.getAnimationSpeed();
    try {
      const originalOpacity = view.opacity;
      for (let i = 0; i < 3; i++) {
        await view.animate({
          opacity: 0.5,
          duration: speed,
          curve: "easeInOut",
        });
        await view.animate({
          opacity: originalOpacity,
          duration: speed,
          curve: "easeInOut",
        });
      }
    } catch (err) {
      console.error("[AnimationService] glowPulse failed:", err);
    }
  }

  // ============================================================
  // 🩵 Slide In for UI Panels
  // ============================================================
  async slideIn(view: View, fromTop = true): Promise<void> {
    if (!this.isViewAlive(view)) return;
    const speed = this.getAnimationSpeed() * 2;
    try {
      const startY = fromTop ? -120 : 120;
      view.translateY = startY;
      view.opacity = 0;
      await view.animate({
        translate: { x: 0, y: 0 },
        opacity: 1,
        duration: speed,
        curve: "easeOut",
      });
    } catch (err) {
      console.error("[AnimationService] slideIn failed:", err);
    }
  }

  // ============================================================
  // 🌫️ Simple Fade In
  // ============================================================
  async fadeIn(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    const speed = this.getAnimationSpeed();
    try {
      view.opacity = 0;
      await view.animate({ opacity: 1, duration: speed * 1.5 });
    } catch (err) {
      console.error("[AnimationService] fadeIn failed:", err);
    }
  }
 

   async animateHint(view: View): Promise<void> {
  if (!view || !view.isLoaded) return;

  try {
    for (let i = 0; i < 3; i++) {
      await view.animate({
        opacity: 0.6,
        scale: { x: 1.2, y: 1.2 },
        duration: 300,
        curve: "easeInOut",
      });

      await view.animate({
        opacity: 1,
        scale: { x: 1, y: 1 },
        duration: 300,
        curve: "easeInOut",
      });

      // Optional small pause between pulses
      await new Promise((resolve) => setTimeout(resolve, 80));

      // Stop early if view unloaded
      if (!view.isLoaded) break;
    }
  } catch (err) {
    console.error("[AnimationService] animateHint failed:", err);
  }
}




}
