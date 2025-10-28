import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { GoogleSignin } from "@nativescript/google-signin";

export interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}


export interface AuthenticatedUserResponse {
  message: string;
  user: GoogleUser & { id: string };
}



@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userSubject = new BehaviorSubject<AuthenticatedUserResponse>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Fetch user details from Google using the access token
   */
  getGoogleSignInUserDetailsAPI(): Observable<any> {
    const accessToken = this.getCurrentUserAccessToken();

    if (!accessToken) {
      throw new Error("Access token not found. Please sign in first.");
    }

    const url = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`;
    return this.http.get(url);
  }

  /**
   * Custom user auth with google info on backend
   */
  authenticateWithGoogle(userInfo: any): Observable<any> {
    return this.http
      .post("https://lk3fddm2-4000.inc1.devtunnels.ms/api/auth/google", userInfo)
      .pipe(
        tap((response) => {
          console.log("✅ Authenticated User:", response);
          this.userSubject.next(response); // ✅ store in BehaviorSubject
        })
      );
  }

  /**
   * Returns the current Google user's access token
   */
  public getCurrentUserAccessToken(): string | null {
    const currentUser = GoogleSignin.getCurrentUser();
    return currentUser["_accessToken"] || null;
  }

  /**
   * Returns the current Google user object
   */
  public getCurrentUser(): any {
    return GoogleSignin.getCurrentUser();
  }
}
