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

  togglePasswordVisibility() {
    this.passwordHidden = !this.passwordHidden;
  }

  onSignUp() {
    console.log("Signing up with:", this.name, this.email, this.password);
    // Handle sign-up logic
  }

  onSignIn() {
    console.log("routing");

    this.router.navigate(["/tabs/home/default"]);
  }

  onAppleSignUp() {
    console.log("Apple Sign-Up clicked");
  }

  async onGoogleSignUp() {
    console.log("Google Sign-Up clicked");
    try {
      await GoogleSignin.configure({ scopes: ["email"] });
      const user = await GoogleSignin.signIn();
      console.log("Signing in with:", user);

      const currentUser: User | null = GoogleSignin.getCurrentUser();
      console.log("currentIUser", currentUser);
      if (currentUser) {
        this.authService
          .getGoogleSignInUserDetailsAPI(currentUser["_accessToken"])
          .subscribe((res) => {
            console.log("Google User Details", res);
          });
      } else {
        console.log("No current user found");
      }
    } catch (e) {}
  }

  

  onTerms() {
    console.log("Terms & Conditions clicked");
    // Navigate to terms page
  }

  signout() {
    console.log("Signing out");

    GoogleSignin.signOut();
  
  }

  ngOnInit(): void {
    
  }


}
