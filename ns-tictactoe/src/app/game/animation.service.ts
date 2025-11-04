import { Injectable, OnDestroy } from "@angular/core";
import { View, Color } from "@nativescript/core";

interface AnimationState {
  view: View;
  startTime: number;
  isActive: boolean;
}

@Injectable({
  providedIn: "root",
})
export class AnimationService implements OnDestroy {
  // ============================================================
  // ⚙️ Speed Settings
  // ============================================================
  private settings = {
    animationSpeed: "normal" as "fast" | "normal" | "slow",
  };

  // Reusable speed map to avoid object recreation
  private readonly SPEED_MAP = {
    fast: 100,
    normal: 200,
    slow: 400,
  } as const;

  // Track active animations for cleanup
  private activeAnimations = new Map<number, AnimationState>();
  private animationIdCounter = 0;

  // Reusable animation options objects
  private readonly animationCache = {
    scaleReset: Object.freeze({ scale: { x: 1, y: 1 } }),
    translateReset: Object.freeze({ translate: { x: 0, y: 0 } }),
    opacityFull: Object.freeze({ opacity: 1 }),
  };

  // Reusable Color instances
  private readonly GOLD_COLOR = new Color("#FFD700");

  // Garbage collection interval
  private gcInterval?: ReturnType<typeof setInterval>;
  private readonly GC_INTERVAL_MS = 10000; // Run GC every 10 seconds
  private readonly MAX_ANIMATION_AGE_MS = 30000; // Max 30 seconds per animation

  constructor() {
    this.startGarbageCollection();
  }

  ngOnDestroy(): void {
    this.stopGarbageCollection();
    this.cleanup();
  }

  setAnimationSpeed(speed: "fast" | "normal" | "slow"): void {
    this.settings.animationSpeed = speed;
  }

  private getAnimationSpeed(): number {
    return this.SPEED_MAP[this.settings.animationSpeed];
  }

  // ============================================================
  // 🗑️ Garbage Collection
  // ============================================================
  private startGarbageCollection(): void {
    if (this.gcInterval) return;
    
    this.gcInterval = setInterval(() => {
      this.collectGarbage();
    }, this.GC_INTERVAL_MS);
  }

  private stopGarbageCollection(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = undefined;
    }
  }

  private collectGarbage(): void {
    const now = Date.now();
    const toDelete: number[] = [];
    
    for (const [id, state] of this.activeAnimations) {
      // Check if view is destroyed
      const isViewDead = !this.isViewAlive(state.view);
      
      // Check if animation has been running too long (stuck)
      const age = now - state.startTime;
      const isTooOld = age > this.MAX_ANIMATION_AGE_MS;
      
      // Check if animation completed
      const isCompleted = !state.isActive;
      
      if (isViewDead || isTooOld || isCompleted) {
        toDelete.push(id);
      }
    }

    // Clean up dead/old animations
    let cleaned = 0;
    toDelete.forEach(id => {
      if (this.activeAnimations.delete(id)) {
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`[AnimationService] GC: Cleaned ${cleaned} animations. Active: ${this.activeAnimations.size}`);
    }
  }

  // Force garbage collection manually
  forceGarbageCollection(): void {
    this.collectGarbage();
  }

  // ============================================================
  // 🧩 Utility
  // ============================================================
  private isViewAlive(view: View | null | undefined): view is View {
    try {
      return !!view?.nativeViewProtected && !!view.isLoaded;
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private registerAnimation(view: View): number {
    const id = ++this.animationIdCounter;
    this.activeAnimations.set(id, {
      view,
      startTime: Date.now(),
      isActive: true,
    });
    return id;
  }

  private unregisterAnimation(id: number): void {
    const state = this.activeAnimations.get(id);
    if (state) {
      state.isActive = false;
    }
    // Don't delete immediately - let GC handle it
  }

  private async safeAnimate(
    view: View,
    animationFn: () => Promise<void>
  ): Promise<void> {
    const id = this.registerAnimation(view);
    
    try {
      await animationFn();
    } catch (err) {
      console.error("[AnimationService] Animation error:", err);
    } finally {
      this.unregisterAnimation(id);
    }
  }

  cleanup(): void {
    this.stopGarbageCollection();
    this.activeAnimations.clear();
    console.log("[AnimationService] Cleanup completed");
  }

  // Cancel animations for a specific view
  cancelAnimationsForView(view: View): void {
    let cancelled = 0;
    
    for (const [id, state] of this.activeAnimations) {
      if (state.view === view) {
        state.isActive = false;
        cancelled++;
      }
    }
    
    if (cancelled > 0) {
      console.log(`[AnimationService] Cancelled ${cancelled} animations for view`);
    }
  }

  // Get animation statistics (useful for debugging)
  getStats(): { 
    activeAnimations: number; 
    viewsTracked: number;
    oldestAnimationAge: number;
  } {
    const now = Date.now();
    let oldestAge = 0;
    const uniqueViews = new Set();

    for (const state of this.activeAnimations.values()) {
      if (state.isActive) {
        uniqueViews.add(state.view);
        const age = now - state.startTime;
        if (age > oldestAge) oldestAge = age;
      }
    }

    return {
      activeAnimations: this.activeAnimations.size,
      viewsTracked: uniqueViews.size,
      oldestAnimationAge: Math.round(oldestAge / 1000), // in seconds
    };
  }

  // ============================================================
  // 🟦 Basic Pop Animation (when a move is made)
  // ============================================================
  async cellPop(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    
    return this.safeAnimate(view, async () => {
      const speed = this.getAnimationSpeed();
      
      await view.animate({
        scale: { x: 0.01, y: 0.01 },
        rotate: -180,
        duration: 1,
      });
      
      if (!this.isViewAlive(view)) return;
      
      await view.animate({
        scale: { x: 1.2, y: 1.2 },
        rotate: 10,
        duration: speed,
        curve: "easeOut",
      });
      
      if (!this.isViewAlive(view)) return;
      
      await view.animate({
        ...this.animationCache.scaleReset,
        rotate: 0,
        duration: speed * 0.75,
        curve: "easeIn",
      });
    });
  }

  // ============================================================
  // ✨ Winning Cell Pulse (soft bounce)
  // ============================================================
  async winningCellAnimation(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    
    return this.safeAnimate(view, async () => {
      const speed = this.getAnimationSpeed();
      const duration = speed * 1.5;
      
      for (let i = 0; i < 3; i++) {
        if (!this.isViewAlive(view)) break;
        
        await view.animate({
          scale: { x: 1.15, y: 1.15 },
          duration,
          curve: "easeInOut",
        });
        
        if (!this.isViewAlive(view)) break;
        
        await view.animate({
          ...this.animationCache.scaleReset,
          duration,
          curve: "easeInOut",
        });
      }
    });
  }

  // ============================================================
  // 💥 Shake Animation
  // ============================================================
  async shakeAnimation(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    
    return this.safeAnimate(view, async () => {
      const speed = this.getAnimationSpeed() / 4;
      const positions = [-12, 12, -8, 8, 0];
      
      for (const x of positions) {
        if (!this.isViewAlive(view)) break;
        await view.animate({ translate: { x, y: 0 }, duration: speed });
      }
    });
  }

  // ============================================================
  // 🔁 Multi-Cell Ripple / Shake (Winning Line Wave)
  // ============================================================
  async multiCellShake(
    views: View[],
    speedSetting?: "fast" | "normal" | "slow"
  ): Promise<void> {
    if (!views?.length) return;
    
    const speed = speedSetting
      ? this.SPEED_MAP[speedSetting]
      : this.getAnimationSpeed();
    
    const delay = speed * 0.3;
    
    for (let i = 0; i < views.length; i++) {
      const v = views[i];
      if (!this.isViewAlive(v)) continue;
      
      // Fire and forget individual shake
      this.shakeAnimation(v).catch(() => {});
      await this.sleep(delay);
    }
  }

  // ============================================================
  // 🎊 Confetti-Like Spin and Glow
  // ============================================================
  async confettiAnimation(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    
    return this.safeAnimate(view, async () => {
      const speed = this.getAnimationSpeed() * 4;
      const originalColor = view.backgroundColor;
      
      try {
        view.backgroundColor = this.GOLD_COLOR;
        
        await view.animate({
          rotate: 360,
          scale: { x: 1.3, y: 1.3 },
          duration: speed,
          curve: "spring",
        });
        
        if (!this.isViewAlive(view)) return;
        
        await view.animate({
          ...this.animationCache.scaleReset,
          rotate: 0,
          duration: speed * 0.5,
          curve: "easeOut",
        });
      } finally {
        // Always restore original color
        if (this.isViewAlive(view)) {
          view.backgroundColor = originalColor;
        }
      }
    });
  }

  // ============================================================
  // 🎇 Celebrate Win (shake + glow + confetti)
  // ============================================================
  async celebrateWin(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    
    return this.safeAnimate(view, async () => {
      await this.glowPulse(view);
      if (!this.isViewAlive(view)) return;
      
      await this.shakeAnimation(view);
      if (!this.isViewAlive(view)) return;
      
      await this.confettiAnimation(view);
    });
  }

  // ============================================================
  // 💡 Glow Pulse
  // ============================================================
  private async glowPulse(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    
    const speed = this.getAnimationSpeed();
    const originalOpacity = view.opacity;
    
    for (let i = 0; i < 3; i++) {
      if (!this.isViewAlive(view)) break;
      
      await view.animate({
        opacity: 0.5,
        duration: speed,
        curve: "easeInOut",
      });
      
      if (!this.isViewAlive(view)) break;
      
      await view.animate({
        opacity: originalOpacity,
        duration: speed,
        curve: "easeInOut",
      });
    }
  }

  // ============================================================
  // 🩵 Slide In for UI Panels
  // ============================================================
  async slideIn(view: View, fromTop = true): Promise<void> {
    if (!this.isViewAlive(view)) return;
    
    return this.safeAnimate(view, async () => {
      const speed = this.getAnimationSpeed() * 2;
      const startY = fromTop ? -120 : 120;
      
      view.translateY = startY;
      view.opacity = 0;
      
      await view.animate({
        ...this.animationCache.translateReset,
        opacity: 1,
        duration: speed,
        curve: "easeOut",
      });
    });
  }

  // ============================================================
  // 🌫️ Simple Fade In
  // ============================================================
  async fadeIn(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;
    
    return this.safeAnimate(view, async () => {
      const speed = this.getAnimationSpeed();
      view.opacity = 0;
      await view.animate({ opacity: 1, duration: speed * 1.5 });
    });
  }

  // ============================================================
  // 💡 Hint Animation
  // ============================================================
  async animateHint(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;

    return this.safeAnimate(view, async () => {
      for (let i = 0; i < 3; i++) {
        if (!this.isViewAlive(view)) break;

        await view.animate({
          opacity: 0.6,
          scale: { x: 1.2, y: 1.2 },
          duration: 300,
          curve: "easeInOut",
        });
        
        if (!this.isViewAlive(view)) break;

        await view.animate({
          ...this.animationCache.scaleReset,
          opacity: 1,
          duration: 300,
          curve: "easeInOut",
        });

        await this.sleep(80);
      }
    });
  }
}