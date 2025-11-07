import { Component, OnInit } from "@angular/core";
import { Page, ApplicationSettings } from "@nativescript/core";
import { GoogleSignin } from "@nativescript/google-signin";
import { AuthService } from "./../service/auth/auth.service";
import { RouterExtensions } from "@nativescript/angular";
import { from, of } from "rxjs";
import { tap, switchMap, catchError, finalize } from "rxjs/operators";

@Component({
  standalone: false,
  selector: "app-sign-in",
  templateUrl: "./sign-in.component.html",
  styleUrl: "./sign-in.component.scss",
})
export class SignInComponent implements OnInit {
  isLoadingGoogle: boolean = false;

  constructor(
    private _page: Page,
    private router: RouterExtensions,
    private authService: AuthService
  ) {
    this._page.actionBarHidden = true;
  }

  ngOnInit(): void {
    this.autoLoginIfUserExists();
  }

  // ✅ Auto-login if user already exists in local storage
  private autoLoginIfUserExists() {
    const savedUser = ApplicationSettings.getString("user");
    if (savedUser) {
      console.log("🔁 Auto-login with saved user:", JSON.parse(savedUser));
      this.router.navigate(["/game"], { clearHistory: true });
    }
  }

  async onGoogleSignUp() {
    console.log("🚀 Google Sign-Up clicked");
    this.isLoadingGoogle = true;

    try {
      // 1️⃣ Configure Google Sign-In
      await GoogleSignin.configure({
        scopes: ["email", "profile"],
      });

      // 2️⃣ Begin the reactive sign-in flow
      from(GoogleSignin.signIn())
        .pipe(
          tap((user) => console.log("✅ Signed in with Google:", user)),

          // 3️⃣ Fetch Google user profile info
          switchMap(() => {
            const currentUser = GoogleSignin.getCurrentUser();
            console.log("👤 Current Google User:", currentUser);
            if (!currentUser) {
              console.warn("⚠️ No current user found.");
              return of(null);
            }
            return this.authService.getGoogleSignInUserDetailsAPI();
          }),

          // 4️⃣ Send to backend for authentication & persistence
          switchMap((googleUserInfo) => {
            if (googleUserInfo) {
              console.log("🌐 Google User Info from API:", googleUserInfo);
              return this.authService.authenticateWithGoogle(googleUserInfo);
            }
            return of(null);
          }),

          // 5️⃣ Handle successful backend response
          tap((backendResponse) => {
            if (backendResponse?.user) {
              console.log("🎉 User Authenticated and Stored:", backendResponse.user);
              // ✅ Save in ApplicationSettings for auto-login
              ApplicationSettings.setString(
                "user",
                JSON.stringify(backendResponse.user)
              );

              // ✅ Also broadcast to BehaviorSubject
              this.authService.persistUser(backendResponse.user);

              // ✅ Navigate to game
              this.router.navigate(["/game"], { clearHistory: true });
            } else {
              console.warn("⚠️ No user returned from backend.");
            }
          }),

          catchError((err) => {
            console.error("❌ Error during Google Sign-Up:", err);
            return of(null);
          }),

          finalize(() => {
            this.isLoadingGoogle = false; // ✅ stop loader no matter what
          })
        )
        .subscribe();
    } catch (err) {
      console.error("❌ Error configuring Google Sign-In:", err);
      this.isLoadingGoogle = false;
    }
  }
}
