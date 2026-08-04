import { Injectable } from '@angular/core';
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

  user$: Observable<User | null> = new Observable<User | null>(subscriber => {
    return onAuthStateChanged(auth, user => subscriber.next(user), err => subscriber.error(err));
  }).pipe(shareReplay({ bufferSize: 1, refCount: false }));

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
