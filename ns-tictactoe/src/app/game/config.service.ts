import { Injectable } from '@angular/core';
import { isAndroid, isIOS } from '@nativescript/core/platform';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly localPort = 4000;

  get apiUrl(): string {
    if (isAndroid) {
      // Android emulator -> host machine
      return `http://10.0.2.2:${this.localPort}`;
    } else if (isIOS) {
      // iOS simulator supports localhost directly
      return `http://localhost:${this.localPort}`;
    } else {
      // For web or other environments
      return `http://localhost:${this.localPort}`;
    }
  }
}
