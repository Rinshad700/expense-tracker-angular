import { Injectable, NgZone } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

import { auth } from '../firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$: Observable<User | null>;

  constructor(private ngZone: NgZone) {

    // onAuthStateChanged fires outside Angular's zone (the Firebase SDK isn't
    // zone.js-aware), so without ngZone.run() the UI wouldn't repaint until some
    // unrelated zone-patched event (like a route change) forced a tick.
    this.user$ = new Observable<User | null>(subscriber => {
      return onAuthStateChanged(
        auth,
        user => this.ngZone.run(() => subscriber.next(user)),
        err => this.ngZone.run(() => subscriber.error(err))
      );
    }).pipe(shareReplay({ bufferSize: 1, refCount: false }));

  }

  get currentUid(): string | null {
    return auth.currentUser?.uid ?? null;
  }

  signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  logOut() {
    return signOut(auth);
  }
}
