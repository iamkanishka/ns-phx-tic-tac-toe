import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import {
  NativeScriptRouterModule,
  NSEmptyOutletComponent,
} from "@nativescript/angular";


const routes: Routes = [
  {
    path: "",
    redirectTo: "signin",
    pathMatch: "full",
  },
  {
    path: "signin",
    loadChildren: () =>
      import("~/app/auth/auth.module").then((m) => m.AuthModule),
    outlet: "homeTab",
  },

  {
    path: "home",
    component: NSEmptyOutletComponent,
    loadChildren: () =>
      import("~/app/home/home.module").then((m) => m.HomeModule),
    outlet: "homeTab",
  },
  {
    path: "browse",
    component: NSEmptyOutletComponent,
    loadChildren: () =>
      import("~/app/browse/browse.module").then((m) => m.BrowseModule),
    outlet: "browseTab",
  },
  {
    path: "search",
    component: NSEmptyOutletComponent,
    loadChildren: () =>
      import("~/app/search/search.module").then((m) => m.SearchModule),
    outlet: "searchTab",
  },
];

@NgModule({
  imports: [NativeScriptRouterModule.forRoot(routes)],
  exports: [NativeScriptRouterModule],
})
export class AppRoutingModule {}
