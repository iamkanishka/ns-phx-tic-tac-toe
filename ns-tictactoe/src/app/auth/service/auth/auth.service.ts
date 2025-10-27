import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { GoogleSignin } from "@nativescript/google-signin";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  const;
  constructor(private http: HttpClient) {}


  getGoogleSignInUserDetailsAPI(): Observable<any> {
    const accessToken: string = GoogleSignin.getCurrentUser()["_accessToken"];

    return this.http.get(
      "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" +
        accessToken
    );
  }

  public getCurrentUser(): Promise<any> {
    return Promise.resolve(GoogleSignin.getCurrentUser());
  }
}
