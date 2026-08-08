import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  mode: 'signin' | 'signup' = 'signin';
  email = '';
  password = '';
  error: string | null = null;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.mode = this.mode === 'signin' ? 'signup' : 'signin';
    this.error = null;
  }

  async submit() {
    if (!this.email || !this.password) {
      return;
    }

    this.loading = true;
    this.error = null;

    try {

      if (this.mode === 'signup') {
        await this.authService.signUp(this.email, this.password);
      } else {
        await this.authService.signIn(this.email, this.password);
      }

      // signIn()/signUp() resolving doesn't guarantee the auth signal has
      // already updated — onAuthStateChanged can fire a moment later. Wait
      // for it explicitly, or the authGuard on '/' can still see the old
      // "logged out" state and bounce straight back to /login.
      await firstValueFrom(this.authService.user$.pipe(filter(user => !!user)));

      this.router.navigate(['/']);

    } catch (err: any) {
      this.error = this.friendlyError(err?.code);
    } finally {
      this.loading = false;
    }
  }

  private friendlyError(code?: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'That email address looks invalid.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}
