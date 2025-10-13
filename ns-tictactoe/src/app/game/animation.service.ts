import { Injectable } from '@angular/core';
import { View, Animation, AnimationDefinition } from '@nativescript/core';
import { executeOnMainThread, } from '@nativescript/core/utils';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {

  private async safePlay(animation: Animation): Promise<void> {
    try {
      await executeOnMainThread(() => animation.play());
    } catch (err) {
      console.error('[AnimationService] Animation failed:', err);
    }
  }

  private isViewAlive(view: View): boolean {
    return !!view && !!view.nativeViewProtected && view.isLoaded;
  }

  async cellPop(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;

    const animation = new Animation([
      {
        target: view,
        scale: { x: 0.01, y: 0.01 }, // avoid 0
        rotate: -180,
        duration: 1
      },
      {
        target: view,
        scale: { x: 1.2, y: 1.2 },
        rotate: 10,
        duration: 200,
        curve: 'easeOut'
      },
      {
        target: view,
        scale: { x: 1, y: 1 },
        rotate: 0,
        duration: 150,
        curve: 'easeIn'
      }
    ]);

    await this.safePlay(animation);
  }

  async winningCellAnimation(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;

    const pulse = new Animation([
      { target: view, scale: { x: 1.15, y: 1.15 }, duration: 300, curve: 'easeInOut' },
      { target: view, scale: { x: 1, y: 1 }, duration: 300, curve: 'easeInOut' }
    ]);

    for (let i = 0; i < 3; i++) {
      if (!this.isViewAlive(view)) break;
      await this.safePlay(pulse);
    }
  }

  async shakeAnimation(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;

    const shake = new Animation([
      { target: view, translate: { x: -10, y: 0 }, duration: 50 },
      { target: view, translate: { x: 10, y: 0 }, duration: 50 },
      { target: view, translate: { x: -10, y: 0 }, duration: 50 },
      { target: view, translate: { x: 10, y: 0 }, duration: 50 },
      { target: view, translate: { x: 0, y: 0 }, duration: 50 }
    ]);

    await this.safePlay(shake);
  }

  async confettiAnimation(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;

    const confetti = new Animation([
      {
        target: view,
        rotate: 360,
        scale: { x: 1.5, y: 1.5 },
        duration: 1000,
        curve: 'spring'
      }
    ]);

    await this.safePlay(confetti);
  }

  async slideIn(view: View, fromTop: boolean = true): Promise<void> {
    if (!this.isViewAlive(view)) return;

    executeOnMainThread(() => {
      const startY = fromTop ? -100 : 100;
      view.translateY = startY;
      view.opacity = 0;
    });

    const animation = new Animation([
      {
        target: view,
        translate: { x: 0, y: 0 },
        opacity: 1,
        duration: 400,
        curve: 'easeOut'
      }
    ]);

    await this.safePlay(animation);
  }

  async fadeIn(view: View): Promise<void> {
    if (!this.isViewAlive(view)) return;

    executeOnMainThread(() => view.opacity = 0);

    const fade = new Animation([
      { target: view, opacity: 1, duration: 300 }
    ]);

    await this.safePlay(fade);
  }
}
