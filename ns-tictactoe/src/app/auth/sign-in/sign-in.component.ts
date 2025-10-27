import { Component, OnInit } from "@angular/core";
import { Page } from "@nativescript/core";
import { GoogleSignin, User } from "@nativescript/google-signin";
import { AuthService } from "./../service/auth/auth.service";
import { RouterExtensions } from "@nativescript/angular";

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
    try {
      await GoogleSignin.configure({
        scopes: ["email"],
      });
      const user = await GoogleSignin.signIn();
      console.log("Signing in with:", user);

      const currentUser: User | null = GoogleSignin.getCurrentUser();
      console.log("currentIUser", currentUser);
      if (currentUser) {
        this.authService
          .getGoogleSignInUserDetailsAPI()
          .subscribe((res) => {
            console.log("Google User Details", res);
            this.onSignIn();
          });
      } else {
        console.log("No current user found");
      }
    } catch (e) {
      console.log(e);
    }
  }


  ngOnInit(): void {}
}
