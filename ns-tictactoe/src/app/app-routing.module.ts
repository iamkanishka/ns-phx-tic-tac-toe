import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import {
  NativeScriptRouterModule,
  NSEmptyOutletComponent,
} from "@nativescript/angular";
import { GameComponent } from "./game/game.component";
import { GoogleAuthGuard } from "./guards/googe-auth.guard";

const routes: Routes = [
  {
    path: "",
    redirectTo: "game",
    pathMatch: "full",
  },
  {
    path: "game",
    component: GameComponent,
    canActivate: [GoogleAuthGuard],
  },
  {
    path: "signin",
    loadChildren: () =>
      import("~/app/auth/auth.module").then((m) => m.AuthModule),
  },
];

@NgModule({
  imports: [NativeScriptRouterModule.forRoot(routes)],
  exports: [NativeScriptRouterModule],
})
export class AppRoutingModule {}
