import { Injectable } from '@angular/core';
import { isIOS, isAndroid, Utils } from '@nativescript/core';

export enum HapticIntensity {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Success = 'success',
  Warning = 'warning',
  Error = 'error'
}

@Injectable({
  providedIn: 'root'
})
export class HapticService {
  private enabled = true;

  constructor() {}

  trigger(intensity: HapticIntensity): void {
    if (!this.enabled) return;

    try {
      if (isIOS) {
        this.triggerIOS(intensity);
      } else if (isAndroid) {
        this.triggerAndroid(intensity);
      }
    } catch (error) {
      console.log('Haptic feedback error:', error);
    }
  }

  // =====================================================
  // iOS IMPLEMENTATION
  // =====================================================
  private triggerIOS(intensity: HapticIntensity): void {
    try {
      const UIImpactFeedbackGenerator = (<any>global).UIImpactFeedbackGenerator;
      const UIImpactFeedbackStyle = (<any>global).UIImpactFeedbackStyle;
      const UINotificationFeedbackGenerator = (<any>global).UINotificationFeedbackGenerator;
      const UINotificationFeedbackType = (<any>global).UINotificationFeedbackType;
      const UISelectionFeedbackGenerator = (<any>global).UISelectionFeedbackGenerator;

      switch (intensity) {
        case HapticIntensity.Light: {
          const generator = UIImpactFeedbackGenerator.alloc().initWithStyle(UIImpactFeedbackStyle.Light);
          generator.prepare();
          generator.impactOccurred();
          break;
        }
        case HapticIntensity.Medium: {
          const generator = UIImpactFeedbackGenerator.alloc().initWithStyle(UIImpactFeedbackStyle.Medium);
          generator.prepare();
          generator.impactOccurred();
          break;
        }
        case HapticIntensity.Heavy: {
          const generator = UIImpactFeedbackGenerator.alloc().initWithStyle(UIImpactFeedbackStyle.Heavy);
          generator.prepare();
          generator.impactOccurred();
          break;
        }
        case HapticIntensity.Success: {
          const generator = UINotificationFeedbackGenerator.new();
          generator.prepare();
          generator.notificationOccurred(UINotificationFeedbackType.Success);
          break;
        }
        case HapticIntensity.Warning: {
          const generator = UINotificationFeedbackGenerator.new();
          generator.prepare();
          generator.notificationOccurred(UINotificationFeedbackType.Warning);
          break;
        }
        case HapticIntensity.Error: {
          const generator = UINotificationFeedbackGenerator.new();
          generator.prepare();
          generator.notificationOccurred(UINotificationFeedbackType.Error);
          break;
        }
        default: {
          const generator = UISelectionFeedbackGenerator.new();
          generator.prepare();
          generator.selectionChanged();
          break;
        }
      }
    } catch (e) {
      console.log('iOS haptic error:', e);
    }
  }

  // =====================================================
  // ANDROID IMPLEMENTATION (FIXED)
  // =====================================================
  private triggerAndroid(intensity: HapticIntensity): void {
    try {
      const context = Utils.android.getApplicationContext();
      if (!context) {
        console.log('⚠️ Android context not available');
        return;
      }

      const vibrator = context.getSystemService(android.content.Context.VIBRATOR_SERVICE);
      if (!vibrator || !vibrator.hasVibrator()) return;

      const duration = this.getVibrationDuration(intensity);
      const amplitude = this.getVibrationAmplitude(intensity);
      const VibrationEffect = android.os.VibrationEffect;

      if (android.os.Build.VERSION.SDK_INT >= 26 && VibrationEffect) {
        const effect = VibrationEffect.createOneShot(duration, amplitude);
        vibrator.vibrate(effect);
      } else {
        vibrator.vibrate(duration);
      }
    } catch (e) {
      console.log('Android haptic error:', e);
    }
  }

  private getVibrationDuration(intensity: HapticIntensity): number {
    switch (intensity) {
      case HapticIntensity.Light: return 20;
      case HapticIntensity.Medium: return 40;
      case HapticIntensity.Heavy: return 60;
      case HapticIntensity.Success: return 50;
      case HapticIntensity.Warning: return 70;
      case HapticIntensity.Error: return 100;
      default: return 30;
    }
  }

  private getVibrationAmplitude(intensity: HapticIntensity): number {
    switch (intensity) {
      case HapticIntensity.Light: return 50;
      case HapticIntensity.Medium: return 150;
      case HapticIntensity.Heavy: return 255;
      case HapticIntensity.Success: return 180;
      case HapticIntensity.Warning: return 200;
      case HapticIntensity.Error: return 255;
      default: return 100;
    }
  }

  // =====================================================
  // ENABLE/DISABLE CONTROL
  // =====================================================
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
