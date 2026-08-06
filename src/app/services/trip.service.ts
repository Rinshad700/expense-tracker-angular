import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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

  private tripsSubject = new BehaviorSubject<Trip[]>([]);
  trips$ = this.tripsSubject.asObservable();

  // True while a freshly-attached listener hasn't received its first snapshot yet
  // (e.g. right after logging in) — lets pages show a spinner instead of a
  // misleading "no trips" state during that first round trip to Firestore.
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  private unsubscribeSnapshot: (() => void) | null = null;

  constructor(
    private authService: AuthService,
    private ngZone: NgZone
  ) {

    this.authService.user$.subscribe(user => {

      this.unsubscribeSnapshot?.();
      this.unsubscribeSnapshot = null;

      if (!user) {
        this.tripsSubject.next([]);
        this.loadingSubject.next(false);
        return;
      }

      this.loadingSubject.next(true);

      const q = query(
        collection(db, 'users', user.uid, 'trips'),
        orderBy('createdAt', 'desc')
      );

      this.unsubscribeSnapshot = onSnapshot(q, snapshot => {
        const trips = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trip));
        this.ngZone.run(() => {
          this.tripsSubject.next(trips);
          this.loadingSubject.next(false);
        });
      });

    });

  }

  getTrips(): Trip[] {
    return this.tripsSubject.value;
  }

  getTrip(id: string): Trip | undefined {
    return this.tripsSubject.value.find(t => t.id === id);
  }

  getActiveTrips(): Trip[] {
    return this.tripsSubject.value.filter(t => t.status === 'ongoing' || t.status === 'planned');
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
