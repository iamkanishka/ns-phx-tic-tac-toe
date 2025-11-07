import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { ApplicationSettings } from "@nativescript/core";
import { GoogleSignin, User } from "@nativescript/google-signin";

/**
 * Google user info returned from the OAuth API
 */
export interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  id?: string; // added after backend authentication
}

/**
 * Backend response for Google authentication
 */
export interface AuthenticatedUserResponse {
  message: string;
  user: GoogleUser & { id: string };
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private apiUrl = "https://lk3fddm2-4000.inc1.devtunnels.ms/api/auth/google";

  // ✅ Reactive BehaviorSubject that holds the current authenticated user
  private userSubject = new BehaviorSubject<GoogleUser | null>(
    this.loadStoredUser()
  );
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ============================================
  // 🔹 Step 1: Get Google User Info via Access Token
  // ============================================
  getGoogleSignInUserDetailsAPI(): Observable<GoogleUser> {
    const accessToken = this.getCurrentUserAccessToken();

    if (!accessToken) {
      throw new Error("Access token not found. Please sign in first.");
    }

    const url = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`;
    return this.http.get<GoogleUser>(url);
  }

  // ============================================
  // 🔹 Step 2: Authenticate User with Phoenix Backend
  // ============================================
  authenticateWithGoogle(userInfo: GoogleUser): Observable<AuthenticatedUserResponse> {
    return this.http.post<AuthenticatedUserResponse>(this.apiUrl, userInfo).pipe(
      tap((response) => {
        if (response?.user) {
          console.log("✅ Authenticated with backend:", response.user);
          this.persistUser(response.user); // ✅ store only user
        }
      })
    );
  }

  // ============================================
  // 🔹 Step 3: Access Google Access Token & Current User
  // ============================================
  public getCurrentUserAccessToken(): string | null {
    const currentUser: User | null = GoogleSignin.getCurrentUser();
    return currentUser?.accessToken || null; // ✅ updated property
  }

  public getCurrentUser(): User | null {
    return GoogleSignin.getCurrentUser();
  }

  // ============================================
  // 🔹 Step 4: Persist User Locally + Update BehaviorSubject
  // ============================================
  public persistUser(user: GoogleUser & { id: string }): void {
    try {
      ApplicationSettings.setString("user", JSON.stringify(user));
      this.userSubject.next(user);
      console.log("💾 User saved to ApplicationSettings:", user.email);
    } catch (error) {
      console.error("❌ Failed to persist user:", error);
    }
  }

  private loadStoredUser(): GoogleUser | null {
    try {
      const stored = ApplicationSettings.getString("user");
      return stored ? (JSON.parse(stored) as GoogleUser) : null;
    } catch (error) {
      console.error("⚠️ Failed to load stored user:", error);
      return null;
    }
  }

  // ============================================
  // 🔹 Step 5: Logout (Clear Session)
  // ============================================
  logout(): void {
    try {
      GoogleSignin.signOut();
      ApplicationSettings.remove("user");
      this.userSubject.next(null);
      console.log("🚪 Logged out successfully");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  }

  // ============================================
  // 🔹 Step 6: Synchronous Getter for Current User
  // ============================================
  get currentUser(): GoogleUser | null {
    return this.userSubject.value;
  }
}
