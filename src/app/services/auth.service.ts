import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import {
  User,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

import { auth } from '../firebase';

// undefined = Firebase hasn't finished checking for a saved session yet;
// null = confirmed signed out; User = confirmed signed in. Collapsing the
// first two into a single "null" default made guards resolve "logged out"
// before Firebase had actually answered, occasionally landing a still-valid
// session on the login page.
export type AuthUser = User | null | undefined;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Signals hook directly into Angular's own zoneless change-detection
  // scheduler, unlike a manual ApplicationRef.tick() call from a raw Firebase
  // callback — which can race Angular's own scheduled tick and throw NG0100.
  // toObservable() exposes this as a normal Observable so existing
  // .subscribe()-based code elsewhere doesn't need to change.
  private userSignal = signal<AuthUser>(undefined);
  user$: Observable<AuthUser> = toObservable(this.userSignal);

  constructor() {
    onAuthStateChanged(
      auth,
      user => this.userSignal.set(user),
      () => this.userSignal.set(null)
    );
  }

  get currentUid(): string | null {
    return auth.currentUser?.uid ?? null;
  }

  signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async signIn(email: string, password: string, rememberMe = true) {
    // "Remember me" unchecked drops to session-only persistence — the login
    // is forgotten once the browser tab closes instead of surviving restarts.
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  logOut() {
    return signOut(auth);
  }

  resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }
}
