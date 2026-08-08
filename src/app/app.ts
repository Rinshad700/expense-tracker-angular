import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { NavbarComponent } from './components/navbar/navbar';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  authService = inject(AuthService);
  private router = inject(Router);

  // Right after signing in, the auth signal updates before the router
  // finishes navigating away from /login, which would otherwise flash the
  // sidebar in for a split second while still showing the login form.
  private currentUrl = signal(this.router.url);
  private onLoginRoute = computed(() => this.currentUrl().startsWith('/login'));

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.currentUrl.set(event.urlAfterRedirects));
  }

  showNav(user: unknown): boolean {
    return !!user && !this.onLoginRoute();
  }

}
