import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
    this.router.navigate(['/login']);
  }

}
