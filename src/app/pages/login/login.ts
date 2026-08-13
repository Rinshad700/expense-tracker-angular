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
  rememberMe = false;
  error: string | null = null;
  loading = false;
  showPassword = false;
  resetLoading = false;
  resetSent = false;

  readonly dotGrid = (() => {
    const dots: { x: number; y: number }[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        dots.push({ x: 345 + col * 15, y: 55 + row * 15 });
      }
    }
    return dots;
  })();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.mode = this.mode === 'signin' ? 'signup' : 'signin';
    this.error = null;
    this.resetSent = false;
  }

  async forgotPassword() {

    this.resetSent = false;

    if (!this.email) {
      this.error = 'Enter your email above first, then tap "Forgot password?".';
      return;
    }

    this.error = null;
    this.resetLoading = true;

    try {
      await this.authService.resetPassword(this.email);
      this.resetSent = true;
    } catch (err: any) {
      this.error = this.friendlyError(err?.code);
    } finally {
      this.resetLoading = false;
    }

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
        await this.authService.signIn(this.email, this.password, this.rememberMe);
      }

      await this.waitForAuthAndNavigate();

    } catch (err: any) {
      this.error = this.friendlyError(err?.code);
    } finally {
      this.loading = false;
    }
  }

  // signIn()/signUp() resolving doesn't guarantee the auth signal has already
  // updated — onAuthStateChanged can fire a moment later. Wait for it
  // explicitly, or the authGuard on '/' can still see the old "logged out"
  // state and bounce straight back to /login.
  private async waitForAuthAndNavigate() {
    await firstValueFrom(this.authService.user$.pipe(filter(user => !!user)));
    this.router.navigate(['/']);
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
