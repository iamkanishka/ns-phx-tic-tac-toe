import { Injectable } from "@angular/core";
import {
  isAndroid,
  isIOS,
  knownFolders,
  path,
  File,
  Application as androidApp,
} from "@nativescript/core";

// iOS native declarations (runtime provided by NativeScript)
declare const AVAudioSession: any;
declare const AVAudioSessionCategoryAmbient: any;
declare const AVAudioPlayer: any;
declare const NSURL: any;

export enum SoundType {
  Move = "move",
  Win = "win",
  Draw = "draw",
  Invalid = "invalid",
  Reset = "reset",
  Click = "click",
}

@Injectable({
  providedIn: "root",
})
export class SoundService {
  private players = new Map<SoundType, any>();
  private soundEnabled = true;
  private isInitialized = false;

  private soundPaths: Record<SoundType, string> = {
    [SoundType.Move]: "assets/sounds/move.wav",
    [SoundType.Win]: "assets/sounds/win.wav",
    [SoundType.Draw]: "assets/sounds/draw.wav",
    [SoundType.Invalid]: "assets/sounds/invalid.wav",
    [SoundType.Reset]: "assets/sounds/reset.wav",
    [SoundType.Click]: "assets/sounds/click.wav",
  };

  constructor() {}

  // -----------------------------------------------
  // 🔹 INITIALIZATION
  // -----------------------------------------------
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (isIOS) {
        const audioSession = AVAudioSession.sharedInstance();
        audioSession.setCategoryError(AVAudioSessionCategoryAmbient);
        audioSession.setActiveError(true);
      }

      for (const [type, relativePath] of Object.entries(this.soundPaths)) {
        const absPath = this.getAbsolutePath(relativePath);

        if (isIOS) {
          const url = NSURL.fileURLWithPath(absPath);
          const player = AVAudioPlayer.alloc().initWithContentsOfURLError(url);
          if (player) {
            player.prepareToPlay();
            this.players.set(type as SoundType, player);
          }
        } else if (isAndroid) {
          // Just preload paths; playback uses asset manager
          this.players.set(type as SoundType, relativePath);
        }
      }

      this.isInitialized = true;
      console.log("✅ Sound system initialized");
    } catch (err) {
      console.error("⚠️ Failed to initialize sounds:", err);
    }
  }

  // -----------------------------------------------
  // 🔹 PATH HANDLING
  // -----------------------------------------------
  private getAbsolutePath(relativePath: string): string {
    if (isAndroid) {
      // Assets are packed in the APK, not accessible via normal file path
      return relativePath;
    }
    const appFolder = knownFolders.currentApp().path;
    return path.join(appFolder, relativePath);
  }

  // -----------------------------------------------
  // 🔹 PLAY SOUND
  // -----------------------------------------------
  async play(type: SoundType, volume: number = 1.0): Promise<void> {
    if (!this.soundEnabled) return;

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (isIOS) {
        const player = this.players.get(type);
        if (!player) {
          console.warn(`iOS: No player for sound type ${type}`);
          return;
        }
        player.volume = volume;
        player.stop();
        player.currentTime = 0;
        player.play();
      } else if (isAndroid) {
        await this.playAndroidSound(type, volume);
      }
    } catch (err) {
      console.error("Sound play error:", err);
    }
  }

  // -----------------------------------------------
  // 🔹 ANDROID PLAYBACK
  // -----------------------------------------------
  private async playAndroidSound(type: SoundType, volume: number): Promise<void> {
    try {
      const soundPath = this.soundPaths[type];
      const androidAssetPath = soundPath.replace("assets/", "");

      const context = (global as any).android?.context || (androidApp as any).context;
      const assetManager = context.getAssets();
      const afd = assetManager.openFd(androidAssetPath);

      const mediaPlayer = new android.media.MediaPlayer();
      mediaPlayer.setDataSource(
        afd.getFileDescriptor(),
        afd.getStartOffset(),
        afd.getLength()
      );

      mediaPlayer.prepare();
      mediaPlayer.setVolume(volume, volume);
      mediaPlayer.start();

      mediaPlayer.setOnCompletionListener(
        new android.media.MediaPlayer.OnCompletionListener({
          onCompletion: (mp: android.media.MediaPlayer) => {
            mp.release();
            afd.close();
          },
        })
      );
    } catch (error) {
      console.error(`Android sound play error for ${type}:`, error);
    }
  }

  // -----------------------------------------------
  // 🔹 SETTINGS / CLEANUP
  // -----------------------------------------------
  setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  isEnabled(): boolean {
    return this.soundEnabled;
  }

  dispose(): void {
    this.players.forEach((player, type) => {
      try {
        if (isIOS && player) {
          player.stop();
        } else if (isAndroid && player) {
          player.stop?.();
          player.release?.();
        }
      } catch (err) {
        console.warn(`Error disposing player for ${type}:`, err);
      }
    });
    this.players.clear();
    this.isInitialized = false;
  }
}


 // "@valor/nativescript-feedback": "^2.0.2",
        // "nativescript-audio": "^6.2.6",