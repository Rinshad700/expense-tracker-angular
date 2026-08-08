import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent {

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  async logOut() {
    await this.authService.logOut();

    // logOut() resolving doesn't guarantee the auth signal has already
    // updated — onAuthStateChanged can fire a moment later. Wait for it
    // explicitly, or the guestGuard on /login can still see the old
    // "logged in" state and bounce straight back to the Dashboard.
    await firstValueFrom(this.authService.user$.pipe(filter(user => user === null)));

    this.router.navigate(['/login']);
  }

}
