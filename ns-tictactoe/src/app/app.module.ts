import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "@nativescript/angular";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

import { GameComponent } from "./game/game.component";
 

@NgModule({
  bootstrap: [GameComponent],
  imports: [NativeScriptModule, AppRoutingModule],
  declarations: [AppComponent, GameComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppModule {}
