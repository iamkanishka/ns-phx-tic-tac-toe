import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { ApplicationSettings } from "@nativescript/core";
import { AuthService } from "../auth/service/auth/auth.service";

@Injectable({
  providedIn: "root",
})
export class GoogleAuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  async canActivate(): Promise<boolean> {
    try {
      const storedUser = ApplicationSettings.getString("user");
      const user = storedUser ? JSON.parse(storedUser) : this.authService.getCurrentUser();

      if (user && user.email_verified) {
        console.log("✅ AuthGuard: User verified:", user.email);
        return true;
      }

      console.warn("🚫 AuthGuard: No valid user → redirecting to sign-in...");
      this.router.navigate(["signin"]);
      return false;
    } catch (error) {
      console.error("❌ AuthGuard Error:", error);
      this.router.navigate(["signin"]);
      return false;
    }
  }
}
