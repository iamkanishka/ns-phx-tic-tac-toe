import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { GoogleSignin } from "@nativescript/google-signin";
import { AuthService } from "../auth/service/auth/auth.service";
 

@Injectable({
  providedIn: "root",
})
export class GoogleAuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  async canActivate(): Promise<boolean> {
    try {
      const currentUser: any = await this.authService.getCurrentUser();

      if (currentUser && currentUser._accessToken) {
        // ✅ User is signed in
        console.log("User is signed in:", currentUser);
        return true;
      } else {
        // 🚫 Not signed in → redirect to login
        this.router.navigate(["signin"]);
        return false;
      }
    } catch (error) {
      console.error("Error checking Google Sign-In:", error);
      this.router.navigate(["signin"]);
      return false;
    }
  }
}
