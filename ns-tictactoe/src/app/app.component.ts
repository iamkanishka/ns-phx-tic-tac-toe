import { Component, OnInit } from '@angular/core'
import { RouterExtensions } from "@nativescript/angular";
import { ApplicationSettings } from "@nativescript/core";

@Component({
  standalone: false,
  selector: 'ns-app',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
   constructor(private router: RouterExtensions) {}

  ngOnInit(): void {
    const storedUser = ApplicationSettings.getString("user");
    if (storedUser) {
      this.router.navigate(["/game"], { clearHistory: true });
    } else {
      this.router.navigate(["/signin"], { clearHistory: true });
    }
  }
}
