import { Injectable } from '@angular/core';
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

  private unsubscribeSnapshot: (() => void) | null = null;

  constructor(private authService: AuthService) {

    this.authService.user$.subscribe(user => {

      this.unsubscribeSnapshot?.();
      this.unsubscribeSnapshot = null;

      if (!user) {
        this.tripsSubject.next([]);
        return;
      }

      const q = query(
        collection(db, 'users', user.uid, 'trips'),
        orderBy('createdAt', 'desc')
      );

      this.unsubscribeSnapshot = onSnapshot(q, snapshot => {
        const trips = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trip));
        this.tripsSubject.next(trips);
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
