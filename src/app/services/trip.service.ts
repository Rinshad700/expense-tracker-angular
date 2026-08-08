import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore';

import { Trip } from '../models/trip';
import { db } from '../firebase';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TripService {

  // Signals hook directly into Angular's own zoneless change-detection
  // scheduler, so updates from a raw Firestore callback (which Angular can't
  // otherwise see) repaint the view safely — no manual ApplicationRef.tick()
  // needed, and no risk of it racing Angular's own scheduled ticks.
  private tripsSignal = signal<Trip[]>([]);
  // Prefer reading this signal directly in templates — Angular tracks that
  // natively and coalesces updates safely. trips$ stays around only for
  // places (like TripDetailComponent) still consuming it as a stream.
  trips = this.tripsSignal.asReadonly();
  trips$ = toObservable(this.tripsSignal);

  // True while a freshly-attached listener hasn't received its first snapshot yet
  // (e.g. right after logging in) — lets pages show a spinner instead of a
  // misleading "no trips" state during that first round trip to Firestore.
  private loadingSignal = signal<boolean>(true);
  loading = this.loadingSignal.asReadonly();
  loading$ = toObservable(this.loadingSignal);

  private unsubscribeSnapshot: (() => void) | null = null;

  constructor(private authService: AuthService) {

    this.authService.user$.subscribe(user => {

      // undefined means Firebase hasn't finished checking for a saved
      // session yet — treating that the same as "logged out" would clear
      // data/flip loading off for a moment before the real answer arrives.
      if (user === undefined) {
        return;
      }

      this.unsubscribeSnapshot?.();
      this.unsubscribeSnapshot = null;

      if (!user) {
        this.tripsSignal.set([]);
        this.loadingSignal.set(false);
        return;
      }

      this.loadingSignal.set(true);

      const q = query(
        collection(db, 'users', user.uid, 'trips'),
        orderBy('createdAt', 'desc')
      );

      this.unsubscribeSnapshot = onSnapshot(
        q,
        snapshot => {
          const trips = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trip));
          this.tripsSignal.set(trips);
          this.loadingSignal.set(false);
        },
        error => {
          console.error('Trips listener failed', error);
          this.loadingSignal.set(false);
        }
      );

    });

  }

  getTrips(): Trip[] {
    return this.tripsSignal();
  }

  getTrip(id: string): Trip | undefined {
    return this.tripsSignal().find(t => t.id === id);
  }

  getActiveTrips(): Trip[] {
    return this.tripsSignal().filter(t => t.status === 'ongoing' || t.status === 'planned');
  }

  addTrip(trip: Omit<Trip, 'id' | 'createdAt'>) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    return addDoc(collection(db, 'users', uid, 'trips'), {
      ...trip,
      createdAt: new Date().toISOString()
    });
  }

  updateTrip(updated: Trip) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    const { id, ...data } = updated;
    return updateDoc(doc(db, 'users', uid, 'trips', id), data);
  }

  deleteTrip(id: string) {
    const uid = this.authService.currentUid;
    if (!uid) return Promise.resolve();

    return deleteDoc(doc(db, 'users', uid, 'trips', id));
  }
}
