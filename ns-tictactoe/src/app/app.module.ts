import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "@nativescript/angular";
import { NativeScriptFormsModule } from '@nativescript/angular';
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { GameComponent } from "./game/game.component";
import { Page } from '@nativescript/core';
 
import { HttpClientModule } from "@angular/common/http";
import { AuthModule } from "./auth/auth.module";
import { SignInComponent } from "./auth/sign-in/sign-in.component";



@NgModule({
  bootstrap: [SignInComponent],
  imports: [NativeScriptModule, AppRoutingModule, NativeScriptFormsModule, HttpClientModule, AuthModule],
  declarations: [AppComponent, GameComponent, SignInComponent],
   providers: [
    Page // ✅ Add this line
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppModule {}
