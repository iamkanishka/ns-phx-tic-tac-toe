import { Injectable } from '@angular/core';
import { isAndroid, isIOS, Application } from '@nativescript/core';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  
  copyToClipboard(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (!text?.trim()) {
          resolve(false);
          return;
        }

        // iOS implementation
        if (isIOS) {
          const pasteboard = UIPasteboard.generalPasteboard;
          pasteboard.string = text;
          resolve(true);
        } 
        // Android implementation
        else if (isAndroid) {
          const context = Application.android.context;
          if (!context) {
            resolve(false);
            return;
          }

          const clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager;
          const clip = android.content.ClipData.newPlainText('text', text);
          clipboard.setPrimaryClip(clip);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('Clipboard copy error:', error);
        resolve(false);
      }
    });
  }

  getFromClipboard(): Promise<string> {
    return new Promise((resolve) => {
      try {
        if (isIOS) {
          const pasteboard = UIPasteboard.generalPasteboard;
          resolve(pasteboard.string || '');
        } 
        else if (isAndroid) {
          const context = Application.android.context;
          if (!context) {
            resolve('');
            return;
          }

          const clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager;
          if (clipboard?.hasPrimaryClip()) {
            const clip = clipboard.getPrimaryClip();
            if (clip && clip.getItemCount() > 0) {
              const text = clip.getItemAt(0).coerceToText(context)?.toString() ?? '';
              resolve(text);
            } else {
              resolve('');
            }
          } else {
            resolve('');
          }
        } else {
          resolve('');
        }
      } catch (error) {
        console.error('Clipboard read error:', error);
        resolve('');
      }
    });
  }
}
