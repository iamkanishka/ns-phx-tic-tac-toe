import { Injectable } from '@angular/core';
import { View, Animation, AnimationDefinition } from '@nativescript/core';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  
  async cellPop(view: View): Promise<void> {
    const animation = new Animation([
      {
        target: view,
        scale: { x: 0, y: 0 },
        rotate: -180,
        duration: 0
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

    await animation.play();
  }

  async winningCellAnimation(view: View): Promise<void> {
    const pulseAnimation = new Animation([
      {
        target: view,
        scale: { x: 1, y: 1 },
        duration: 0
      },
      {
        target: view,
        scale: { x: 1.15, y: 1.15 },
        duration: 300,
        curve: 'easeInOut'
      },
      {
        target: view,
        scale: { x: 1, y: 1 },
        duration: 300,
        curve: 'easeInOut'
      }
    ]);

    // Repeat 3 times
    for (let i = 0; i < 3; i++) {
      await pulseAnimation.play();
    }
  }

  async shakeAnimation(view: View): Promise<void> {
    const shake = new Animation([
      {
        target: view,
        translate: { x: -10, y: 0 },
        duration: 50
      },
      {
        target: view,
        translate: { x: 10, y: 0 },
        duration: 50
      },
      {
        target: view,
        translate: { x: -10, y: 0 },
        duration: 50
      },
      {
        target: view,
        translate: { x: 10, y: 0 },
        duration: 50
      },
      {
        target: view,
        translate: { x: 0, y: 0 },
        duration: 50
      }
    ]);

    await shake.play();
  }

  async confettiAnimation(view: View): Promise<void> {
    const confetti = new Animation([
      {
        target: view,
        rotate: 360,
        scale: { x: 1.5, y: 1.5 },
        duration: 1000,
        curve: 'spring'
      }
    ]);

    await confetti.play();
  }

  async slideIn(view: View, fromTop: boolean = true): Promise<void> {
    const startY = fromTop ? -100 : 100;
    
    view.translateY = startY;
    view.opacity = 0;

    const animation = new Animation([
      {
        target: view,
        translate: { x: 0, y: 0 },
        opacity: 1,
        duration: 400,
        curve: 'easeOut'
      }
    ]);

    await animation.play();
  }

  async fadeIn(view: View): Promise<void> {
    view.opacity = 0;
    const animation = new Animation([
      {
        target: view,
        opacity: 1,
        duration: 300
      }
    ]);
    await animation.play();
  }
}