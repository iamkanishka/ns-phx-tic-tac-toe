import { Component, OnInit } from "@angular/core";
import { Page } from "@nativescript/core";
import { GoogleSignin, User } from "@nativescript/google-signin";
import { AuthService, GoogleUser } from "./../service/auth/auth.service";
import { RouterExtensions } from "@nativescript/angular";
import { from, tap, switchMap, of, catchError } from "rxjs";

declare var com: any;
 
@Component({
  standalone: false,
  selector: "app-sign-in",
  templateUrl: "./sign-in.component.html",
  styleUrl: "./sign-in.component.scss",
})
export class SignInComponent implements OnInit {
  name: string = "";
  email: string = "";
  password: string = "";
  agreeTerms: boolean = false;
  passwordHidden: boolean = true;
  constructor(
    private _page: Page,
    private router: RouterExtensions,
    private authService: AuthService
  ) {
    this._page.actionBarHidden = true;
  }

  

  onSignIn() {
    console.log("routing");
    this.router.navigate(["/game"], { clearHistory: true });
  }

  async onGoogleSignUp() {
    console.log("Google Sign-Up clicked");

    await GoogleSignin.configure({
      scopes: ["email", "profile"],
    });

    from(GoogleSignin.signIn())
      .pipe(
        tap((user) => console.log("✅ Signed in with Google:", user)),
        switchMap(() => {
          const currentUser = GoogleSignin.getCurrentUser();
          console.log("👤 Current Google User:", currentUser);
          if (!currentUser) {
            console.warn("⚠️ No current user found.");
            return of(null);
          }
          return this.authService.getGoogleSignInUserDetailsAPI();
        }),
        switchMap((googleUserInfo) => {
          if (googleUserInfo) {
            return this.authService.authenticateWithGoogle(googleUserInfo);
          }
          return of(null);
        }),
        tap((backendResponse) => {
          if (backendResponse) {
            console.log("🎉 User Authenticated and Stored:", backendResponse);
            this.router.navigate(["/game"], { clearHistory: true });
          }
        }),
        catchError((err) => {
          console.error("❌ Error during Google Sign-Up:", err);
          return of(null);
        })
      )
      .subscribe();
  }


  ngOnInit(): void {}
}
